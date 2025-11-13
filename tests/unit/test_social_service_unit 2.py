"\"\"\"Unit tests for social service helper functions.\"\"\""

from __future__ import annotations

from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest

from app.services import social_service


def test_ensure_uuid_accepts_strings():
    uid = uuid4()
    assert social_service._ensure_uuid(uid) == uid
    assert social_service._ensure_uuid(str(uid)) == uid


class FakeScalarResult:
    def __init__(self, data):
        self._data = data

    def all(self):
        return list(self._data)

    def first(self):
        return self._data[0] if self._data else None

    def scalar_one_or_none(self):
        return self.first()

    def __iter__(self):
        return iter(self._data)

    def scalars(self):
        return self


class FakeSession:
    def __init__(self, responses):
        self._responses = responses
        self.calls = 0

    async def execute(self, *_args, **_kwargs):
        response = self._responses[self.calls]
        self.calls += 1
        return FakeScalarResult(response)


@pytest.mark.asyncio
async def test_fetch_public_profiles_deduplicates_and_includes_self():
    user_id = uuid4()
    other_id = uuid4()
    profile_self = SimpleNamespace(
        id=uuid4(),
        user_id=user_id,
        pet_id=uuid4(),
        display_name="Self",
        bio="Tester",
        achievements=[{"name": "Champion"}],
        total_xp=3000,
        total_coins=1200,
        is_visible=True,
    )
    profile_other = SimpleNamespace(
        id=uuid4(),
        user_id=other_id,
        pet_id=uuid4(),
        display_name="Friend",
        bio="Companion",
        achievements=[],
        total_xp=2500,
        total_coins=800,
        is_visible=True,
    )
    session = FakeSession(
        responses=[
            [profile_other, profile_self],  # public profiles query
            [profile_self],  # own profile fallback
        ]
    )

    summaries = await social_service.fetch_public_profiles(session, user_id)
    assert len(summaries) == 2
    user_ids = {summary.user_id for summary in summaries}
    assert user_ids == {user_id, other_id}

