"""Service for interacting with Supabase Storage."""
from __future__ import annotations

import mimetypes
import os
from typing import Optional
from uuid import uuid4

import httpx
from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings


class StorageService:
    def __init__(self, *, client: Optional[httpx.AsyncClient] = None) -> None:
        self._client = client

    def _get_config(self) -> tuple[str, str, str, str]:
        settings = get_settings()
        if not settings.supabase_url:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Supabase URL not configured.")
        if not settings.supabase_service_role_key:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Supabase service role key not configured.")
        if not settings.supabase_anon_key:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Supabase anon key not configured.")
        bucket = settings.supabase_storage_bucket or "avatars"
        base_url = settings.supabase_url.rstrip("/")
        return base_url, bucket, settings.supabase_service_role_key, settings.supabase_anon_key

    async def upload_avatar(self, user_id: str, file: UploadFile) -> str:
        base_url, bucket, service_role_key, anon_key = self._get_config()
        ext = os.path.splitext(file.filename or "avatar.png")[1] or ".png"
        mime_type = file.content_type or mimetypes.guess_type(file.filename or "avatar.png")[0] or "application/octet-stream"
        object_path = f"avatars/{user_id}/{uuid4().hex}{ext}"
        upload_url = f"{base_url}/storage/v1/object/{bucket}/{object_path}"
        headers = {
            "Authorization": f"Bearer {service_role_key}",
            "apikey": anon_key,
            "Content-Type": mime_type,
            "x-upsert": "true",
        }
        content = await file.read()
        async with (self._client or httpx.AsyncClient()) as client:
            response = await client.put(upload_url, headers=headers, content=content, timeout=20.0)
            if response.status_code >= 400:
                raise HTTPException(status_code=response.status_code, detail=response.text)

            sign_url = f"{base_url}/storage/v1/object/sign/{bucket}/{object_path}"
            sign_response = await client.post(
                sign_url,
                headers=headers,
                json={"expiresIn": 3600},
                timeout=10.0,
            )
            if sign_response.status_code >= 400:
                raise HTTPException(status_code=sign_response.status_code, detail=sign_response.text)
            data = sign_response.json()

        signed_path = data.get("signedURL") or data.get("signedUrl")
        if not signed_path:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Failed to generate signed URL.")
        if signed_path.startswith("http"):
            return signed_path
        return f"{base_url}{signed_path}"
