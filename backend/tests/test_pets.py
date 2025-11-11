from __future__ import annotations

from datetime import datetime
from typing import Any

import pytest
from fastapi import status
from httpx import AsyncClient

from app.models import AuthenticatedUser, Pet, PetDiaryEntry, PetStats as DomainPetStats
from app.schemas import (
    PetAction,
    PetActionRequest,
    PetActionResponse,
    PetCreate,
    PetDiaryCreate,
    PetDiaryEntryResponse,
    PetResponse,
    PetStats,
    PetUpdate,
)
from app.services.pet_service import PetService
from app.utils.dependencies import get_current_user, get_pet_service


class FakePetService:
    def __init__(self) -> None:
        self.last_action: tuple[PetAction, PetActionRequest] | None = None
        self.diary_entries = [
            PetDiaryEntryResponse(id="entry-1", mood="happy", note="Went for a walk", created_at=datetime.utcnow()),
        ]
        self.pet = PetResponse(
            id="pet-123",
            user_id="user-123",
            name="Pixel",
            species="dragon",
            breed="Azure",
            color="blue",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            stats=PetStats(
                hunger=70,
                hygiene=80,
                energy=65,
                mood="content",
                health=90,
                xp=40,
                level=3,
                evolution_stage="juvenile",
                is_sick=False,
            ),
            diary=self.diary_entries.copy(),
        )
        self.pet_exists = True

    async def get_pet(self, user_id: str) -> PetResponse | None:
        return self.pet if self.pet_exists else None

    async def create_pet(self, user_id: str, payload: PetCreate) -> PetResponse:
        self.pet = self.pet.model_copy(update={"name": payload.name, "species": payload.species})
        return self.pet

    async def update_pet(self, user_id: str, payload: PetUpdate) -> PetResponse:
        data: dict[str, Any] = payload.model_dump(exclude_none=True)
        self.pet = self.pet.model_copy(update=data)
        return self.pet

    async def apply_action(
        self,
        user_id: str,
        action: PetAction,
        payload: PetActionRequest,
    ) -> PetActionResponse:
        self.last_action = (action, payload)
        return PetActionResponse(
            pet=self.pet,
            reaction="cheers",
            mood=self.pet.stats.mood,
            notifications=["Stay playful!"],
            health_forecast={"trend": "steady", "risk": "low", "recommended_actions": ["Keep bonding!"]},
        )

    async def get_diary(self, user_id: str) -> list[PetDiaryEntryResponse]:
        return self.diary_entries

    async def add_diary_entry(
        self,
        user_id: str,
        pet_id: str,
        payload: PetDiaryCreate,
    ) -> PetDiaryEntryResponse:
        entry = PetDiaryEntryResponse(id="entry-2", mood=payload.mood, note=payload.note, created_at=datetime.utcnow())
        self.diary_entries.insert(0, entry)
        return entry


@pytest.fixture(autouse=True)
def override_pet_dependencies(monkeypatch: pytest.MonkeyPatch):
    fake_service = FakePetService()

    async def _current_user_override():
        return AuthenticatedUser(id="user-123", email="test@example.com")

    from app.main import app

    app.dependency_overrides[get_current_user] = _current_user_override
    app.dependency_overrides[get_pet_service] = lambda: fake_service

    yield fake_service

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_pet_service, None)


@pytest.mark.anyio
async def test_fetch_pet(test_client: AsyncClient, override_pet_dependencies) -> None:
    response = await test_client.get("/api/pets")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Pixel"


@pytest.mark.anyio
async def test_fetch_pet_not_found(test_client: AsyncClient, override_pet_dependencies) -> None:
    fake_service: FakePetService = override_pet_dependencies
    fake_service.pet_exists = False
    response = await test_client.get("/api/pets")
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.anyio
async def test_create_pet_endpoint(test_client: AsyncClient, override_pet_dependencies) -> None:
    response = await test_client.post(
        "/api/pets",
        json={"name": "Nova", "species": "fox", "breed": "Fennec", "color": "amber"},
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["name"] == "Nova"


@pytest.mark.anyio
async def test_update_pet_endpoint(test_client: AsyncClient, override_pet_dependencies) -> None:
    response = await test_client.patch(
        "/api/pets",
        json={"name": "Pixel 2"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["name"] == "Pixel 2"


@pytest.mark.anyio
async def test_pet_action_endpoint(test_client: AsyncClient, override_pet_dependencies) -> None:
    response = await test_client.post(
        "/api/pets/actions/feed",
        json={"food_type": "treat"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["reaction"] == "cheers"
    assert "Stay playful!" in response.json()["notifications"]
    assert response.json()["health_forecast"]["trend"] == "steady"


@pytest.mark.anyio
async def test_pet_diary_endpoints(test_client: AsyncClient, override_pet_dependencies) -> None:
    list_response = await test_client.get("/api/pets/diary")
    assert list_response.status_code == status.HTTP_200_OK
    assert isinstance(list_response.json(), list)

    create_response = await test_client.post(
        "/api/pets/diary",
        json={"mood": "curious", "note": "Discovered a shiny object."},
    )
    assert create_response.status_code == status.HTTP_201_CREATED
    assert create_response.json()["mood"] == "curious"


@pytest.mark.anyio
async def test_pet_interact_endpoint_triggers_action(
    test_client: AsyncClient,
    override_pet_dependencies: FakePetService,
) -> None:
    response = await test_client.post(
        "/api/pet/interact",
        json={"session_id": "session-1", "action": "feed", "message": "berries"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["session_id"] == "session-1"
    assert data["mood"] == override_pet_dependencies.pet.stats.mood
    assert data["pet_state"]["hunger"] == override_pet_dependencies.pet.stats.hunger
    assert data["health_forecast"]["risk"] == "low"
    assert override_pet_dependencies.last_action is not None


@pytest.mark.anyio
async def test_pet_interact_status_snapshot(
    test_client: AsyncClient,
    override_pet_dependencies: FakePetService,
) -> None:
    response = await test_client.post(
        "/api/pet/interact",
        json={"session_id": "session-1", "action": "status"},
    )
    assert response.status_code == status.HTTP_200_OK
    payload = response.json()
    assert "status" not in payload["notifications"]
    assert payload["health_forecast"]["trend"] == "steady"


@pytest.mark.anyio
async def test_pet_interact_unknown_command_returns_error(test_client: AsyncClient) -> None:
    response = await test_client.post(
        "/api/pet/interact",
        json={"action": "dance"},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def _sample_domain_pet() -> Pet:
    now = datetime.utcnow()
    stats = DomainPetStats(
        hunger=35,
        hygiene=25,
        energy=40,
        mood="content",
        health=60,
        xp=140,
        level=4,
        evolution_stage="juvenile",
        is_sick=False,
    )
    diary = [
        PetDiaryEntry(id="entry", mood="content", note="", created_at=now),
    ]
    return Pet(
        id="pet-1",
        user_id="user-1",
        name="Comet",
        species="cat",
        breed="Siamese",
        color="cream",
        created_at=now,
        updated_at=now,
        stats=stats,
        diary=diary,
    )


def test_action_logic_triggers_evolution():
    service = PetService(pool=None)
    pet = _sample_domain_pet()
    updated_pet, reaction, diary_entry = service._apply_action(pet, PetAction.play, PetActionRequest(game_type="fetch"))
    assert reaction
    assert updated_pet.stats.level >= pet.stats.level
    assert updated_pet.stats.evolution_stage in {"juvenile", "adult", "legendary"}
    assert diary_entry is not None


def test_action_logic_marks_illness():
    service = PetService(pool=None)
    pet = _sample_domain_pet()
    pet.stats.hunger = 5
    updated_pet, _, diary_entry = service._apply_action(pet, PetAction.rest, PetActionRequest(duration_hours=1))
    assert updated_pet.stats.is_sick is True
    assert diary_entry is not None
*** End Patch