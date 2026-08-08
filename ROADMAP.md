# Roadmap

> **Planning status:** private technical preview. This roadmap is a sequence of
> candidate engineering gates, not a commitment, launch schedule, or feature
> promise. AIONEX is an internal maintainer label; naming, ownership, licensing,
> and public-release clearance remain pending.

## Current: v0.1 private technical preview

- Preserve the FastAPI/Jinja/vanilla-JavaScript stack and document its actual
  single-node boundary.
- Maintain workspace-scoped projects/assets, explicit save state, stable image
  assets, and expiring/revocable resume shares.
- Keep optional AI features server-mediated, bounded, and clearly degraded when
  no key is configured.
- Maintain automated checks for the highest-risk validation, isolation,
  rendering, and provider-retry paths.
- Keep the repository and release private while provenance and naming remain
  unresolved.

## Gate 1: provenance and release authority

This gate blocks all public-release planning.

- Obtain signed authorship/contributor provenance and any required assignments.
- Verify rights for templates, prompts, icons, geometric mark, texture, and all
  other visual/source assets.
- Resolve employer, client, team, AI-output, and third-party obligations.
- Complete qualified name/trademark clearance or adopt a distinct cleared name.
- Select a license only with the verified rightsholder's approval.
- Repeat secret, privacy, dependency, staged-content, and history scans.

## Gate 2: trusted private pilot architecture

No pilot should use the current anonymous workspace cookie as an account.

- Define identities, login/recovery, roles, project authorization, session
  rotation, and administrative access.
- Add CSRF/Origin enforcement for state-changing HTTP requests and a trusted-host
  and reverse-proxy policy.
- Move durable records and binary assets to reviewed shared storage adapters;
  provide tested migrations, backups, restores, and integrity checks.
- Add per-user/workspace storage and provider quotas, orphan-asset cleanup,
  deletion workflows, and retention enforcement.
- Replace process-local rate and concurrency controls with shared enforcement
  where more than one worker is used.
- Add structured audit events, privacy-safe observability, health/readiness
  checks, error budgets, and incident runbooks.

## Gate 3: responsible AI and resume handling

- Document provider data flow, retention configuration, cost ownership, and
  user consent/opt-out behavior.
- Add policy and technical controls for sensitive resume/contact information.
- Provide human-review checkpoints and regression evaluations for factuality,
  action-block safety, malformed output, and provider/model changes.
- Add abuse controls for share links and shared-resume chat.
- Define an accessible, fully functional non-AI path for every core workflow.

## Gate 4: product quality for a named deployment

- Decompose large modules only with characterization and end-to-end coverage in
  place.
- Add browser-level tests for save/reload, responsive drawers, keyboard/focus,
  export, resume disclosure, expiry, and revocation.
- Conduct an independent accessibility review, including zoom, contrast,
  screen-reader, keyboard, reduced-motion, forced-colors, and print output.
- Define supported browsers and validate canvas/resume exports across them.
- Self-host or explicitly approve font delivery and tighten the remaining CSP
  inline-style allowance.
- Establish release rollback, migration rollback, support, and vulnerability
  response ownership.

## Optional scale track

Only after workload evidence justifies it:

- background jobs for provider operations with idempotency and cancellation;
- shared queues and rate/budget enforcement;
- object storage with signed access, lifecycle rules, and malware/content
  scanning;
- horizontally scalable application instances and distributed tracing; and
- controlled collaboration built on an authorized, versioned event model.

These items are not implemented. Kubernetes, video generation, background
removal, billing, OAuth, real-time collaboration, and multi-tenant SaaS behavior
must not be inferred from the current preview.

## Public-release decision

A public release can be considered only after Gate 1 is complete and a named
release owner has accepted the security, privacy, operational, accessibility,
and support evidence appropriate to the intended audience. Until then, the
correct release state is private engineering review.
