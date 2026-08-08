from __future__ import annotations

import importlib
import sys
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def app_client(tmp_path, monkeypatch) -> Iterator[tuple[TestClient, object]]:
    """Import the app with an isolated database and every external AI path disabled."""

    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("RESUME_DB", str(tmp_path / "test.db"))
    monkeypatch.setenv("OPENAI_API_KEY", "")
    monkeypatch.setenv("PROXY_URL", "direct")
    monkeypatch.setenv("HTTP_PROXY", "")
    monkeypatch.setenv("HTTPS_PROXY", "")
    monkeypatch.setenv("RELOAD", "false")
    monkeypatch.setenv("MAX_REQUEST_BYTES", "16384")

    sys.modules.pop("app", None)
    module = importlib.import_module("app")
    with TestClient(module.app) as client:
        yield client, module
    sys.modules.pop("app", None)
