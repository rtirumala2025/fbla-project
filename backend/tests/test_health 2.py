from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_health_endpoint(test_client: AsyncClient) -> None:
    response = await test_client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
