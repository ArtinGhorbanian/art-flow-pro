# ADR 0003: SQLite assets and expiring shares

- Status: Accepted for single-node use
- Date: 2026-08-08

## Context

Generated images were represented by temporary browser `blob:` URLs. Saving a
project serialized those URLs, but they became invalid after reload. Resume
shares used opaque tokens and a logical expiry, but the owner had no revocation
operation.

## Decision

Store bounded generated-image bytes in the application database, return stable
same-origin asset URLs, and scope asset access to the workspace cookie. Store the
creating workspace with each resume share, return explicit expiry metadata, and
allow that workspace to revoke the link.

## Consequences

Generated images survive reloads and resume links have an owner-controlled
lifecycle. SQLite growth must be monitored, backups contain user content, and
multi-process or object-storage deployment requires a different adapter.
