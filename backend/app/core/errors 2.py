"""Custom exception hierarchy and registration helpers."""
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base application exception with structured payload."""

    status_code: int = status.HTTP_400_BAD_REQUEST
    error_code: str = "app_error"

    def __init__(
        self,
        message: str | None = None,
        *,
        status_code: int | None = None,
        error_code: str | None = None,
        context: Dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message or "An application error occurred.")
        if status_code is not None:
            self.status_code = status_code
        if error_code is not None:
            self.error_code = error_code
        self.context = context or {}

    def to_response(self) -> Dict[str, Any]:
        return {
            "error": {
                "code": self.error_code,
                "message": str(self),
                "context": self.context,
            }
        }


class NotFoundError(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "not_found"


class UnauthorizedError(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "unauthorized"


class ConflictError(AppException):
    status_code = status.HTTP_409_CONFLICT
    error_code = "conflict"


async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.to_response())


async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled application error: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "internal_server_error",
                "message": "Something went wrong.",
            }
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Attach structured exception handlers to the application instance."""
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
