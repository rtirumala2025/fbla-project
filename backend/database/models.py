"""
SQLAlchemy models for the Virtual Pet application.
Defines the database schema and relationships between models.
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
from ..database.db_setup import Base

class User(Base):
    """User model for storing user information and authentication details."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    pet = relationship("Pet", back_populates="owner", uselist=False)
    transactions = relationship("Transaction", back_populates="user")
    daily_scores = relationship("DailyScore", back_populates="user")

class Pet(Base):
    """Pet model representing a user's virtual pet."""
    __tablename__ = "pets"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    species_id = Column(Integer, ForeignKey("species.id"), nullable=False)
    breed_id = Column(Integer, ForeignKey("breeds.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Stats (0-100 scale)
    hunger = Column(Integer, default=50)
    happiness = Column(Integer, default=50)
    energy = Column(Integer, default=50)
    cleanliness = Column(Integer, default=50)
    health = Column(Integer, default=100)
    
    # Level and experience
    level = Column(Integer, default=1)
    experience = Column(Integer, default=0)
    
    # Appearance state
    appearance_state = Column(String, default="normal")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_updated = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="pet")
    species = relationship("Species")
    breed = relationship("Breed")
    inventory = relationship("InventoryItem", back_populates="pet")

class Species(Base):
    """Pet species model (e.g., Dog, Cat, Bird, Rabbit)."""
    __tablename__ = "species"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String)
    base_image = Column(String)  # Path to base image
    
    # Relationships
    breeds = relationship("Breed", back_populates="species")
    shop_items = relationship("ShopItem", back_populates="species")

class Breed(Base):
    """Pet breed model (e.g., Labrador, Siamese, etc.)."""
    __tablename__ = "breeds"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    species_id = Column(Integer, ForeignKey("species.id"), nullable=False)
    image = Column(String)  # Path to breed-specific image
    
    # Relationships
    species = relationship("Species", back_populates="breeds")

class ShopItem(Base):
    """Items available for purchase in the shop."""
    __tablename__ = "shop_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    price = Column(Integer, nullable=False)
    item_type = Column(String, nullable=False)  # food, toy, medicine, etc.
    effect_type = Column(String)  # hunger, happiness, energy, etc.
    effect_value = Column(Integer)  # How much the stat changes
    species_id = Column(Integer, ForeignKey("species.id"), nullable=True)  # None means available for all
    image = Column(String)  # Path to item image
    
    # Relationships
    species = relationship("Species", back_populates="shop_items")
    inventory = relationship("InventoryItem", back_populates="item")

class InventoryItem(Base):
    """Items owned by a pet."""
    __tablename__ = "inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("shop_items.id"), nullable=False)
    quantity = Column(Integer, default=1)
    
    # Relationships
    pet = relationship("Pet", back_populates="inventory")
    item = relationship("ShopItem", back_populates="inventory")

class Transaction(Base):
    """Financial transactions (purchases, earnings)."""
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Integer, nullable=False)  # Can be positive (earnings) or negative (spending)
    description = Column(String, nullable=False)
    transaction_type = Column(String, nullable=False)  # purchase, daily_earnings, minigame, etc.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="transactions")

class DailyScore(Base):
    """Daily care scores for users."""
    __tablename__ = "daily_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())
    score = Column(Integer, nullable=False)  # 0-100
    earnings = Column(Integer, nullable=False)  # Virtual currency earned
    
    # Stats snapshot
    hunger_avg = Column(Float)
    happiness_avg = Column(Float)
    energy_avg = Column(Float)
    cleanliness_avg = Column(Float)
    
    # Relationships
    user = relationship("User", back_populates="daily_scores")

# Add any additional models as needed
