"""
Comprehensive Backend Endpoint Verification Tests.

This test suite verifies all backend endpoints exist and return correct data:
- /api/stats/summary
- /api/finance/*
- /api/pets/*
- /api/analytics/*
- /api/social/*
- /api/ai/*
- /api/games/*

Tests check for:
- Correct HTTP status codes
- Proper response structure and fields
- Data format validation
- No unhandled errors
"""

from __future__ import annotations

import json
import logging
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.pet import Pet, SpeciesEnum
from app.models.user import User, hash_password

# Configure test logging
logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)

# Test report storage
TEST_REPORT: List[Dict[str, Any]] = []


def _log_test_result(
    endpoint: str,
    test_name: str,
    passed: bool,
    status_code: Optional[int] = None,
    response_data: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None,
    request_data: Optional[Dict[str, Any]] = None,
) -> None:
    """Log test results for reporting."""
    result = {
        "endpoint": endpoint,
        "test_name": test_name,
        "passed": passed,
        "status_code": status_code,
        "request_data": request_data,
        "response_data": response_data,
        "error": error,
        "timestamp": datetime.now().isoformat(),
    }
    TEST_REPORT.append(result)
    
    status = "✅ PASS" if passed else "❌ FAIL"
    LOGGER.info(f"{status} | {endpoint} | {test_name}")
    if error:
        LOGGER.error(f"  Error: {error}")
    if status_code:
        LOGGER.info(f"  Status: {status_code}")


def auth_headers(user_id: uuid4) -> dict[str, str]:
    """Generate authentication headers for test user."""
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


async def create_test_user_and_pet(
    db_session: AsyncSession,
    pet_stats: Optional[Dict[str, int]] = None,
) -> tuple[User, Pet]:
    """Helper to create a test user and pet."""
    user = User(
        email=f"endpoint-test-{uuid4()}@example.com",
        password_hash=hash_password("TestPassword123!"),
    )
    db_session.add(user)
    await db_session.flush()

    stats = pet_stats or {
        "hunger": 70,
        "happiness": 75,
        "cleanliness": 80,
        "energy": 70,
        "health": 85,
    }

    pet = Pet(
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=stats["hunger"],
        happiness=stats["happiness"],
        cleanliness=stats["cleanliness"],
        energy=stats["energy"],
        health=stats["health"],
        diary=[],
    )
    db_session.add(pet)
    await db_session.flush()
    await db_session.commit()

    return user, pet


async def cleanup_test_data(
    db_session: AsyncSession,
    user: User,
    pet: Optional[Pet] = None,
) -> None:
    """Clean up test data."""
    if pet:
        await db_session.execute(delete(Pet).where(Pet.id == pet.id))
    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()


# ============================================================================
# STATS ENDPOINT TESTS
# ============================================================================


class TestStatsEndpoint:
    """Tests for /api/stats/summary endpoint."""

    ENDPOINT = "/api/stats/summary"

    @pytest.mark.asyncio
    async def test_stats_summary(self, client: AsyncClient, db_session: AsyncSession):
        """Test stats summary endpoint returns correct structure."""
        user, pet = await create_test_user_and_pet(db_session)

        try:
            response = await client.get(self.ENDPOINT)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, dict), "Response must be a dict"
            
            # Check for expected fields (from StatsSummary schema)
            expected_fields = ["active_users", "pet_species", "unique_breeds", "satisfaction_rate"]
            for field in expected_fields:
                assert field in response_data, f"Missing field: {field}"
                assert isinstance(response_data[field], (int, float)), f"{field} must be a number"

            _log_test_result(
                self.ENDPOINT,
                "test_stats_summary",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_stats_summary",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)


# ============================================================================
# FINANCE ENDPOINT TESTS
# ============================================================================


class TestFinanceEndpoints:
    """Tests for /api/finance/* endpoints."""

    @pytest.mark.asyncio
    async def test_get_finance(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/finance returns correct structure."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/finance", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert "summary" in response_data, "Missing summary field"
            summary = response_data["summary"]
            assert "balance" in summary, "Missing balance field"
            assert isinstance(summary["balance"], (int, float)), "balance must be a number"

            _log_test_result(
                "/api/finance",
                "test_get_finance",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/finance",
                "test_get_finance",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_get_shop_items(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/finance/shop returns list of items."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/finance/shop", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, list), "Response must be a list"

            _log_test_result(
                "/api/finance/shop",
                "test_get_shop_items",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/finance/shop",
                "test_get_shop_items",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_get_leaderboard(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/finance/leaderboard returns leaderboard data."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/finance/leaderboard?metric=balance", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, (dict, list)), "Response must be a dict or list"

            _log_test_result(
                "/api/finance/leaderboard",
                "test_get_leaderboard",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/finance/leaderboard",
                "test_get_leaderboard",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_list_goals(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/finance/goals returns goals list."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/finance/goals", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, list), "Response must be a list"

            _log_test_result(
                "/api/finance/goals",
                "test_list_goals",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/finance/goals",
                "test_list_goals",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)


# ============================================================================
# PETS ENDPOINT TESTS
# ============================================================================


class TestPetsEndpoints:
    """Tests for /api/pets/* endpoints."""

    @pytest.mark.asyncio
    async def test_get_pet(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/pets returns pet data."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/pets", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert "id" in response_data, "Missing id field"
            assert "name" in response_data, "Missing name field"
            assert "species" in response_data, "Missing species field"

            _log_test_result(
                "/api/pets",
                "test_get_pet",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/pets",
                "test_get_pet",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_get_pet_stats(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/pets/stats returns pet stats."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/pets/stats", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, dict), "Response must be a dict"
            
            # Check for stat fields
            stat_fields = ["hunger", "happiness", "cleanliness", "energy", "health"]
            for field in stat_fields:
                assert field in response_data, f"Missing stat field: {field}"
                assert isinstance(response_data[field], (int, float)), f"{field} must be a number"

            _log_test_result(
                "/api/pets/stats",
                "test_get_pet_stats",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/pets/stats",
                "test_get_pet_stats",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_get_pet_diary(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/pets/diary returns diary entries."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/pets/diary", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, list), "Response must be a list"

            _log_test_result(
                "/api/pets/diary",
                "test_get_pet_diary",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/pets/diary",
                "test_get_pet_diary",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_get_pet_health(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/pets/health returns health summary."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/pets/health", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, dict), "Response must be a dict"

            _log_test_result(
                "/api/pets/health",
                "test_get_pet_health",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/pets/health",
                "test_get_pet_health",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)


# ============================================================================
# ANALYTICS ENDPOINT TESTS
# ============================================================================


class TestAnalyticsEndpoints:
    """Tests for /api/analytics/* endpoints."""

    @pytest.mark.asyncio
    async def test_analytics_snapshot(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/analytics/snapshot returns snapshot data."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/analytics/snapshot", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, dict), "Response must be a dict"

            _log_test_result(
                "/api/analytics/snapshot",
                "test_analytics_snapshot",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/analytics/snapshot",
                "test_analytics_snapshot",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_analytics_daily(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/analytics/daily returns daily summary."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/analytics/daily", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, dict), "Response must be a dict"

            _log_test_result(
                "/api/analytics/daily",
                "test_analytics_daily",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/analytics/daily",
                "test_analytics_daily",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_analytics_report(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/analytics/report returns report data."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            today = date.today().isoformat()
            response = await client.get(f"/api/analytics/report?report_date={today}", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, dict), "Response must be a dict"

            _log_test_result(
                "/api/analytics/report",
                "test_analytics_report",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/analytics/report",
                "test_analytics_report",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)


# ============================================================================
# SOCIAL ENDPOINT TESTS
# ============================================================================


class TestSocialEndpoints:
    """Tests for /api/social/* endpoints."""

    @pytest.mark.asyncio
    async def test_get_friends(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/social/friends returns friends list."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/social/friends", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, dict), "Response must be a dict"
            assert "friends" in response_data or "pending" in response_data, "Missing friends or pending fields"

            _log_test_result(
                "/api/social/friends",
                "test_get_friends",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/social/friends",
                "test_get_friends",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_get_public_profiles(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/social/public_profiles returns profiles."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/social/public_profiles", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, dict), "Response must be a dict"
            assert "profiles" in response_data, "Missing profiles field"
            assert isinstance(response_data["profiles"], list), "profiles must be a list"

            _log_test_result(
                "/api/social/public_profiles",
                "test_get_public_profiles",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/social/public_profiles",
                "test_get_public_profiles",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_get_social_leaderboard(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/social/leaderboard returns leaderboard."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/social/leaderboard?metric=xp", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, dict), "Response must be a dict"

            _log_test_result(
                "/api/social/leaderboard",
                "test_get_social_leaderboard",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/social/leaderboard",
                "test_get_social_leaderboard",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)


# ============================================================================
# AI ENDPOINT TESTS
# ============================================================================


class TestAIEndpoints:
    """Tests for /api/ai/* endpoints."""

    @pytest.mark.asyncio
    async def test_ai_chat(self, client: AsyncClient, db_session: AsyncSession):
        """Test POST /api/ai/chat returns chat response."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {
            "message": "How is my pet doing?",
            "session_id": str(uuid4()),
        }

        try:
            response = await client.post("/api/ai/chat", json=request_data, headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert "message" in response_data, "Missing message field"
            assert isinstance(response_data["message"], str), "message must be a string"

            _log_test_result(
                "/api/ai/chat",
                "test_ai_chat",
                True,
                response.status_code,
                response_data,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/ai/chat",
                "test_ai_chat",
                False,
                None,
                None,
                str(e),
                request_data=request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)


# ============================================================================
# GAMES ENDPOINT TESTS
# ============================================================================


class TestGamesEndpoints:
    """Tests for /api/games/* endpoints."""

    @pytest.mark.asyncio
    async def test_games_leaderboard(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/games/leaderboard returns leaderboard."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/games/leaderboard?game_type=memory", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, dict), "Response must be a dict"
            assert "entries" in response_data, "Missing entries field"
            assert isinstance(response_data["entries"], list), "entries must be a list"

            _log_test_result(
                "/api/games/leaderboard",
                "test_games_leaderboard",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/games/leaderboard",
                "test_games_leaderboard",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_games_rewards(self, client: AsyncClient, db_session: AsyncSession):
        """Test GET /api/games/rewards returns rewards summary."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get("/api/games/rewards?game_type=memory", headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, dict), "Response must be a dict"

            _log_test_result(
                "/api/games/rewards",
                "test_games_rewards",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                "/api/games/rewards",
                "test_games_rewards",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)


# ============================================================================
# TEST REPORT GENERATION
# ============================================================================


def pytest_sessionfinish(session, exitstatus):
    """Generate test report after all tests complete."""
    report_path = Path("BACKEND_ENDPOINTS_VERIFICATION_REPORT.json")
    
    # Calculate summary
    total = len(TEST_REPORT)
    passed = sum(1 for r in TEST_REPORT if r["passed"])
    failed = total - passed
    
    # Group by endpoint category
    category_summary: Dict[str, Dict[str, int]] = {}
    for result in TEST_REPORT:
        endpoint = result["endpoint"]
        # Determine category
        if "/api/stats" in endpoint:
            category = "stats"
        elif "/api/finance" in endpoint:
            category = "finance"
        elif "/api/pets" in endpoint:
            category = "pets"
        elif "/api/analytics" in endpoint:
            category = "analytics"
        elif "/api/social" in endpoint:
            category = "social"
        elif "/api/ai" in endpoint:
            category = "ai"
        elif "/api/games" in endpoint:
            category = "games"
        else:
            category = "other"
        
        if category not in category_summary:
            category_summary[category] = {"total": 0, "passed": 0, "failed": 0}
        category_summary[category]["total"] += 1
        if result["passed"]:
            category_summary[category]["passed"] += 1
        else:
            category_summary[category]["failed"] += 1
    
    report = {
        "summary": {
            "total_tests": total,
            "passed": passed,
            "failed": failed,
            "success_rate": f"{(passed / total * 100):.1f}%" if total > 0 else "0%",
        },
        "category_summary": category_summary,
        "test_results": TEST_REPORT,
        "generated_at": datetime.now().isoformat(),
    }
    
    # Write JSON report
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    
    # Write human-readable markdown report
    md_report_path = Path("BACKEND_ENDPOINTS_VERIFICATION_REPORT.md")
    with open(md_report_path, "w") as f:
        f.write("# Backend Endpoints Verification Report\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("## Summary\n\n")
        f.write(f"- **Total Tests:** {total}\n")
        f.write(f"- **Passed:** {passed} ✅\n")
        f.write(f"- **Failed:** {failed} ❌\n")
        f.write(f"- **Success Rate:** {report['summary']['success_rate']}\n\n")
        
        f.write("## Category Summary\n\n")
        f.write("| Category | Total | Passed | Failed | Status |\n")
        f.write("|----------|-------|--------|--------|--------|\n")
        for category, stats in sorted(category_summary.items()):
            status_icon = "✅" if stats["failed"] == 0 else "⚠️"
            f.write(f"| {category} {status_icon} | {stats['total']} | {stats['passed']} | {stats['failed']} | {'PASS' if stats['failed'] == 0 else 'FAIL'} |\n")
        
        f.write("\n## Test Results\n\n")
        for result in TEST_REPORT:
            status_icon = "✅" if result["passed"] else "❌"
            f.write(f"### {status_icon} {result['test_name']}\n\n")
            f.write(f"- **Endpoint:** `{result['endpoint']}`\n")
            f.write(f"- **Status:** {'PASS' if result['passed'] else 'FAIL'}\n")
            if result["status_code"]:
                f.write(f"- **HTTP Status:** {result['status_code']}\n")
            if result["error"]:
                f.write(f"- **Error:** {result['error']}\n")
            f.write(f"- **Timestamp:** {result['timestamp']}\n\n")
    
    LOGGER.info(f"Test report written to {report_path}")
    LOGGER.info(f"Markdown report written to {md_report_path}")
    LOGGER.info(f"Summary: {passed}/{total} tests passed ({report['summary']['success_rate']})")

