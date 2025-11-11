"""Monkey patches for typing changes in Python 3.13."""

from __future__ import annotations

import sys
from typing import ForwardRef


if sys.version_info >= (3, 13):  # pragma: no cover - platform specific shim
    _original_forwardref_evaluate = ForwardRef._evaluate  # type: ignore[attr-defined]

    def _patched_forwardref_evaluate(self, globalns, localns, *args, **kwargs):
        """Ensure ForwardRef._evaluate accepts Python 3.13's recursive_guard kwarg."""

        if "recursive_guard" not in kwargs:
            kwargs["recursive_guard"] = set()
        return _original_forwardref_evaluate(self, globalns, localns, *args, **kwargs)

    ForwardRef._evaluate = _patched_forwardref_evaluate  # type: ignore[attr-defined]
