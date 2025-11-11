"""Authentication-related domain models."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(slots=True)
class AuthenticatedUser:
    id: str
    email: Optional[str] = None
    role: Optional[str] = None
