# Technical Glossary

| Term | Definition | Use When | Avoid |
| --- | --- | --- | --- |
| Soft Delete | Marking a row with a deletion timestamp instead of removing it, so every read path filters the row out. | Describing any delete operation on an Account or Note. | "archive", "hide", "disable" |
| Live Row | A row whose deletion timestamp is null; uniqueness constraints and all default reads are scoped to Live Rows. | Explaining why a soft-deleted email or user name can be reused. | "active record" |
| Access Token Cookie | The httpOnly, SameSite cookie carrying the signed JWT that authenticates browser requests to the API. | Describing how the SPA proves who it is. | "session", "bearer token" |
| Auth Guard | The Nest guard that verifies the Access Token Cookie and reloads the Account on every request, so a Ban or Soft Delete takes effect on the next call. | Describing per-request authentication and revocation. | "middleware", "interceptor" |
| Role | An enum value (`USER`, `ADMIN`) stored as an array on an Account and used for authorization decisions. | Describing what an Account is permitted to do. | "permission", "scope", "group" |
| Tag Normalization | The deterministic transform applied to tag input before lookup-or-create: trim, lowercase, collapse whitespace to hyphens, restrict to a fixed character set. | Explaining how differing tag inputs resolve to one Tag. | "slugify", "sanitize" |
| Acceptance Suite | The single cucumber-js project under `acceptance-tests/` that executes the Gherkin extracted from every `spec.md`. | Referring to the executable specification run. | "e2e tests", "integration tests" |
| Specs Zone | Files under `openspec/`, edited and committed separately from application code. | Describing where specification work happens. | "docs" |
| Code Zone | Every file outside `openspec/`, including `glossary/` and `adr/`. | Describing where implementation work happens. | "src" |
