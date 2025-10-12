""
Pydantic schemas for authentication and user management.
Defines the request/response models for user-related operations.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)

class UserCreate(UserBase):
    """Schema for creating a new user."""
    firebase_token: str = Field(..., description="Firebase ID token from the client")

class UserResponse(UserBase):
    """Schema for user response (without sensitive data)."""
    id: int
    firebase_uid: str
    
    class Config:
        orm_mode = True

class LoginRequest(BaseModel):
    """Schema for login request."""
    firebase_token: str = Field(..., description="Firebase ID token from the client")

class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Schema for token payload data."""
    user_id: Optional[int] = None
    email: Optional[EmailStr] = None

class LoginResponse(BaseModel):
    """Schema for login response with user data and token."""
    user: UserResponse
    access_token: str
    token_type: str = "bearer"
    
    class Config:
        orm_mode = True

class HTTPError(BaseModel):
    """Schema for HTTP error responses."""
    detail: str
    
    class Config:
        schema_extra = {
            "example": {"detail": "Error message describing what went wrong"}
        }
