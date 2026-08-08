# Architecture decision records

These records capture consequential choices in the 0.1 hardening pass. They
describe verifiable design rationale, not private deliberation.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-preserve-native-stack.md) | Preserve the FastAPI/Jinja/vanilla-JS stack | Accepted |
| [0002](0002-anonymous-workspace-boundary.md) | Partition local data by random workspace cookie | Accepted with limitations |
| [0003](0003-sqlite-assets-and-expiring-shares.md) | Persist generated assets and expiring resume shares in SQLite | Accepted for single-node use |
| [0004](0004-private-release-gate.md) | Keep publication private pending rights and name clearance | Accepted |
