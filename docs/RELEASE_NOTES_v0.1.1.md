# Art Flow Pro v0.1.1 release notes

> **Release classification:** private technical preview for engineering and
> provenance review. This is not a public, production-supported, or commercially
> cleared release. AIONEX is an internal maintainer label only. Product-name,
> ownership, licensing, and public-release clearance remain pending.

Release date: 2026-08-08

## Purpose

Version 0.1.1 is a supply-chain maintenance patch for the verified v0.1.0
baseline. It does not change the application feature surface or relax any
rights, privacy, hosting, or production-readiness gate.

## Changes

- Updated the development-only pytest pin from 8.4.2 to 9.0.3, the first
  patched version for GHSA-6w46-j5rx-g56g.
- Renamed the 27-pin runtime lock from `requirements.lock` to
  `requirements-lock.txt` so GitHub's Dependabot Python fetcher stages it when
  resolving the include in `requirements-dev.txt`.
- Updated installation, container, CI, security-audit, cache, and current
  documentation references to the recognized lock filename.

## Verification

- A fresh install through `requirements-dev.txt` resolves the renamed child
  lock and installs pytest 9.0.3.
- The fourteen-test backend/security suite passes with provider transports
  mocked and no provider calls.
- Ruff lint/format, MyPy, Python compilation, browser JavaScript syntax,
  Bandit medium/high checks, and the configured 58% branch-aware coverage gate
  pass.
- A resolver-free OSV audit of the exact runtime and development pins reports
  no known vulnerabilities at release verification time.

These checks are bounded engineering evidence, not a penetration test,
production certification, or warranty.

## Release gates

The repository and this release must remain private. Public visibility,
promotion, licensing, or commercial use requires the provenance, asset-rights,
name/trademark, privacy, security, and deployment gates in
`RIGHTS_AND_RELEASE_STATUS.md` to be resolved first.
