"""Resolve Backend project root; override with MEDFLOW_ROOT for workbench per-run dirs."""

from __future__ import annotations

import os

_HERE = os.path.abspath(__file__)
_DEFAULT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(_HERE)))


def resolve_medflow_root() -> str:
    env = os.environ.get("MEDFLOW_ROOT", "").strip()
    if env:
        return os.path.abspath(env)
    return _DEFAULT_ROOT


MEDFLOW_ROOT = resolve_medflow_root()
