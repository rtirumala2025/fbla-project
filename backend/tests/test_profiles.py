from __future__ import annotations

import pytest
from fastapi import status
from httpx import AsyncClient

from app.models import AuthenticatedUser
from app.schemas import Preferences, ProfileCreate, ProfileResponse, ProfileUpdate
from app.services.profile_service import ProfileService
from app.services.storage_service import StorageService
from app.utils.dependencies import get_current_user, get_profile_service, get_storage_service


class FakeProfileService(ProfileService):
    def __init__(self) -> None:
        super().__init__(pool=None)
        self.profile = ProfileResponse(
            user_id="user-123",
            username="tester",
            avatar_url=None,
            coins=100,
            preferences=Preferences(),
        )
        self.created = False
        self.updated = False
        self.deleted = False
        self.avatar_set = False

    async def get_profile(self, user_id: str) -> ProfileResponse | None:
        return self.profile if user_id == "user-123" else None

    async def create_profile(self, user_id: str, payload: ProfileCreate) -> ProfileResponse:
        self.created = True
        self.profile = ProfileResponse(
            user_id=user_id,
            username=payload.username,
            avatar_url=payload.avatar_url,
            coins=100,
            preferences=payload.preferences or Preferences(),
        )
        return self.profile

    async def update_profile(self, user_id: str, payload: ProfileUpdate) -> ProfileResponse:
        self.updated = True
        if payload.username:
            self.profile.username = payload.username
        if payload.preferences:
            self.profile.preferences = payload.preferences
        return self.profile

    async def delete_profile(self, user_id: str) -> None:
        self.deleted = True

    async def set_avatar_url(self, user_id: str, avatar_url: str) -> ProfileResponse:
        self.avatar_set = True
        self.profile.avatar_url = avatar_url
        return self.profile


class FakeStorageService(StorageService):
    def __init__(self) -> None:
        super().__init__(client=None)

    async def upload_avatar(self, user_id: str, file):  # type: ignore[override]
        return f"https://storage.example.com/{user_id}/avatar.png"


@pytest.fixture(autouse=True)
def override_dependencies(monkeypatch: pytest.MonkeyPatch):
    fake_profile_service = FakeProfileService()
    fake_storage_service = FakeStorageService()

    def _profile_service_override():
        return fake_profile_service

    def _storage_service_override():
        return fake_storage_service

    async def _current_user_override():
        return AuthenticatedUser(id="user-123", email="tester@example.com")

    from app.main import app

    app.dependency_overrides[get_profile_service] = _profile_service_override
    app.dependency_overrides[get_storage_service] = _storage_service_override
    app.dependency_overrides[get_current_user] = _current_user_override

    yield fake_profile_service, fake_storage_service

    app.dependency_overrides.pop(get_profile_service, None)
    app.dependency_overrides.pop(get_storage_service, None)
    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.anyio
async def test_get_profile(test_client: AsyncClient, override_dependencies) -> None:
    response = await test_client.get("/api/profiles/me")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["username"] == "tester"


@pytest.mark.anyio
async def test_create_profile(test_client: AsyncClient, override_dependencies) -> None:
    response = await test_client.post(
        "/api/profiles",
        json={"username": "newname"},
    )
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["username"] == "newname"


@pytest.mark.anyio
async def test_update_profile(test_client: AsyncClient, override_dependencies) -> None:
    response = await test_client.put(
        "/api/profiles/me",
        json={"username": "updated"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["username"] == "updated"


@pytest.mark.anyio
async def test_delete_profile(test_client: AsyncClient, override_dependencies) -> None:
    response = await test_client.delete("/api/profiles/me")
    assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.anyio
async def test_upload_avatar(test_client: AsyncClient, override_dependencies) -> None:
    files = {"file": ("avatar.png", b"fake-image", "image/png")}
    response = await test_client.post("/api/profiles/me/avatar", files=files)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["avatar_url"].startswith("https://storage.example.com")
