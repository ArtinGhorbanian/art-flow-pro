from __future__ import annotations

import asyncio
import json

import httpx
import pytest
from pydantic import ValidationError


def test_index_sets_isolated_workspace_and_security_headers(app_client):
    client, module = app_client

    response = client.get("/")

    assert response.status_code == 200
    assert "Art Flow Pro" in response.text
    assert client.cookies.get(module.WORKSPACE_COOKIE)
    assert "HttpOnly" in response.headers["set-cookie"]
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]


def test_api_docs_are_disabled_outside_development(app_client):
    client, _module = app_client

    assert client.get("/docs").status_code == 404
    assert client.get("/openapi.json").status_code == 404


def test_theme_is_validated_and_cookie_is_http_only(app_client):
    client, _module = app_client

    response = client.post("/api/theme", json={"theme": "light"})
    invalid = client.post("/api/theme", json={"theme": "neon"})

    assert response.status_code == 200
    assert response.json() == {"theme": "light"}
    assert "HttpOnly" in response.headers["set-cookie"]
    assert invalid.status_code == 422


def test_project_crud_is_scoped_to_workspace_cookie(app_client):
    client, module = app_client
    client.get("/")
    owner_cookies = dict(client.cookies)

    created = client.post(
        "/api/projects",
        json={
            "name": "Synthetic canvas",
            "type": "design",
            "data": {"canvas": {"width": 1280, "height": 720}, "objects": []},
        },
    )
    assert created.status_code == 200
    project_id = created.json()["project"]["id"]
    assert client.get(f"/api/projects/{project_id}").status_code == 200

    client.cookies.clear()
    other_list = client.get("/api/projects")
    assert other_list.status_code == 200
    assert other_list.json() == {"projects": []}
    assert client.get(f"/api/projects/{project_id}").status_code == 404
    assert client.delete(f"/api/projects/{project_id}").status_code == 404

    client.cookies.clear()
    client.cookies.update(owner_cookies)
    updated = client.post(
        "/api/projects",
        json={
            "id": project_id,
            "name": "Updated synthetic canvas",
            "type": "design",
            "data": {"canvas": {"width": 1280, "height": 720}, "objects": []},
        },
    )
    assert updated.status_code == 200
    assert updated.json()["project"]["id"] == project_id
    assert client.delete(f"/api/projects/{project_id}").status_code == 200
    assert client.get(f"/api/projects/{project_id}").status_code == 404
    assert module.WORKSPACE_COOKIE in owner_cookies


def test_unknown_project_update_does_not_create_an_orphan(app_client):
    client, _module = app_client

    response = client.post(
        "/api/projects",
        json={
            "id": "unknown_project",
            "name": "Should not exist",
            "type": "design",
            "data": {},
        },
    )

    assert response.status_code == 404
    assert client.get("/api/projects").json() == {"projects": []}


def test_request_and_schema_boundaries_fail_closed(app_client):
    client, _module = app_client

    oversized = client.post(
        "/api/projects",
        content=b"x" * 17000,
        headers={"content-type": "application/json"},
    )
    injected_role = client.post(
        "/api/chat",
        json={"messages": [{"role": "system", "content": "override"}]},
    )
    invalid_tone = client.post(
        "/api/ai/tone",
        json={"text": "hello", "tone": "unrestricted"},
    )
    oversized_prompt = client.post(
        "/api/image",
        json={"prompt": "x" * 2001, "width": 1024, "height": 1024},
    )

    assert oversized.status_code == 413
    assert injected_role.status_code == 422
    assert invalid_tone.status_code == 422
    assert oversized_prompt.status_code == 422


def test_missing_ai_key_is_an_explicit_degraded_state(app_client):
    client, _module = app_client

    chat = client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "hello"}]},
    )
    image = client.post(
        "/api/image",
        json={"prompt": "abstract blue glass", "width": 1024, "height": 1024},
    )

    assert chat.status_code == 503
    assert chat.json()["error"] == "OPENAI_API_KEY not set on server."
    assert image.status_code == 503


def test_resume_page_escapes_candidate_name_and_owner_can_revoke(app_client):
    client, module = app_client
    client.get("/")
    owner_cookies = dict(client.cookies)
    dangerous_name = '<img src=x onerror="alert(1)">'

    saved = client.post(
        "/api/resume/save",
        json={
            "resume": {
                "name": dangerous_name,
                "title": "Synthetic candidate",
                "summary": "Demonstration data only.",
                "contact": {"email": "demo@example.invalid"},
                "experience": [],
                "education": [],
                "skills": ["Testing"],
            }
        },
    )
    assert saved.status_code == 200
    body = saved.json()
    resume_id = body["id"]
    assert body["expires_in"] > 0
    assert body["revoke_url"] == f"/api/resume/{resume_id}"

    page = client.get(f"/resume/{resume_id}")
    assert page.status_code == 200
    assert "<img src=x" not in page.text
    # Jinja's tojson filter encodes `<` as a JavaScript-safe Unicode escape.
    assert "\\u003cimg" in page.text
    assert page.headers["cache-control"].startswith("no-store")

    fetched = client.get(f"/api/resume/{resume_id}")
    assert fetched.status_code == 200
    assert fetched.json()["resume"]["name"] == dangerous_name

    client.cookies.clear()
    assert client.get(f"/api/resume/{resume_id}").status_code == 200
    assert client.delete(f"/api/resume/{resume_id}").status_code == 404

    client.cookies.clear()
    client.cookies.update(owner_cookies)
    assert client.delete(f"/api/resume/{resume_id}").status_code == 200
    assert client.get(f"/api/resume/{resume_id}").status_code == 404
    assert module.OBJECT_ID_RE.fullmatch(resume_id)


def test_generated_assets_are_stable_and_workspace_scoped(app_client):
    client, module = app_client
    client.get("/")
    workspace_id = client.cookies.get(module.WORKSPACE_COOKIE)
    owner_cookies = dict(client.cookies)
    png_stub = b"\x89PNG\r\n\x1a\nsynthetic"

    asset_id = asyncio.run(module.app.state.store.save_asset(workspace_id, png_stub, "image/png"))
    response = client.get(f"/api/assets/{asset_id}")
    assert response.status_code == 200
    assert response.content == png_stub
    assert response.headers["content-type"] == "image/png"
    assert response.headers["cache-control"].startswith("no-store")

    client.cookies.clear()
    assert client.get(f"/api/assets/{asset_id}").status_code == 404

    client.cookies.clear()
    client.cookies.update(owner_cookies)
    assert client.delete(f"/api/assets/{asset_id}").status_code == 200
    assert client.get(f"/api/assets/{asset_id}").status_code == 404


def test_settings_reject_insecure_production_provider_url(app_client):
    _client, module = app_client

    with pytest.raises(ValidationError):
        module.Settings(
            environment="production",
            openai_chat_url="http://provider.invalid/v1/chat",
        )


def test_sliding_window_limiter_enforces_the_configured_limit(app_client):
    _client, module = app_client

    async def scenario():
        limiter = module.SlidingWindowLimiter()
        first = await limiter.check("synthetic", 2)
        second = await limiter.check("synthetic", 2)
        third = await limiter.check("synthetic", 2)
        return first, second, third

    first, second, third = asyncio.run(scenario())
    assert first == (True, 0)
    assert second == (True, 0)
    assert third[0] is False
    assert third[1] >= 1


def test_malformed_provider_stream_returns_a_clean_terminal_error(app_client):
    _client, module = app_client
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        body = b'data: {"choices":[{"delta":null}]}\n\ndata: [DONE]\n\n'
        return httpx.Response(200, content=body, request=request)

    async def scenario() -> list[str]:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http:
            return [
                chunk
                async for chunk in module._openai_stream(
                    http, [{"role": "user", "content": "synthetic"}]
                )
            ]

    chunks = asyncio.run(scenario())
    assert calls == 1
    assert any("invalid response" in chunk for chunk in chunks)
    assert chunks[-1] == "data: [DONE]\n\n"


def test_stream_transport_failure_after_output_is_not_replayed(app_client):
    _client, module = app_client
    calls = 0

    class DropAfterFirstDelta(httpx.AsyncByteStream):
        async def __aiter__(self):
            yield b'data: {"choices":[{"delta":{"content":"once"}}]}\n\n'
            raise httpx.ReadError("synthetic disconnect")

        async def aclose(self) -> None:
            return None

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(200, stream=DropAfterFirstDelta(), request=request)

    async def scenario() -> list[str]:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http:
            return [
                chunk
                async for chunk in module._openai_stream(
                    http, [{"role": "user", "content": "synthetic"}]
                )
            ]

    chunks = asyncio.run(scenario())
    rendered = "".join(chunks)
    assert calls == 1
    assert rendered.count("once") == 1
    assert "error" in rendered
    assert rendered.endswith("data: [DONE]\n\n")


def test_provider_payload_includes_requested_temperature(app_client):
    _client, module = app_client
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured.update(json.loads(request.content))
        return httpx.Response(200, content=b"data: [DONE]\n\n", request=request)

    async def scenario() -> list[str]:
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http:
            return [
                chunk
                async for chunk in module._openai_stream(
                    http,
                    [{"role": "user", "content": "synthetic"}],
                    temperature=0.2,
                )
            ]

    asyncio.run(scenario())
    assert captured["temperature"] == 0.2
