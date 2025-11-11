"""Service for interacting with Supabase Auth APIs."""
from __future__ import annotations

from typing import Any, Dict, Optional

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.schemas import LoginRequest, LogoutRequest, RefreshRequest, SignupRequest, TokenResponse


class AuthService:
    """Handle Supabase Auth requests and responses."""

    def __init__(self, *, client: Optional[httpx.AsyncClient] = None) -> None:
        self._client = client

    @property
    def _base_headers(self) -> Dict[str, str]:
        settings = get_settings()
        if not settings.supabase_anon_key:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Supabase anon key not configured.")
        return {
            "apikey": settings.supabase_anon_key,
            "Content-Type": "application/json",
        }

    def _auth_url(self, path: str, *, query: Optional[str] = None) -> str:
        settings = get_settings()
        if not settings.supabase_url:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Supabase URL not configured.")
        base = settings.supabase_url.rstrip("/")
        url = f"{base}/auth/v1{path}"
        if query:
            url = f"{url}{query}"
        return url

    async def _request(
        self,
        method: str,
        url: str,
        *,
        headers: Optional[Dict[str, str]] = None,
        json: Optional[Dict[str, Any]] = None,
        timeout: float = 15.0,
    ) -> Dict[str, Any]:
        client = self._client or httpx.AsyncClient()
        close_client = self._client is None
        try:
            response = await client.request(method, url, headers=headers, json=json, timeout=timeout)
        finally:
            if close_client:
                await client.aclose()
        if response.status_code >= 400:
            detail = self._extract_error(response)
            raise HTTPException(status_code=response.status_code, detail=detail)
        return response.json()

    @staticmethod
    def _extract_error(response: httpx.Response) -> str:
        try:
            payload = response.json()
        except ValueError:
            return response.text
        return payload.get("error_description") or payload.get("msg") or response.text

    async def signup(self, payload: SignupRequest) -> TokenResponse:
        url = self._auth_url("/signup")
        data = {
            "email": payload.email,
            "password": payload.password,
            "data": {"username": payload.username},
        }
        result = await self._request("POST", url, headers=self._base_headers, json=data)
        return TokenResponse(
            access_token=result.get("access_token"),
            refresh_token=result.get("refresh_token"),
            expires_in=result.get("expires_in"),
        )

    async def login(self, payload: LoginRequest) -> TokenResponse:
        url = self._auth_url("/token", query="?grant_type=password")
        data = {"email": payload.email, "password": payload.password}
        result = await self._request("POST", url, headers=self._base_headers, json=data)
        return TokenResponse(
            access_token=result.get("access_token"),
            refresh_token=result.get("refresh_token"),
            expires_in=result.get("expires_in"),
        )

    async def refresh(self, payload: RefreshRequest) -> TokenResponse:
        url = self._auth_url("/token", query="?grant_type=refresh_token")
        data = {"refresh_token": payload.refresh_token}
        result = await self._request("POST", url, headers=self._base_headers, json=data)
        return TokenResponse(
            access_token=result.get("access_token"),
            refresh_token=result.get("refresh_token"),
            expires_in=result.get("expires_in"),
        )

    async def logout(self, payload: LogoutRequest, *, access_token: Optional[str] = None) -> None:
        url = self._auth_url("/logout")
        headers = self._base_headers
        if access_token:
            headers = {**headers, "Authorization": f"Bearer {access_token}"}
        data: Dict[str, Any] = {}
        if payload.refresh_token:
            data["refresh_token"] = payload.refresh_token
        client = self._client or httpx.AsyncClient()
        close_client = self._client is None
        try:
            response = await client.post(url, headers=headers, json=data or None, timeout=10.0)
        finally:
            if close_client:
                await client.aclose()
        if response.status_code >= 400:
            detail = self._extract_error(response)
            raise HTTPException(status_code=response.status_code, detail=detail)
