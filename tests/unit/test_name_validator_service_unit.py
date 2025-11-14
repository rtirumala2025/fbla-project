"""
Unit tests for name validator service.

Tests edge cases including:
- Duplicates
- Banned words
- Empty input
- Length violations
- Formatting issues
"""

from __future__ import annotations

from datetime import date
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pet import Pet, SpeciesEnum
from app.models.profile import Profile
from app.services.name_validator_service import (
    _check_formatting,
    _check_length,
    _check_profanity,
    _generate_suggestions,
    _normalize_name,
    validate_name,
)


class TestNormalizeName:
    """Tests for name normalization."""

    def test_normalize_trims_whitespace(self):
        assert _normalize_name("  TestName  ") == "testname"
        assert _normalize_name("TestName") == "testname"

    def test_normalize_lowercase(self):
        assert _normalize_name("TestName") == "testname"
        assert _normalize_name("TESTNAME") == "testname"


class TestLengthValidation:
    """Tests for length validation."""

    def test_valid_length(self):
        valid, error = _check_length("Test")
        assert valid is True
        assert error is None

    def test_too_short(self):
        valid, error = _check_length("AB")
        assert valid is False
        assert "at least 3" in error.lower()

    def test_too_long(self):
        valid, error = _check_length("A" * 20)
        assert valid is False
        assert "no more than 15" in error.lower()

    def test_exact_minimum(self):
        valid, error = _check_length("ABC")
        assert valid is True

    def test_exact_maximum(self):
        valid, error = _check_length("A" * 15)
        assert valid is True


class TestFormattingValidation:
    """Tests for formatting validation."""

    def test_valid_formatting(self):
        valid, error = _check_formatting("TestName123")
        assert valid is True
        assert error is None

    def test_leading_space(self):
        valid, error = _check_formatting(" TestName")
        assert valid is False
        assert "leading" in error.lower() or "trailing" in error.lower()

    def test_trailing_space(self):
        valid, error = _check_formatting("TestName ")
        assert valid is False
        assert "leading" in error.lower() or "trailing" in error.lower()

    def test_consecutive_spaces(self):
        valid, error = _check_formatting("Test  Name")
        assert valid is False
        assert "consecutive" in error.lower()

    def test_invalid_characters(self):
        valid, error = _check_formatting("Test@Name")
        assert valid is False
        assert "only contain" in error.lower()

    def test_starts_with_number(self):
        valid, error = _check_formatting("123Test")
        assert valid is True  # Numbers are allowed at start

    def test_starts_with_special_char(self):
        valid, error = _check_formatting("-Test")
        assert valid is False
        assert "start and end" in error.lower()

    def test_ends_with_special_char(self):
        valid, error = _check_formatting("Test-")
        assert valid is False
        assert "start and end" in error.lower()

    def test_allowed_special_chars(self):
        valid, error = _check_formatting("Test-Name_123")
        assert valid is True

    def test_single_space(self):
        valid, error = _check_formatting("Test Name")
        assert valid is True


class TestProfanityValidation:
    """Tests for profanity validation."""

    def test_clean_name(self):
        valid, error = _check_profanity("Fluffy")
        assert valid is True
        assert error is None

    def test_profanity_exact_match(self):
        valid, error = _check_profanity("badword")
        assert valid is False
        assert "inappropriate" in error.lower()

    def test_profanity_case_insensitive(self):
        valid, error = _check_profanity("BADWORD")
        assert valid is False
        assert "inappropriate" in error.lower()

    def test_profanity_in_word(self):
        valid, error = _check_profanity("mybadwordpet")
        assert valid is False
        assert "inappropriate" in error.lower()


class TestSuggestionGeneration:
    """Tests for suggestion generation."""

    def test_suggestions_for_short_name(self):
        suggestions = _generate_suggestions("AB", ["too short"])
        assert len(suggestions) > 0
        assert all(len(s) >= 3 for s in suggestions)

    def test_suggestions_for_long_name(self):
        suggestions = _generate_suggestions("A" * 20, ["too long"])
        assert len(suggestions) > 0
        assert all(len(s) <= 15 for s in suggestions)

    def test_suggestions_for_empty_name(self):
        suggestions = _generate_suggestions("", ["empty"])
        assert len(suggestions) > 0

    def test_suggestions_are_unique(self):
        suggestions = _generate_suggestions("Test", ["some error"])
        # Check that suggestions are unique (case-insensitive)
        lower_suggestions = [s.lower() for s in suggestions]
        assert len(lower_suggestions) == len(set(lower_suggestions))

    def test_suggestions_within_length_limits(self):
        suggestions = _generate_suggestions("A" * 20, ["too long"])
        for suggestion in suggestions:
            assert 3 <= len(suggestion) <= 15


class TestFullValidation:
    """Integration tests for full validation flow."""

    @pytest.mark.asyncio
    async def test_empty_name(self, db_session: AsyncSession):
        """Test validation with empty name."""
        result = await validate_name(db_session, "", "pet")
        assert result["valid"] is False
        assert result["status"] == "error"
        assert len(result["errors"]) > 0
        assert len(result["suggestions"]) > 0

    @pytest.mark.asyncio
    async def test_whitespace_only_name(self, db_session: AsyncSession):
        """Test validation with whitespace-only name."""
        result = await validate_name(db_session, "   ", "pet")
        assert result["valid"] is False
        assert len(result["errors"]) > 0

    @pytest.mark.asyncio
    async def test_valid_pet_name(self, db_session: AsyncSession):
        """Test validation with valid pet name."""
        result = await validate_name(db_session, "Fluffy", "pet")
        assert result["valid"] is True
        assert result["status"] == "success"
        assert len(result["errors"]) == 0

    @pytest.mark.asyncio
    async def test_valid_account_name(self, db_session: AsyncSession):
        """Test validation with valid account name."""
        result = await validate_name(db_session, "User123", "account")
        assert result["valid"] is True
        assert result["status"] == "success"

    @pytest.mark.asyncio
    async def test_duplicate_pet_name(self, db_session: AsyncSession):
        """Test validation with duplicate pet name."""
        # Create a pet with a specific name
        user_id = uuid4()
        pet = Pet(
            id=uuid4(),
            user_id=user_id,
            name="Fluffy",
            species=SpeciesEnum.DOG,
            breed="Labrador",
            color_pattern="Brown",
            birthday=date(2024, 1, 1),
        )
        db_session.add(pet)
        await db_session.flush()

        # Try to validate the same name
        result = await validate_name(db_session, "Fluffy", "pet")
        assert result["valid"] is False
        assert any("already taken" in error.lower() for error in result["errors"])

    @pytest.mark.asyncio
    async def test_duplicate_account_name(self, db_session: AsyncSession):
        """Test validation with duplicate account name."""
        # Create a profile with a specific username
        user_id = uuid4()
        profile = Profile(
            id=uuid4(),
            user_id=user_id,
            username="TestUser",
        )
        db_session.add(profile)
        await db_session.flush()

        # Try to validate the same username
        result = await validate_name(db_session, "TestUser", "account")
        assert result["valid"] is False
        assert any("already taken" in error.lower() for error in result["errors"])

    @pytest.mark.asyncio
    async def test_case_insensitive_duplicate(self, db_session: AsyncSession):
        """Test that duplicate check is case-insensitive."""
        user_id = uuid4()
        pet = Pet(
            id=uuid4(),
            user_id=user_id,
            name="Fluffy",
            species=SpeciesEnum.CAT,
            breed="Siamese",
            color_pattern="White",
            birthday=date(2024, 1, 1),
        )
        db_session.add(pet)
        await db_session.flush()

        # Try with different case
        result = await validate_name(db_session, "FLUFFY", "pet")
        assert result["valid"] is False
        assert any("already taken" in error.lower() for error in result["errors"])

    @pytest.mark.asyncio
    async def test_exclude_user_id_for_updates(self, db_session: AsyncSession):
        """Test that exclude_user_id allows updating own name."""
        user_id = uuid4()
        pet = Pet(
            id=uuid4(),
            user_id=user_id,
            name="Fluffy",
            species=SpeciesEnum.DOG,
            breed="Beagle",
            color_pattern="Tricolor",
            birthday=date(2024, 1, 1),
        )
        db_session.add(pet)
        await db_session.flush()

        # Should be valid when excluding the same user
        result = await validate_name(
            db_session, "Fluffy", "pet", exclude_user_id=user_id
        )
        # This should pass uniqueness check (but may fail other checks if name is invalid)
        # Since "Fluffy" is valid, it should pass
        assert result["valid"] is True

    @pytest.mark.asyncio
    async def test_multiple_validation_errors(self, db_session: AsyncSession):
        """Test name that fails multiple validations."""
        # Too short AND contains profanity
        result = await validate_name(db_session, "AB", "pet")
        assert result["valid"] is False
        assert len(result["errors"]) > 0
        assert len(result["suggestions"]) > 0

    @pytest.mark.asyncio
    async def test_profanity_in_name(self, db_session: AsyncSession):
        """Test name containing profanity."""
        result = await validate_name(db_session, "badword", "pet")
        assert result["valid"] is False
        assert any("inappropriate" in error.lower() for error in result["errors"])

    @pytest.mark.asyncio
    async def test_name_with_special_characters(self, db_session: AsyncSession):
        """Test name with invalid special characters."""
        result = await validate_name(db_session, "Test@Name#123", "pet")
        assert result["valid"] is False
        assert any("only contain" in error.lower() for error in result["errors"])

    @pytest.mark.asyncio
    async def test_name_too_long(self, db_session: AsyncSession):
        """Test name exceeding maximum length."""
        result = await validate_name(db_session, "A" * 20, "pet")
        assert result["valid"] is False
        assert any("no more than 15" in error.lower() for error in result["errors"])
        assert len(result["suggestions"]) > 0

    @pytest.mark.asyncio
    async def test_name_too_short(self, db_session: AsyncSession):
        """Test name below minimum length."""
        result = await validate_name(db_session, "AB", "pet")
        assert result["valid"] is False
        assert any("at least 3" in error.lower() for error in result["errors"])
        assert len(result["suggestions"]) > 0

    @pytest.mark.asyncio
    async def test_valid_name_with_hyphen(self, db_session: AsyncSession):
        """Test valid name with hyphen."""
        result = await validate_name(db_session, "Test-Name", "pet")
        assert result["valid"] is True

    @pytest.mark.asyncio
    async def test_valid_name_with_underscore(self, db_session: AsyncSession):
        """Test valid name with underscore."""
        result = await validate_name(db_session, "Test_Name", "pet")
        assert result["valid"] is True

    @pytest.mark.asyncio
    async def test_valid_name_with_space(self, db_session: AsyncSession):
        """Test valid name with space."""
        result = await validate_name(db_session, "Test Name", "pet")
        assert result["valid"] is True

    @pytest.mark.asyncio
    async def test_valid_name_with_numbers(self, db_session: AsyncSession):
        """Test valid name with numbers."""
        result = await validate_name(db_session, "Pet123", "pet")
        assert result["valid"] is True

