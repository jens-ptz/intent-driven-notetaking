# 0006 Render markdown with sanitization and never enable raw HTML

Status: accepted
Date: 2026-09-04

## Context and Problem Statement

The body of a note is markdown written by one user and, once published, rendered in the browsers of
anonymous visitors who have no relationship with that author. This is the platform's largest untrusted
input path. Markdown renderers commonly offer a raw-HTML passthrough, which turns every published note
into an arbitrary script injection point.

## Considered Options

- Render with `react-markdown` and `rehype-sanitize` at display time, never installing `rehype-raw`.
- Sanitize the markdown on write and store the sanitized text.
- Render raw HTML and rely on a Content Security Policy to contain what it allows.

## Decision Outcome

Chosen option: "render with `react-markdown` and `rehype-sanitize`, never installing `rehype-raw`",
because the safe behaviour is then the default one: there is no flag a future contributor can flip to
allow scripts, and the stored note stays byte-for-byte what its author typed. Sanitizing on write was
rejected because it destroys the author's original text and cannot be re-tightened when the sanitizer
improves. Relying on a Content Security Policy alone was rejected because it mitigates the consequences
of injection rather than preventing it, and a single policy mistake re-exposes every published note.

### Consequences

- Good, because a script embedded in a note cannot execute in any reader's browser.
- Good, because tightening or loosening sanitization applies immediately to all existing notes, since
  it happens at render time.
- Good, because it composes with the httpOnly session cookie of ADR-0002: even a sanitizer bypass
  cannot read the session.
- Bad, because authors cannot use inline HTML for anything, including harmless layout, and requests for
  it will have to be refused or met with a supersession.
- Bad, because sanitization runs on every render rather than once on write, a cost that grows with note
  size.
