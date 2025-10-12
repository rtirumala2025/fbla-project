""
Authentication routes for user registration and login.
Handles Firebase authentication and JWT token generation.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from firebase_admin import auth
from firebase_admin.auth import UserNotFoundError
from sqlalchemy.orm import Session
from typing import Optional
import firebase_admin
from firebase_admin import credentials

from ..database import get_db, models
from ..schemas import auth_schemas
from ..utils.firebase_service import verify_firebase_token, get_firebase_user

router = APIRouter()

@router.post("/register", response_model=auth_schemas.UserResponse)
async def register_user(
    user_data: auth_schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user with Firebase authentication.
    
    Args:
        user_data: User registration data including Firebase token
        db: Database session
        
    Returns:
        User information and access token
    """
    try:
        # Verify Firebase token
        firebase_user = await verify_firebase_token(user_data.firebase_token)
        
        # Check if user already exists
        db_user = db.query(models.User).filter(
            models.User.firebase_uid == firebase_user.uid
        ).first()
        
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already exists"
            )
        
        # Create new user in database
        new_user = models.User(
            firebase_uid=firebase_user.uid,
            email=firebase_user.email,
            username=user_data.username
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "id": new_user.id,
            "email": new_user.email,
            "username": new_user.username,
            "firebase_uid": new_user.firebase_uid
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/login", response_model=auth_schemas.LoginResponse)
async def login_user(
    login_data: auth_schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Log in a user with Firebase authentication.
    
    Args:
        login_data: Login credentials including Firebase token
        db: Database session
        
    Returns:
        User information and access token
    """
    try:
        # Verify Firebase token
        firebase_user = await verify_firebase_token(login_data.firebase_token)
        
        # Get user from database
        db_user = db.query(models.User).filter(
            models.User.firebase_uid == firebase_user.uid
        ).first()
        
        if not db_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Generate JWT token
        # In a real implementation, you would generate a JWT token here
        # For now, we'll return a simple success response
        
        return {
            "user": {
                "id": db_user.id,
                "email": db_user.email,
                "username": db_user.username
            },
            "access_token": "dummy_access_token",  # Replace with JWT token in production
            "token_type": "bearer"
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
