"""
ORM model for customizable pets.

Represents the configuration a user chooses for their virtual companion,
including species, breed, and cosmetic attributes.
"""

from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class SpeciesEnum(str, Enum):
    """Enumerated pet species, including a couple of hidden unlocks."""

    DOG = "dog"
    CAT = "cat"
    BIRD = "bird"
    RABBIT = "rabbit"
    FOX = "fox"  # Hidden unlock
    DRAGON = "dragon"  # Hidden unlock


BREED_OPTIONS: dict[SpeciesEnum, list[str]] = {
    SpeciesEnum.DOG: ["Labrador", "Poodle", "Beagle", "Husky", "Shiba"],
    SpeciesEnum.CAT: ["Siamese", "Maine Coon", "Bengal", "Sphynx"],
    SpeciesEnum.BIRD: ["Parakeet", "Cockatiel", "Macaw", "Finch"],
    SpeciesEnum.RABBIT: ["Lop", "Lionhead", "Dutch", "Rex"],
    SpeciesEnum.FOX: ["Arctic", "Fennec", "Silver"],
    SpeciesEnum.DRAGON: ["Emerald", "Crimson", "Azure"],
}


class Pet(Base, TimestampMixin):
    """
    SQLAlchemy model for a user's customized pet.
    """

    __tablename__ = "pets"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_pets_user_id"),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    species: Mapped[str] = mapped_column(String(50), nullable=False)
    breed: Mapped[str] = mapped_column(String(50), nullable=False)
    color_pattern: Mapped[str] = mapped_column(String(50), nullable=False)
    birthday: Mapped[date] = mapped_column(Date, nullable=False)

    hunger: Mapped[int] = mapped_column(Integer, nullable=False, default=70)
    happiness: Mapped[int] = mapped_column(Integer, nullable=False, default=70)
    cleanliness: Mapped[int] = mapped_column(Integer, nullable=False, default=70)
    energy: Mapped[int] = mapped_column(Integer, nullable=False, default=70)
    health: Mapped[int] = mapped_column(Integer, nullable=False, default=80)

    last_fed: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_played: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_bathed: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_slept: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    mood: Mapped[str] = mapped_column(String(20), nullable=False, default="happy")
    diary: Mapped[List[dict[str, str]]] = mapped_column(JSONB, nullable=False, default=list)
    traits: Mapped[Dict[str, str]] = mapped_column(JSONB, nullable=False, default=dict)

    user = relationship("User", backref="pet", lazy="joined")

    @property
    def age(self) -> int:
        """
        Compute age in years based on the birthday.
        """

        today = datetime.utcnow().date()
        years = today.year - self.birthday.year
        if (today.month, today.day) < (self.birthday.month, self.birthday.day):
            years -= 1
        return max(years, 0)

