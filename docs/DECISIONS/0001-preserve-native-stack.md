# ADR 0001: Preserve the native stack

- Status: Accepted
- Date: 2026-08-08

## Context

The supplied product already implemented a substantial browser editor in a
FastAPI application with Jinja, vanilla JavaScript, CSS, and SQLite. An internal
brief mentioned React and cloud infrastructure, but those technologies were not
present in the executable project.

## Decision

Harden and test the existing stack incrementally. Do not migrate frameworks for
presentation value alone. Separate concerns inside the current boundaries where
that directly improves validation, security, persistence, or testability.

## Consequences

The original canvas logic and visual language remain recognizable, the change
surface stays reviewable, and clean installation becomes possible through a
pinned Python manifest. The JavaScript and server modules remain comparatively
large; further extraction is deferred until characterization coverage is deeper.
