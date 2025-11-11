from __future__ import annotations

import pytest
import respx
from httpx import Response

from app.core.config import get_settings
from app.services.pet_art_service import PetArtService


@pytest.fixture(autouse=True)
def configure_openai(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-image-key")
    monkeypatch.setenv("OPENAI_IMAGE_MODEL", "gpt-image-stub")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.mark.anyio
@respx.mock
async def test_pet_art_service_uses_cache(monkeypatch: pytest.MonkeyPatch):
    mock_response = {"data": [{"b64_json": "ZmFrZS1pbWFnZS1kYXRh"}]}
    respx.post("https://api.openai.com/v1/images/generations").mock(return_value=Response(200, json=mock_response))

    service = PetArtService(pool=None)
    base_prompt = "Illustrate a heroic dragon companion."
    accessories = [
        {
            "accessory_id": "11111111-1111-1111-1111-111111111111",
            "name": "Stargazer Cap",
            "type": "hat",
            "rarity": "rare",
            "color_palette": {"happy": "#fde047"},
        }
    ]

    entry, cached = await service.generate_pet_art(
        user_id="user-xyz",
        pet_id="pet-abc",
        mood="happy",
        accessories=accessories,
        style="watercolor",
        base_prompt=base_prompt,
        force_refresh=False,
    )
    assert cached is False
    assert entry.metadata["palette"]["happy"] == "#fde047"

    entry_again, cached_again = await service.generate_pet_art(
        user_id="user-xyz",
        pet_id="pet-abc",
        mood="happy",
        accessories=accessories,
        style="watercolor",
        base_prompt=base_prompt,
        force_refresh=False,
    )
    assert cached_again is True
    assert entry_again.image_base64 == entry.image_base64
    assert respx.calls.call_count == 1

