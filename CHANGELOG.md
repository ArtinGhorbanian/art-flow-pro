# Changelog

All notable changes to the private Art Flow Pro technical preview are recorded
here. AIONEX is an internal maintainer label. Product-name, ownership, licensing,
and public-release clearance remain pending; no public release is represented.

The format follows Keep a Changelog conventions without claiming semantic
compatibility guarantees for this pre-release codebase.

## [Unreleased]

### Blocked

- Public repository visibility, public release promotion, and a project-level
  open-source or exclusive proprietary claim remain blocked by provenance,
  asset-origin, license, and naming clearance.

## [0.1.0] - 2026-08-08

### Added

- Exact runtime and development dependency manifests, environment template,
  container definition, and automated CI/security configuration.
- Validated runtime settings for environment, AI endpoints/models, proxy,
  database, bind address, request/asset limits, and route rate limits.
- Anonymous high-entropy workspace cookie and workspace-scoped project, asset,
  and resume-revocation operations.
- Stable same-origin generated-image assets persisted as validated SQLite BLOBs.
- Expiring resume shares with explicit expiry metadata and owner-cookie
  revocation.
- Loading, empty, retry, dirty, saving, saved, and save-failed interface states.
- Responsive editor drawers/bottom sheets, dialog/focus handling, safe-area and
  reduced-motion support, and light/dark themes.
- Automated tests for security headers, production docs, workspace isolation,
  request/schema bounds, missing-key degradation, stored-name escaping, resume
  revocation, asset isolation, settings, rate limits, and provider streaming
  invariants.
- Architecture decisions, rights/release status, security policy, third-party
  notices, and technical-review documentation.

### Changed

- Preserved the native FastAPI/Jinja/vanilla-JavaScript stack while hardening
  its boundaries instead of presenting an unimplemented cloud architecture.
- Project creation, restoration, active-document saving, rename, delete, and
  navigation handling now expose explicit user-visible outcomes.
- Canvas restore accepts only supported object types and bounded values; history
  retains up to 60 in-memory prior states.
- Text streaming validates provider events and never retries after output has
  been relayed.
- Image generation performs one provider request, applies response/size checks,
  and returns `{asset_id, url}`.
- Structured resume AI output is normalized through typed server models before
  being returned or stored.
- API documentation is disabled outside development mode.

### Security

- Added total request-body limits, field/array bounds, enum restrictions, and
  clean error behavior for storage/provider failures.
- Added per-request script nonces and baseline CSP, framing, MIME-sniffing,
  referrer, permissions, cache, and conditional HSTS headers.
- Added process-local IP rate limiting for paid/provider and WebSocket paths,
  plus a process-local image-generation lock.
- Added WebSocket origin, message-size, and message-rate checks; the route remains
  an echo stub and is not represented as collaboration.
- Disabled ambient environment proxies for provider calls; only validated
  explicit proxy configuration is used.

### Known limitations

- No accounts, authentication, recovery, roles, CSRF tokens, shared database,
  object storage, queue, distributed limiter, storage quotas, orphan cleanup,
  encryption layer, audit trail, backup automation, or production observability.
- Workspace possession is anonymous authorization, resume reads use bearer URLs,
  and external AI calls disclose submitted content to the configured provider.
- SQLite and process-local locks/limits support one application process only.
- Browser export/print behavior requires target-browser validation.

[0.1.0]: docs/RELEASE_NOTES_v0.1.0.md
