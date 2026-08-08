# Technical deep dive

> **Scope:** implementation notes for the private Art Flow Pro technical
> preview. AIONEX is an internal maintainer label only. Naming, ownership,
> licensing, and public-release clearance remain pending.

## Configuration and startup

`Settings` is a frozen Pydantic model built from environment variables after an
optional repository-root `.env` file is loaded without overriding the process
environment. It validates runtime mode, provider URLs and models, proxy URL,
database path, bind address, payload limits, rate limits, and resume retention.
Production mode rejects non-HTTPS AI provider URLs.

The lifespan handler opens two shared resources:

- one HTTPX asynchronous client with environment proxy discovery disabled; an
  explicit `PROXY_URL` may provide an HTTP or SOCKS transport; and
- one SQLite-backed `ResumeStore`. Startup fails if durable storage cannot be
  opened rather than silently switching to volatile memory.

An hourly maintenance task prunes expired resume shares. Startup also removes
already-expired rows. Shutdown cancels the task, closes the HTTP client, and
closes the database connection.

## Request boundary

The server rejects an HTTP request body that exceeds `MAX_REQUEST_BYTES` while
reading the ASGI stream. Route-specific Pydantic models add smaller semantic
limits: chat roles are restricted to `user` and `assistant`, arrays and text
fields are bounded, canvas project identifiers follow an allow-listed pattern,
project type is `design` or `resume`, and tone is one of three named values.

Unknown fields are forbidden on command-style AI and project envelopes. The
canonical resume model intentionally ignores unknown nested fields while
bounding contact information, experience, education, skills, and bullet text;
this allows provider output to be normalized before storage or rendering.

Every HTTP response receives a baseline header policy. The content security
policy permits same-origin scripts with a per-request nonce, same-origin/data/
blob images, same-origin WebSockets, and the two Google Fonts origins used by
the interface. Inline styles remain allowed. API and resume responses are
marked `no-store`. HSTS is emitted only when the request is already HTTPS.

## Anonymous workspace isolation

When a request has no syntactically valid `afp_workspace` cookie, the server
creates a high-entropy token and returns it in a one-year, HttpOnly, SameSite
Lax cookie. The cookie is Secure in production mode or on an HTTPS request.
Project and asset SQL statements include both object ID and workspace ID.
Resume deletion applies the same owner predicate.

This design closes the previous global-row access path for ordinary browsers,
but it is intentionally not called authentication:

- there is no login, identity proof, recovery flow, session rotation, role, or
  administrative policy;
- possession or theft of the cookie conveys its workspace authority; and
- clearing browser cookies can sever the user's ability to retrieve or revoke
  workspace-owned records.

## Persistence mechanics

SQLite is opened with a ten-second busy timeout, WAL journaling, foreign keys,
and `secure_delete=ON`. JSON documents are serialized with Unicode preserved.
Opaque project, asset, and resume identifiers are allocated with the `secrets`
module and retried on the unlikely event of a primary-key collision.

The shared SQLite connection uses `check_same_thread=False`. Each synchronous
operation is protected by a `threading.RLock` and dispatched with
`asyncio.to_thread`, preventing blocking SQL work from running directly on the
event loop. This is appropriate for the current single-process preview, not a
substitute for a multi-process database adapter.

Generated images are stored as BLOBs with a validated MIME type. The current
implementation does not garbage-collect assets that are no longer referenced
by a canvas, enforce per-workspace storage quotas, or encrypt application data
at rest.

## Client document model

The design editor stores canvas width, height, background color, optional
background asset, and an ordered object array. Restored objects pass through a
client-side sanitizer that accepts only text, rectangle, circle, and image
types and bounds numeric dimensions. An in-memory snapshot history retains up
to 60 past states. Undo and redo mark the document unsaved.

Resume projects use a canonical shape for identity, contact data, summary,
experience, education, and skills. Dynamic form content is escaped on insertion
and sanitized before it is restored. The preview is derived from current form
state. The save button posts the active document; a revision counter prevents a
save that finishes late from incorrectly marking a newer edit as saved. A
navigation warning protects an unsaved document, but the application does not
claim background autosave.

Canvas export runs in the browser. Resume export uses the browser print path.
Export behavior therefore depends on browser capabilities and should be
reviewed with the target browser before relying on output for a formal workflow.

## Provider-mediated AI

All AI features are optional. Without `OPENAI_API_KEY`, related routes return an
explicit `503` and project editing remains available.

### Streaming text

Chat requests use OpenAI-compatible server-sent events. The parser validates
the upstream envelope and emits only text deltas or a terminal error object.
Retryable status responses and safe pre-output failures use bounded jittered
backoff. Once any delta has reached the browser, the request is never replayed.

Canvas chat can return a fenced `afp-actions` JSON array. The client recognizes
only supported actions: background and canvas changes, text/shape insertion,
tool/theme selection, clearing, and image generation. This is a constrained UI
command protocol, not arbitrary code execution. Client parsing and dispatch are
still part of the trusted application surface and require regression tests when
new actions are added.

### Structured resume tools

Resume parsing, summary rewriting, bullet tightening, keyword suggestions, and
tone adjustment request a JSON object from the provider. The server validates
the provider envelope and then validates route-specific output before returning
it. Prompts instruct the provider not to invent facts; this is a behavioral
control, not a guarantee. A person must review AI-edited resume content.

The live resume assistant receives the stored resume JSON as grounding context
and streams an answer at a lower configured temperature. The entire resume is
sent to the external provider for each chat request, so the operator must treat
that flow as a disclosure of personal data.

### Image requests

Image generation is guarded by an IP-keyed rate limit and a process-local
single-flight lock. After acquiring the lock, the server makes exactly one
provider request, validates returned image data and type, applies
`MAX_ASSET_BYTES`, persists it, and returns a same-origin URL. A timeout while
waiting for the lock returns a retry hint. This prevents accidental duplicate
provider requests within one process; it does not coordinate replicas.

## Route inventory

| Area | Routes | Notes |
| --- | --- | --- |
| Shell/theme | `GET /`, `POST /api/theme` | Jinja shell and validated theme cookie |
| Projects | `GET /api/projects`, `GET /api/projects/{id}`, `POST /api/projects`, `DELETE /api/projects/{id}` | Workspace-scoped CRUD |
| Canvas AI | `POST /api/chat`, `POST /api/image` | SSE text and stable image asset response |
| Resume AI | `POST /api/parse-resume`, `/api/ai/summary`, `/api/ai/bullets`, `/api/ai/keywords`, `/api/ai/tone` | Optional structured transforms |
| Resume sharing | `POST /api/resume/save`, `GET /resume/{token}`, `GET/DELETE /api/resume/{token}`, `POST /api/resume-chat/{token}` | Bearer read, owner-cookie revoke |
| Assets | `GET/DELETE /api/assets/{id}` | Workspace-scoped BLOB access |
| WebSocket | `/ws` | Origin-checked, bounded echo stub only |

## Verification surface

The automated tests exercise workspace isolation, CRUD behavior, security
headers, disabled production docs, schema and request bounds, missing-key
degradation, stored-name escaping, share revocation, stable asset access,
production URL validation, rate limiting, malformed provider streams,
no-replay-after-output behavior, and provider temperature transmission.
Static checks cover Python syntax/types/style and JavaScript parsing; dependency
and security scanners are configured separately. These checks are evidence for
the covered paths, not a production security certification.

## Known engineering constraints

The large server and browser modules remain cohesive but monolithic. The rate
limiter, database lock, and image lock are process-local. There are no storage
quotas, orphan-asset collection, accounts, CSRF tokens, audit trail, job queue,
shared cache, backup automation, service-level objectives, or end-to-end AI
provider tests. The application should remain loopback-bound or behind a
reviewed private access layer until those gaps and the release gates are
addressed.
