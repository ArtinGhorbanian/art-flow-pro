# Security policy

## Supported version

Only the latest commit on the private `main` branch is maintained. No public or
production-supported release exists while rights and naming clearance remain
open.

## Reporting a vulnerability

Use GitHub's private vulnerability-reporting or Security Advisory interface when
it is enabled for this repository. Do not place exploit details, credentials,
resumes, generated assets, or private project data in a public issue.

If private reporting is unavailable, open a minimal issue that contains no
sensitive details and ask the maintainer to establish a private channel. No
external security email is listed because no verified AIONEX address was found.

Include the affected commit, route or component, safe reproduction conditions,
impact, and suggested mitigation. Never test against systems or data you do not
own or have explicit permission to assess.

## Scope and known boundaries

Art Flow Pro is a single-node, anonymous-workspace application. Workspace tokens
reduce accidental cross-user access but are not user authentication. Operators
must not expose it as a multi-tenant service without a reviewed authentication,
authorization, abuse-control, backup, and data-governance layer.

Optional AI requests transmit user-provided content to an external provider and
may create usage charges. Keep credentials server-side, apply quotas, and obtain
appropriate user consent before enabling those features.
