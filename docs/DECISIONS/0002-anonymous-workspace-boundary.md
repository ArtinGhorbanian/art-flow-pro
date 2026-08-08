# ADR 0002: Anonymous workspace boundary

- Status: Accepted with limitations
- Date: 2026-08-08

## Context

The baseline stored every project in a global SQLite table. Any browser could
list, fetch, overwrite, or delete every record. Adding a complete account system
would be a separate product with identity, recovery, consent, and operational
requirements.

## Decision

Assign each browser a high-entropy, HttpOnly, same-site workspace cookie and
scope project, generated-asset, and resume-owner mutations to that workspace.

## Consequences

Unrelated browsers no longer share the ordinary project list or asset namespace.
This is an isolation boundary for a local/single-node preview, not user
authentication. Cookie theft, browser-profile sharing, server operators, and
database access remain outside the protection model. Multi-tenant deployment is
blocked until real authentication and authorization are implemented.
