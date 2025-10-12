""
Firebase Admin SDK integration for authentication and user management.
Handles Firebase token verification and user operations.
"""
import os
import firebase_admin
from firebase_admin import auth, credentials, exceptions
from fastapi import HTTPException, status
from typing import Optional
import json

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with credentials from environment variables."""
    try:
        # Get Firebase credentials from environment variable
        firebase_credentials = os.getenv("FIREBASE_CREDENTIALS_JSON")
        
        if not firebase_credentials:
            raise ValueError("FIREBASE_CREDENTIALS_JSON environment variable not set")
        
        # Parse the JSON string into a dictionary
        cred_dict = json.loads(firebase_credentials)
        
        # Initialize the app with the credentials
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            
    except json.JSONDecodeError:
        raise ValueError("Invalid FIREBASE_CREDENTIALS_JSON format. Must be a valid JSON string.")
    except Exception as e:
        raise Exception(f"Failed to initialize Firebase Admin SDK: {str(e)}")

async def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token.
    
    Args:
        id_token: The Firebase ID token string from the client.
        
    Returns:
        Decoded token (dict) if verification is successful.
        
    Raises:
        HTTPException: If token verification fails.
    """
    try:
        # Initialize Firebase if not already done
        if not firebase_admin._apps:
            initialize_firebase()
            
        # Verify the ID token
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
        
    except (ValueError, exceptions.FirebaseError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying token: {str(e)}"
        )

async def get_firebase_user(uid: str) -> Optional[dict]:
    """
    Get user data from Firebase Auth.
    
    Args:
        uid: The Firebase user ID.
        
    Returns:
        User record if found, None otherwise.
    """
    try:
        if not firebase_admin._apps:
            initialize_firebase()
            
        user = auth.get_user(uid)
        return {
            "uid": user.uid,
            "email": user.email,
            "display_name": user.display_name,
            "photo_url": user.photo_url,
            "email_verified": user.email_verified,
            "disabled": user.disabled
        }
    except auth.UserNotFoundError:
        return None
    except Exception as e:
        raise Exception(f"Error getting Firebase user: {str(e)}")

def create_firebase_user(email: str, password: str, display_name: str = None) -> dict:
    """
    Create a new user in Firebase Auth.
    
    Args:
        email: User's email address.
        password: User's password.
        display_name: Optional display name.
        
    Returns:
        User record if successful.
    """
    try:
        if not firebase_admin._apps:
            initialize_firebase()
            
        user = auth.create_user(
            email=email,
            password=password,
            display_name=display_name
        )
        
        return {
            "uid": user.uid,
            "email": user.email,
            "display_name": user.display_name,
            "email_verified": user.email_verified
        }
    except Exception as e:
        raise Exception(f"Error creating Firebase user: {str(e)}")
