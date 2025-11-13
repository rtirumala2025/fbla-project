from __future__ import annotations

from datetime import datetime
from typing import AsyncIterator

import pytest
from fastapi import status
from httpx import AsyncClient

from app.models import AuthenticatedUser
from app.schemas import (
    EvolutionStage,
    PetResponse,
    PetStats,
)
from app.services.accessory_service import AccessoryService
from app.utils.dependencies import get_accessory_service, get_current_user, get_pet_service


class FakePetService:
    def __init__(self) -> None:
        now = datetime.utcnow()
        self.pet = PetResponse(
            id="pet-abc",
            user_id="user-xyz",
            name="Nova",
            species="dragon",
            breed="Azure",
            color="cerulean",
            created_at=now,
            updated_at=now,
            stats=PetStats(
                hunger=80,
                hygiene=70,
                energy=75,
                mood="happy",
                health=90,
                xp=120,
                level=5,
                evolution_stage=EvolutionStage.juvenile,
                is_sick=False,
            ),
            diary=[],
        )

    async def get_pet(self, user_id: str) -> PetResponse | None:
        return self.pet if user_id == self.pet.user_id else None


@pytest.fixture()
def accessory_overrides(monkeypatch: pytest.MonkeyPatch) -> AsyncIterator[AccessoryService]:
    service = AccessoryService(pool=None)
    fake_pet_service = FakePetService()

    async def _current_user():
        return AuthenticatedUser(id="user-xyz", email="nova@example.com")

    from app.main import app

    app.dependency_overrides[get_current_user] = _current_user
    app.dependency_overrides[get_pet_service] = lambda: fake_pet_service
    app.dependency_overrides[get_accessory_service] = lambda: service

    yield service

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_pet_service, None)
    app.dependency_overrides.pop(get_accessory_service, None)


@pytest.mark.anyio
async def test_list_accessories(test_client: AsyncClient, accessory_overrides: AccessoryService) -> None:
    response = await test_client.get("/api/accessories")
    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert "accessories" in payload and len(payload["accessories"]) >= 1
    accessory_names = {item["name"] for item in payload["accessories"]}
    assert "Stargazer Cap" in accessory_names


@pytest.mark.anyio
async def test_equip_and_unequip_accessory(test_client: AsyncClient, accessory_overrides: AccessoryService) -> None:
    equip_payload = {
        "accessory_id": "11111111-1111-1111-1111-111111111111",
        "pet_id": "pet-abc",
        "equipped": True,
    }
    response = await test_client.post("/api/accessories/equip", json=equip_payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["equipped"] is True
    assert data["equipped_color"] == "#fde047"  # happy mood palette color
    assert data["applied_mood"] == "happy"

    unequip_payload = {
        "accessory_id": equip_payload["accessory_id"],
        "pet_id": "pet-abc",
        "equipped": False,
    }
    response = await test_client.post("/api/accessories/equip", json=unequip_payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["equipped"] is False

