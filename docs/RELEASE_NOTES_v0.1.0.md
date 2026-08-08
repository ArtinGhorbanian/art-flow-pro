# Art Flow Pro v0.1.0 release notes

> **Release classification:** private technical preview for engineering and
> provenance review. This is not a public, production-supported, or commercially
> cleared release. AIONEX is an internal maintainer label only. Product-name,
> ownership, licensing, and public-release clearance remain pending.

Release date: 2026-08-08

## Purpose

Version 0.1.0 captures a reproducible, hardened baseline of the existing Art
Flow Pro prototype. It makes the local product reviewable without claiming the
cloud, identity, collaboration, scale, or commercial capabilities that are not
implemented.

## Included product surface

- Project dashboard with design and resume project types.
- Canvas 2D editing for text, rectangles, circles, and generated images;
  properties, layers, zoom, undo/redo, explicit save state, and browser export.
- Structured resume editing, derived preview, browser print/PDF path, and
  optional provider-assisted parsing and rewriting tools.
- Optional streamed canvas assistant with a constrained client action protocol.
- Optional image generation stored under stable workspace-owned URLs.
- Expiring resume bearer links with owner-cookie revocation and an optional
  resume-grounded chat page.
- Responsive layouts, keyboard/focus treatment, reduced-motion handling, and
  light/dark themes.

## Hardening highlights

- Configuration and request payloads are typed and bounded.
- Projects and generated assets are isolated by a random HttpOnly workspace
  cookie; resume revocation is scoped to the creator workspace.
- SQLite startup is a durability invariant, with WAL, busy timeout, secure
  deletion, and explicit failures rather than a memory fallback.
- API/resume responses are no-store and receive CSP, framing, MIME, referrer,
  permissions, and conditional HSTS headers.
- Streamed provider output is validated and is not replayed after output begins.
- Image generation uses one provider request to avoid ambiguous duplicate cost.
- Stored resume data is normalized and escaped when embedded in the live page.
- The optional AI surface fails cleanly when no API key is configured.

The automated suite covers fourteen focused backend/security invariants,
including workspace boundaries, request limits, stored markup, resume
revocation, asset stability/isolation, provider degradation, rate limiting, and
stream retry behavior. Static analysis and dependency audit configuration are
included. Passing these checks supports only the tested scope; it is not a
penetration test or production certification.

## Installation and operation notes

- Python 3.12 is the declared and verified baseline for the locked environment.
- Install `requirements.lock` for exact transitive runtime versions.
- Copy `.env.example` to a local `.env` and leave `OPENAI_API_KEY` blank unless
  optional AI behavior is intentionally enabled.
- Keep `HOST=127.0.0.1` for the preview. Do not open the server to the internet
  without the architecture and security work described in the roadmap.
- Store `RESUME_DB` on a controlled local volume, outside consumer sync folders,
  and back it up before migration or review.

## Upgrade notes from the supplied local prototype

The database schema advances to version 2. Back up the database before first
startup. Existing project rows with no `workspace_id` are claimed by the first
workspace that lists projects after migration. This preserves a single user's
local work but is unsuitable for a database previously shared by multiple
people; such a database requires a manual ownership migration.

Project and asset endpoints now require the same workspace cookie that created
their records. Clearing cookies can make prior rows unreachable through the UI.
The image endpoint now returns JSON containing a stable asset ID and URL rather
than a transient provider response. API docs are available only in development.

Resume shares now include expiry metadata and a revoke route. Existing links
must be treated according to the migrated database state and tested explicitly.

## Known limitations

- Anonymous workspace isolation is not authentication or multi-tenancy.
- Resume read links are bearer credentials and can be forwarded.
- The complete resume is sent to the configured provider during shared-resume
  chat; other AI tools also send their submitted content externally.
- Rate limits, image concurrency, and SQLite locking are process-local.
- There are no per-workspace quotas, orphan-asset cleanup, storage encryption,
  automated backups, deletion-from-backup guarantees, job queue, shared cache,
  audit trail, service objectives, or real-time collaboration.
- CSP still permits inline styles and externally served Google Fonts.
- The application does not certify resume ATS compatibility.

## Release gates

Do not change repository visibility or promote this release until every gate in
`docs/RIGHTS_AND_RELEASE_STATUS.md` is resolved. At minimum, that requires
verified contributor provenance and assignments, rights for local visual
assets, a qualified name/trademark decision, a rightsholder-approved license,
and repeated secret/privacy/dependency/history and clean-clone checks.

## Private reviewer checklist

1. Use synthetic data and a clean browser profile.
2. Confirm project save/reload and cross-workspace isolation.
3. Confirm missing-key behavior before enabling any provider credential.
4. Create a synthetic resume share, inspect its disclosure and expiry, revoke
   it, and verify the old link fails.
5. Review the security model and operational limitations.
6. Record provenance evidence separately; do not infer ownership from repository
   possession or this release tag.
