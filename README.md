# Notes

A small note-taking platform with moderated public sharing: a NestJS + Prisma API,
a React + Vite client, PostgreSQL in Docker, and an acceptance suite that executes
the OpenSpec specifications directly.

It exists to exercise the full OpenSpec lifecycle — `proposal → specs → design →
adr → tasks → apply` — on something with real authorization, lifecycle and
moderation behaviour. The change that built it is
`openspec/changes/add-notetaking-platform/`; the decisions it committed to are in
[`adr/`](adr/); the vocabulary is in [`glossary/`](glossary/).

## Prerequisites

- Node 22+ with corepack (`corepack enable` gives you the pinned pnpm)
- Docker with Compose v2
- For the browser scenarios: `pnpm --filter @notes/acceptance-tests exec playwright install chromium`

## First run

```sh
cp .env.example .env          # local defaults; see "The seeded administrator"
pnpm install
pnpm db:up                    # PostgreSQL 16 on port 5433
pnpm migrate                  # applies the schema, including the partial unique indexes
pnpm seed                     # guarantees hans.admin exists - safe to re-run
pnpm dev                      # API on :3000, web on :5273
```

Open <http://localhost:5273>. The API is at `http://localhost:3000/api/v1`, with a
health check at `/api/v1/health`.

Ports 5432 and 5173 are the conventional defaults and are frequently taken by a
native PostgreSQL or another Vite project, so this repository defaults to 5433 and
5273. Both are overridable in `.env`.

## The seeded administrator

Every environment is guaranteed to hold an administrator account:

| user name    | password    |
| ------------ | ----------- |
| `hans.admin` | `p@assw0rt` |

The password comes from `SEED_ADMIN_PASSWORD` in `.env`, and the default is that
well-known value.

**This platform is local-only until you change it.** A known credential with the
admin role exists by construction, and nothing else in the system compensates for
it. Set `SEED_ADMIN_PASSWORD` to something private *before* the first `pnpm seed`
in any environment another person can reach. Re-seeding never overwrites an
existing account, so changing the variable later does not rotate a password that
is already in the database.

## Running the specifications

```sh
pnpm test:acceptance          # everything: 93 scenarios, API and browser
pnpm lint:specs               # extract the Gherkin and lint it
```

Or from `acceptance-tests/`: `pnpm test:api` for the fast loop without a
browser, `pnpm test:web` for the browser scenarios only. You do not need to
start anything first — the suite brings up the database, creates its own
`notes_test` database, builds and boots the API, boots Vite, and shuts it all
down again. It never touches your development database. Every run writes an
HTML report under `acceptance-tests/reports/`.

The `.feature` files under `acceptance-tests/.extracted/` are generated from the
`spec.md` files and preserve line numbers exactly: a failure at
`spec.feature:42` is line 42 of the corresponding `spec.md`. Never edit them.
See [`acceptance-tests/README.md`](acceptance-tests/README.md).

## Layout

```
apps/api/            NestJS + Prisma; routes are authenticated unless marked @Public
apps/web/            React + Vite SPA; markdown is rendered sanitized, raw HTML is never enabled
packages/shared/     DTO types both sides import
acceptance-tests/    cucumber-js + Playwright; the executable specification
openspec/            proposal, specs, design, ADR manifest and tasks for each change
adr/                 durable architectural decisions, immutable once accepted
glossary/            business and technical vocabulary the artifacts use
docker-compose.yml   PostgreSQL
```

## How the platform behaves

- Deletes are always soft. A deleted account releases its email and user name for
  re-registration, enforced by partial unique indexes scoped to live rows.
- A ban or an account deletion takes effect on the very next request, because the
  auth guard reloads the account every time rather than trusting the token.
- A note becomes public only through a request an administrator approves. Editing a
  published note sends it back for approval, so what is public is always what was
  approved.
- The public feed is readable without an account and omits notes whose owner is
  banned or deleted.

The full behaviour is specified, scenario by scenario, under
`openspec/changes/add-notetaking-platform/specs/`.

## About this repository's template

This project was started from the intent-driven OpenSpec template. The template's
own notes on the workflow, skills and schema are preserved in
[`INSTALL_TEMPLATE.md`](INSTALL_TEMPLATE.md) and `openspec/schemas/intent-driven/README.md`.
