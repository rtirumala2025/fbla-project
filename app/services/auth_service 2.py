"""
Supabase authentication integration helpers.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.schemas.auth import LoginRequest, LogoutRequest, RefreshRequest, SignupRequest, TokenResponse


class SupabaseAuthService:
    """Wrapper around the Supabase Auth REST API."""

    def __init__(self, client: Optional[httpx.AsyncClient] = None) -> None:
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
        base = str(settings.supabase_url).rstrip("/")
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
        try:
            return response.json()
        except ValueError as exc:  # pragma: no cover - defensive
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Unexpected response from Supabase Auth.") from exc

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
        return self._to_token_response(result)

    async def login(self, payload: LoginRequest) -> TokenResponse:
        url = self._auth_url("/token", query="?grant_type=password")
        data = {"email": payload.email, "password": payload.password}
        result = await self._request("POST", url, headers=self._base_headers, json=data)
        return self._to_token_response(result)

    async def refresh(self, payload: RefreshRequest) -> TokenResponse:
        url = self._auth_url("/token", query="?grant_type=refresh_token")
        data = {"refresh_token": payload.refresh_token}
        result = await self._request("POST", url, headers=self._base_headers, json=data)
        return self._to_token_response(result)

    async def logout(self, payload: LogoutRequest, *, access_token: Optional[str] = None) -> None:
        url = self._auth_url("/logout")
        headers = dict(self._base_headers)
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
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

    @staticmethod
    def _to_token_response(result: Dict[str, Any]) -> TokenResponse:
        return TokenResponse(
            access_token=result.get("access_token"),
            refresh_token=result.get("refresh_token"),
            expires_in=result.get("expires_in"),
        )


class TokenStore:
    """
    Minimal in-memory refresh token store used for revocation checks.

    This is not a substitute for persistent storage but provides a sane default
    for development and integration testing without requiring an additional table.
    """

    def __init__(self) -> None:
        self._tokens: dict[str, tuple[str | None, Optional[int]]] = {}

    def remember(self, refresh_token: str, user_id: str | None, expires_in: Optional[int]) -> None:
        self._tokens[refresh_token] = (user_id, expires_in)

    def revoke(self, refresh_token: str) -> None:
        self._tokens.pop(refresh_token, None)

    def is_active(self, refresh_token: str) -> bool:
        return refresh_token in self._tokens


# Singleton instances for dependency injection without global state mutation elsewhere.
supabase_auth_service = SupabaseAuthService()
refresh_token_store = TokenStore()


