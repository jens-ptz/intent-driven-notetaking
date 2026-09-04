# Acceptance tests

This suite is the executable form of the specifications. It runs the Gherkin
extracted from every `spec.md` under `openspec/`, and it is the only place that
proves the platform behaves as specified (ADR-0007).

## Running it

From the repository root:

```sh
pnpm test:acceptance
```

or from this directory:

```sh
pnpm test          # every scenario, API and browser
pnpm test:api      # everything except the browser scenarios - the fast loop
pnpm test:web      # browser scenarios only
pnpm lint:specs    # extract, then gherkin-lint the result
```

You do not need to start anything first. The suite's `BeforeAll` hook brings up
the PostgreSQL container, creates and migrates its own database, builds the API,
boots it, and boots Vite. `AfterAll` shuts all of it down again.

## Reports

Every run writes an HTML report:

| Command | Report |
| --- | --- |
| `pnpm test` | `reports/cucumber-report.html` |
| `pnpm test:api` | `reports/cucumber-report-api.html` |
| `pnpm test:web` | `reports/cucumber-report-web.html` |

`reports/` and `.extracted/` are gitignored.

## What the suite touches

It uses its **own** database, `notes_test`, on the same container as
development, and its own ports (API 3210, Vite 5274). It never truncates the
development database and never collides with a dev server you left running.
Override with `TEST_DB_NAME`, `TEST_API_PORT` and `TEST_WEB_PORT` if needed.

Every scenario starts from an empty database plus the guaranteed `hans.admin`
administrator, so scenarios are order-independent.

## Layout

```
extract-gherkin.cjs            copied verbatim from the skill pack
openspec-effective-paths.cjs   copied verbatim from the skill pack
cucumber.cjs                   the pack's file, extended with api/web profiles
.gherkin-lintrc                copied verbatim from the skill pack
support/
  config.js       ports, URLs and the test database
  processes.js    spawning and waiting for the API and Vite
  database.js     create, migrate, truncate and re-seed
  world.js        HTTP client with one cookie jar per person
  browser.js      Playwright fixture, launched lazily
  hooks.js        the lifecycle described above
  pages/          page objects - all UI knowledge lives here
step-definitions/ one file per capability
```

## Editing specs, not features

`.extracted/` is generated, wiped and rebuilt on every run. Never edit it. A
failure reported at `.extracted/<path>/spec.feature:42` is line 42 of the
corresponding `spec.md` — extraction preserves line numbers exactly.

## The seed

Per-scenario reset inserts the administrator with plain SQL, reusing a password
hash computed once per run, because hashing with argon2 for all 93 scenarios
would dominate the runtime. The real `prisma/seed.ts` is still exercised for
real: the `platform-foundation` scenarios invoke it as their "the platform is
initialized" step.
