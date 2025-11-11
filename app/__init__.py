"""
Application package initializer.

This file marks the `app` directory as a Python package and provides
high-level documentation for the Virtual Pet backend. All backend
modules—routers, services, models, and configuration—live under
this package.
"""

from .compat import typing_patch  # noqa: F401

__all__ = ["main"]

