"\"\"\"Unit tests for the Pet model helpers.\"\"\""

from __future__ import annotations

from datetime import date
from uuid import uuid4

from app.models.pet import Pet, SpeciesEnum


def test_pet_age_calculates_correctly():
    today = date.today()
    birthday = date(today.year - 3, today.month, max(1, today.day - 1))
    pet = Pet(
        id=uuid4(),
        user_id=uuid4(),
        name="Bolt",
        species=SpeciesEnum.DOG,
        breed="Beagle",
        color_pattern="Tri-color",
        birthday=birthday,
    )

    assert pet.age == 3

    future_pet = Pet(
        id=uuid4(),
        user_id=uuid4(),
        name="Kit",
        species=SpeciesEnum.CAT,
        breed="Siamese",
        color_pattern="Cream",
        birthday=date(today.year + 1, today.month, today.day),
    )
    assert future_pet.age == 0

