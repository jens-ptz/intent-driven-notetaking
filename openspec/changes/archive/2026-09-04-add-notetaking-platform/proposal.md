## Why

The repository is an empty OpenSpec template with no application. We need a small but complete
product to exercise the `proposal -> specs -> design -> adr -> tasks` lifecycle end to end, and a
personal note-taking platform with moderated public sharing is rich enough to produce real
authorization, lifecycle and moderation behaviour without becoming a large system.

Every rule below was settled in a design interrogation before drafting; the alternatives that were
rejected are recorded in `design.md`.

## What Changes

**Repository and infrastructure**

- Introduce a pnpm workspace monorepo: `apps/api` (NestJS + Prisma), `apps/web` (React + Vite SPA),
  `packages/shared` for API types.
- Add a `docker-compose.yml` running PostgreSQL for local development and for the **Acceptance Suite**.
- Add Prisma schema, migrations and an idempotent seed that guarantees the **Seed Administrator**
  `hans.admin` / `p@assw0rt` exists in every environment.
- Add `acceptance-tests/`, a single cucumber-js project that extracts Gherkin from every `spec.md`;
  API scenarios run over HTTP, web scenarios run through Playwright-backed page objects tagged `@web`.
- Set `stack: javascript` in `openspec/config.yaml`.

**Data model** — all primary keys are Postgres `autoincrement` integers, and every delete is a
**Soft Delete**.

- `User`: id, first_name, last_name, email, user_name, password hash, **Role** array (`USER`, `ADMIN`),
  banned-at, deleted-at. Email and user name are unique among **Live Rows** only, so a deleted
  identity can be registered again.
- `Note`: id, title, text, owner, **Publication State** (`PRIVATE` / `PENDING` / `PUBLISHED`), deleted-at.
- `Tag`: id, normalized lowercase name (unique). **Tags** are shared reference data and are never
  soft-deleted; a Tag left on zero Notes is retained.
- `Note` ↔ `Tag` is many-to-many; a **Note** carries 0..n Tags and a Tag sits on 0..n Notes.

**Behaviour**

- Registration is self-service. Login accepts either email or user name as the identifier and sets an
  **Access Token Cookie**; there is no refresh token and no password reset.
- The **Auth Guard** reloads the **Account** on every authenticated request, so a **Ban** or account
  deletion takes effect on the very next call rather than at token expiry.
- A **Registered User** creates, lists, reads, updates and deletes only their own **Notes**, and can
  delete their own Account. Deleting an Account cascades a Soft Delete to all of that Account's Notes.
- A **Note** becomes public only through a **Publication Request**: the **Owner** submits it, it enters
  the **Moderation Queue** as pending, and an **Administrator** approves or rejects it. Only approved
  Notes reach the **Public Feed**.
- The Public Feed is readable by anonymous visitors and excludes Notes whose Owner is banned or deleted.
- Editing the content of a published **Note** returns it to pending for re-approval. Without this, an
  **Owner** could publish acceptable content and then replace it, and the moderation decision would not
  apply to what is actually public.
- An **Owner** may withdraw their own published **Note**, and an **Administrator** may withdraw any.
- An **Administrator** may list, read, update and delete every Note, work the Moderation Queue, and
  ban, unban or delete any Account. An **Administrator** may not ban or administratively delete their
  own Account, so the platform cannot be left with no reachable Administrator by a single action.

**Web client** — React SPA with anonymous Public Feed browsing, register/login, own-notes list, a
markdown editor with publication request, and an admin area (Moderation Queue, user administration,
all-notes browser).

**Decisions taken here that the original request did not settle** — called out so they can be struck:

- List endpoints and the Public Feed accept a `tag` filter. Without it, **Tags** have no observable
  behaviour beyond being stored and displayed, and no scenario could assert them meaningfully.
- Editing a published **Note** sends it back through moderation (above).
- An **Administrator** cannot ban or administratively delete their own **Account** (above).
- Reading a **Note** owned by someone else is refused as _not found_ rather than _forbidden_, so note
  identifiers cannot be probed to learn what other people have written.

## Capabilities

### New Capabilities

- `platform-foundation`: workspace, dockerized PostgreSQL, Prisma schema and migrations, the idempotent
  **Seed Administrator**, the API health endpoint, and the Soft Delete invariants every other capability
  relies on.
- `user-accounts`: self-service registration with validation, viewing and updating one's own profile,
  self-deletion with cascade, and reuse of a released email or user name.
- `authentication`: login by email or user name, the **Access Token Cookie**, logout, and per-request
  rejection of banned or deleted **Accounts**.
- `note-management`: create, list, read, update and delete one's own **Notes**, with ownership enforced
  on every path and Soft Delete on removal.
- `note-tagging`: **Tag Normalization**, lookup-or-create on note write, tag replacement on update,
  retention of unused Tags, and filtering note lists by tag.
- `note-publication`: the **Publication Request** lifecycle, Administrator approve and reject,
  unpublishing, and the anonymous **Public Feed** with its owner-ban and owner-deletion filters.
- `platform-administration`: Administrator access to all **Notes**, the **Moderation Queue**, and
  **Ban** / unban / delete on any Account, including refusal of privilege escalation by non-admins.
- `web-client`: the browser-observable behaviour of the SPA — anonymous Public Feed, register and login
  flows, own-notes list, markdown editing and publication request, and the role-gated admin area.

### Modified Capabilities

None. `openspec/specs/` is empty; this is the first change in the repository.

## Impact

- **New code**: `apps/api`, `apps/web`, `packages/shared`, `acceptance-tests/`, `prisma/`,
  `docker-compose.yml`, workspace root configuration.
- **New dependencies**: NestJS, Prisma, `@nestjs/jwt`, `argon2`, `class-validator`, `cookie-parser`,
  React, Vite, TanStack Query, React Router, `react-markdown` with `rehype-sanitize`,
  `@cucumber/cucumber`, `playwright`, `cheerio`, `gherkin-lint`.
- **New services**: a PostgreSQL container; no external service and no third-party account.
- **Repository config**: `openspec/config.yaml` gains `stack: javascript`; `glossary/` and `adr/` are
  created at the repository root.
- **Security surface**: password storage, cookie-based session, CSRF on mutating routes, and markdown
  rendering of attacker-supplied content on a page served to anonymous visitors.
- **Out of scope**: email verification, password reset, refresh tokens, rate limiting, restoring
  soft-deleted records, full-text search, note sharing between specific users, and any deployment target
  beyond local Docker.
