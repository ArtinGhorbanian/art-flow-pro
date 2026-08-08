# Engineering case study: hardening Art Flow Pro

> **Context:** this is an internal engineering case study for a private
> technical preview, not a customer engagement, endorsement, competition entry,
> public launch, or production-readiness claim. AIONEX is the internal
> maintainer label. Name, ownership, licensing, and public-release clearance are
> pending.

## Starting point

The supplied application already combined a graphic canvas, a structured
resume builder, and provider-assisted text and image interactions in a compact
FastAPI/Jinja/JavaScript codebase. It was visually distinctive and
demonstrable, but the local package lacked the evidence and operational
boundaries needed for responsible publication.

The engineering review identified several concrete risks:

- project rows were globally addressable rather than partitioned by a browser
  workspace;
- generated images did not yet have a clearly durable, workspace-owned asset
  contract;
- resume shares lacked an owner-visible revocation lifecycle;
- request and provider-output bounds were incomplete;
- streamed retries could create duplicate visible output or actions if replayed
  after a partial response;
- AI absence and storage failure needed explicit degraded states;
- the interface needed stronger loading, saving, responsive, keyboard, and
  privacy disclosure states; and
- the folder contained no Git history, license, contributor record, or rights
  assignment from which public-release authority could be established.

## Product and engineering objective

The objective was not to manufacture the appearance of a large cloud SaaS
platform. It was to turn the existing prototype into an honest, reviewable,
single-node technical preview: preserve its useful interaction model, close the
most consequential local security and durability gaps, document the trust
boundaries, and stop publication where legal evidence was missing.

## Key decisions

### Preserve the native stack

The existing FastAPI, Jinja, vanilla-JavaScript, Canvas 2D, and SQLite stack was
retained. This kept the transformation auditable and avoided a framework
migration that would not itself solve data ownership, retry safety, or rights
clearance. The consequence is that `app.py` and `static/script.js` remain large
modules and should be decomposed only alongside deeper characterization tests.

### Introduce an explicit local ownership boundary

A random HttpOnly workspace cookie now scopes projects, generated assets, and
resume revocation. This removes ordinary cross-browser access to global rows
without pretending that the application has user authentication. The boundary
is described consistently in UI disclosures and technical documentation.

### Make provider side effects deliberate

Text streaming can retry only before output begins. Image generation performs
one provider request and persists validated bytes under a stable same-origin
asset URL. These choices favor predictable user-visible effects and cost
control over aggressive transparent retries.

### Give resume sharing a lifecycle

Published resume documents are validated, stored with an opaque token, assigned
an expiry, rendered through an escaped template, and revocable by the creating
workspace. The UI now discloses bearer-link and external-provider behavior
before the share is created.

### Treat legal uncertainty as a release gate

The provenance review did not establish authorship or redistribution authority,
and naming checks identified active software uses of the requested names. The
result is a private repository posture with no exclusive copyright, open-source,
or commercial-launch claim. This is a product decision as much as a legal one:
discoverability is not worth creating avoidable ownership or confusion risk.

## Implemented transformation

The hardening pass added validated settings, exact runtime dependencies,
request-size controls, typed and bounded request models, security headers,
workspace-scoped SQL, stable BLOB assets, expiring/revocable resume shares,
bounded in-process rate limits, and explicit storage/provider errors.

On the client, it added reliable project loading and retry states, clear save
status, active-document persistence, restore sanitization, undo-safe text
editing, responsive panels, modal/focus behavior, resume disclosure and
revocation controls, and accessibility preferences. Automated tests exercise
the most important ownership, validation, escaping, lifecycle, and provider
retry invariants.

## What the result demonstrates

The result is evidence of a coherent hardening approach rather than evidence of
scale or commercial adoption. A reviewer can inspect a working local product,
trace data through its API and storage boundaries, reproduce core tests, and see
which controls are implemented versus deferred. The application continues to
work as a manual editor when external AI is not configured.

## What remains deliberately unresolved

The preview still has no account system, authorization roles, CSRF token,
shared database, queue, object storage, distributed limiter, asset quota,
orphan cleanup, encryption layer, audit log, backup automation, observability
stack, or production privacy program. The WebSocket route is an echo stub, not
collaboration. Resume links are bearer links. External AI receives user content.
SQLite and in-process locks constrain deployment to a single node.

Public release is separately blocked by provenance, asset-origin, license, and
naming clearance. None of these gaps is hidden behind roadmap language.

## Lessons

1. A smaller architecture can be more credible when its operational limits are
   explicit and tested.
2. Anonymous isolation can be a useful interim control, but naming it
   “authentication” would create a dangerous expectation.
3. Retry policy is a product behavior when requests can charge money or execute
   visible actions.
4. Share links need expiry, revocation, and disclosure even in a local preview.
5. Publication readiness requires provenance evidence as well as working code.

The next appropriate milestone is a reviewed private pilot architecture only
after identity, data governance, backups, distributed controls, and the rights
gates have concrete owners and acceptance criteria.
