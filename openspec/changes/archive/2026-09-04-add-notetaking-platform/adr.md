# ADR Review Manifest

- Status: completed
- Review date: 2026-09-04

## Review Summary

ADR review completed for this change. `adr/` did not exist before this change, so the supersession
graph was empty and no prior commitment constrained the design. Every decision in `design.md` was
assessed against the durability bar; seven qualified and were recorded as new repository-level ADRs,
and the rest were judged tactical and deliberately left out. Nothing was superseded.

Decisions considered and **not** recorded, with the reason: argon2id for password hashing (a library
and parameter choice, replaceable behind the hashing call without structural consequences); the
`/api/v1`, `/api/v1/public` and `/api/v1/admin` route prefixes and the page/limit pagination defaults
(a routing convention, not an architectural boundary); and autoincrement integer primary keys (a
requirement given in the request rather than a decision this change made).

## In-Force ADRs Reviewed

- None - `adr/` held no ADRs before this change, so there was no in-force set to honour or revisit.

## New Durable ADRs Created

- `adr/0001-split-the-platform-into-an-api-and-an-spa-in-one-pnpm-workspace.md` - repository and
  runtime shape; the boundary every later change is organised around.
- `adr/0002-carry-the-session-in-an-httponly-jwt-cookie-without-a-refresh-token.md` - how the browser
  proves who it is, and what that costs in CSRF defence and session lifetime.
- `adr/0003-revalidate-the-account-on-every-authenticated-request.md` - the revocation strategy that
  ADR-0002 makes necessary; the reason bans are immediate and the API is not stateless.
- `adr/0004-make-soft-delete-the-only-removal-semantic-and-scope-uniqueness-to-live-rows.md` - deletion
  semantics and the partial unique indexes that let a released identity be reused.
- `adr/0005-model-publication-as-a-moderated-state-machine-that-re-moderates-edited-notes.md` - the
  publication lifecycle, including why editing a published note sends it back for approval.
- `adr/0006-render-markdown-with-sanitization-and-never-enable-raw-html.md` - the untrusted-content
  boundary on the platform's only anonymous read path.
- `adr/0007-execute-every-specification-scenario-from-one-acceptance-suite.md` - the verification
  architecture that keeps every `spec.md` scenario executable.

## Follow-Up

ADR-0002 and ADR-0004 are the two most likely to be revisited - the first if refresh tokens or
revocable sessions become necessary, the second if the explicit-filter approach proves too easy to
forget. Either would be recorded as a new superseding ADR; neither existing file may be edited.
