# platform-foundation

Requirement headings gain a Group Term. The seed account, the removal semantic, identifiers and the
health endpoint are unchanged in wording and in behaviour. These four are invariants rather than user
operations, and they take the same `<Verb> <Object>` shape so the convention stays uniform.

## RENAMED Requirements

- FROM: `### Requirement: Seed Administrator always exists`
- TO: `### Requirement: Seed Administrator - Seed Administrator always exists`

- FROM: `### Requirement: Removal is always a Soft Delete`
- TO: `### Requirement: Remove Record - Removal is always a Soft Delete`

- FROM: `### Requirement: Records carry autoincrement integer identifiers`
- TO: `### Requirement: Identify Record - Records carry autoincrement integer identifiers`

- FROM: `### Requirement: The API reports its readiness`
- TO: `### Requirement: Report Readiness - The API reports its readiness`
