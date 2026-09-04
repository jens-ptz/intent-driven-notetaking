Ordering follows `spec-as-source`: no implementation task exists on its own. Each task in section 2
takes one step definition (or one tightly parameterized family of them) from undefined to passing —
**fails for the right reason → implement the smallest thing that satisfies it → passes → commit** — so
the production code arrives inside the step task that demands it.

Zone discipline: tasks 1.1 and every `openspec/` edit are **specs-zone** work and must be committed
separately from code-zone work. `tasks.md` itself is exempt and may be ticked from either zone.

## 1. First-time setup — skip this whole section if `acceptance-tests/` already exists

- [x] 1.1 Add `stack: javascript` to `openspec/config.yaml`. This is a specs-zone edit: commit it on its own, before any scaffolding
- [x] 1.2 Create the pnpm workspace: root `package.json`, `pnpm-workspace.yaml` covering `apps/*` and `packages/*`, shared TypeScript config, and `.gitignore`
- [x] 1.3 Add `docker-compose.yml` running PostgreSQL 16 on a named volume, with `.env.example` documenting `DATABASE_URL` and `SEED_ADMIN_PASSWORD`
- [x] 1.4 Scaffold `apps/api` as a NestJS application that boots, exposes the health check from `platform-foundation`, and reads its configuration from the environment
- [x] 1.5 Add the initial Prisma schema (`User`, `Note`, `Tag`, the note–tag relation, `Role` and `PublicationState` enums, `deletedAt` on `User` and `Note`, `bannedAt` on `User`) plus the first migration; add the raw-SQL partial unique indexes on `users(email)` and `users(user_name)` scoped to `deleted_at IS NULL` per ADR-0004
- [x] 1.6 Add the idempotent Prisma seed inserting the `hans.admin` administrator, taking the password from `SEED_ADMIN_PASSWORD` and defaulting to `p@assw0rt`
- [x] 1.7 Scaffold `apps/web` as a React + Vite + TypeScript SPA that boots and proxies `/api` to the API in development, and `packages/shared` for the DTO types
- [x] 1.8 Create `acceptance-tests/` at the repo root as an independent JavaScript project whose hooks start the database, run migrations and the seed, boot the API and boot Vite before the suite, and shut them all down after
- [x] 1.9 Copy the acceptance-test-authoring JavaScript reference files verbatim into `acceptance-tests/` — `extract-gherkin.cjs`, `cucumber.cjs`, `openspec-effective-paths.cjs`, and `.gherkin-lintrc` from the shared references root. Destination filenames are load-bearing. Verify the runner extracts Gherkin from every `spec.md` under `openspec/` into `.extracted/` and excludes `openspec/changes/archive/`
- [x] 1.10 Add the HTTP world and cheerio-free JSON page objects for API scenarios, and a per-scenario hook that truncates every table and re-runs the seed so scenarios are order-independent
- [x] 1.11 Add the Playwright fixture and a `web` cucumber profile selecting `.extracted/**/web-client/**` by path, plus a complementary profile excluding it, per ADR-0007. Selection is by profile path, not by tag — the `spec.md` fences hold only Given/When/Then steps
- [x] 1.12 Make the single test command always write an HTML report under `acceptance-tests/reports/`
- [x] 1.13 Add the spec-lint command (`node extract-gherkin.cjs && gherkin-lint .extracted`) and gitignore `acceptance-tests/.extracted/` and `acceptance-tests/reports/`
- [x] 1.14 Write `acceptance-tests/README.md` covering how to run the suite, how to run API-only and browser-only profiles, and where the HTML report lands
- [x] 1.15 Confirm the baseline: `npx cucumber-js --dry-run` resolves only `.extracted/` paths, nothing under `changes/archive/`, and every scenario reports as undefined rather than erroring

## 2. Step definitions — each one: red → green → commit

### 2.1 platform-foundation

- [x] 2.1.1 platform-foundation: `an empty platform database` / `an initialized platform holding the seed administrator` — red → green → commit
- [x] 2.1.2 platform-foundation: `the platform is initialized` (and `initialized again`) — red → green → commit
- [x] 2.1.3 platform-foundation: `an administrator account named "X" exists` / `exactly one account named "X" exists` — red → green → commit
- [x] 2.1.4 platform-foundation: `that account holds the admin role` — red → green → commit
- [x] 2.1.5 platform-foundation: `Hans signs in as "X" with the password "Y"` and `he is signed in as an administrator` — red → green → commit
- [x] 2.1.6 platform-foundation: `<person> owns a note titled "X"` — the shared note-fixture step used across most capabilities — red → green → commit
- [x] 2.1.7 platform-foundation: `<person> is signed in` — the shared session-fixture step — red → green → commit
- [ ] 2.1.8 platform-foundation: `<person> deletes that note` and `the note is absent from her note list` — red → green → commit
- [ ] 2.1.9 platform-foundation: `reading that note reports it does not exist` — red → green → commit
- [ ] 2.1.10 platform-foundation: `<person> has deleted her note titled "X"`, `Hans lists all notes as an administrator`, `the note titled "X" is absent from the results` — red → green → commit
- [x] 2.1.11 platform-foundation: `<person> creates a note titled "X"` and `the identifier of "X" is greater than the identifier of "Y"` — red → green → commit
- [ ] 2.1.12 platform-foundation: `the API is running against an initialized database`, `the health of the platform is checked`, `the platform reports itself healthy` — red → green → commit
- [ ] 2.1.13 platform-foundation: `the API is running and the database is unreachable` and `the platform reports itself unhealthy` — red → green → commit

### 2.2 user-accounts

- [ ] 2.2.1 user-accounts: `no account uses the email "X"` and `a live account uses the email "X"` / `the user name "X"` — red → green → commit
- [ ] 2.2.2 user-accounts: `<person> registers as "X" with the email "Y"` and `her account exists` — red → green → commit
- [ ] 2.2.3 user-accounts: `she holds the user role only` / `his account holds the user role only` — red → green → commit
- [ ] 2.2.4 user-accounts: `<person> tries to register with the email "X"` and `registration is refused because the email is taken` — red → green → commit
- [ ] 2.2.5 user-accounts: `<person> tries to register as "X"` and `registration is refused because the user name is taken` — red → green → commit
- [ ] 2.2.6 user-accounts: `<person> tries to register with the email "X" and the password "Y"`, `registration is refused because the details are invalid`, `no account is created for her` — red → green → commit
- [ ] 2.2.7 user-accounts: `<person> registers with the email "X" and asks for the admin role` — the privilege-escalation guard — red → green → commit
- [ ] 2.2.8 user-accounts: `<person> views her profile`, `she sees her first name, last name, email and user name`, `no password material is shown` — red → green → commit
- [ ] 2.2.9 user-accounts: `<person> changes her last name to "X"` and `her profile shows the last name "X"` — red → green → commit
- [ ] 2.2.10 user-accounts: `<person> is signed in and holds the user role only`, `<person> tries to give herself the admin role`, `the change is refused`, `she still holds the user role only` — red → green → commit
- [ ] 2.2.11 user-accounts: `<person> deletes her account` and `she can no longer sign in with her former credentials` — red → green → commit
- [ ] 2.2.12 user-accounts: `<person> owns a published note titled "X"` and `"X" is absent from the public feed` — the account-deletion cascade — red → green → commit
- [ ] 2.2.13 user-accounts: `<person> has deleted her account which used the email "X"`, `<person> registers with the email "X"`, `his account is created`, `his note list is empty` — identity reuse, which also proves the partial indexes of ADR-0004 survived — red → green → commit

### 2.3 authentication

- [ ] 2.3.1 authentication: `<person> holds an account with the email "X" and the user name "Y"` — red → green → commit
- [ ] 2.3.2 authentication: `<person> signs in with the identifier "X" and her password` and `she is signed in` — covers both the email and the user-name scenario — red → green → commit
- [ ] 2.3.3 authentication: `<person> signs in as "X" with a wrong password`, `someone signs in as "nobody" with any password`, `both attempts are refused with the same message` — red → green → commit
- [ ] 2.3.4 authentication: `<person>'s account is banned` and `sign-in is refused because the account is banned` — red → green → commit
- [ ] 2.3.5 authentication: `<person> has deleted her account` and `sign-in is refused` — red → green → commit
- [ ] 2.3.6 authentication: `<person> has signed in`, `<person> lists her notes`, `the notes are returned` — red → green → commit
- [ ] 2.3.7 authentication: `no one is signed in`, `the note list is requested`, `the request is refused as unauthenticated` — red → green → commit
- [ ] 2.3.8 authentication: `<person> signs out` — red → green → commit
- [ ] 2.3.9 authentication: `<person> is signed in with a valid session`, `Hans bans <person>'s account`, `the request is refused because the account is banned` — the per-request revalidation of ADR-0003 — red → green → commit
- [ ] 2.3.10 authentication: `Hans deletes <person>'s account` mid-session, refused as unauthenticated on the next request — red → green → commit

### 2.4 note-management

- [x] 2.4.1 note-management: `<person> creates a note titled "X" with the text "Y"`, `the note appears in her note list`, `the note is private`, `<person> is its owner` — red → green → commit
- [x] 2.4.2 note-management: `<person> tries to create a note with an empty title` and `creation is refused because the title is required` — red → green → commit
- [x] 2.4.3 note-management: `<person> lists her notes`, `she sees "X"`, `she does not see "Y"` — the ownership boundary on listing — red → green → commit
- [x] 2.4.4 note-management: `<person> owns a private note titled "X"`, `<person> tries to read that note`, `she is told the note does not exist` — not-found rather than forbidden — red → green → commit
- [x] 2.4.5 note-management: `<person> changes its text to "X"` and `reading the note shows the text "X"` — red → green → commit
- [x] 2.4.6 note-management: `<person> tries to change that note's text`, `the change is refused`, `reading it as <person> shows the original text` — red → green → commit
- [x] 2.4.7 note-management: `<person> deletes it` and `it is absent from her note list` — red → green → commit
- [ ] 2.4.8 note-management: deleting a published note removes it from the public feed — red → green → commit
- [x] 2.4.9 note-management: `<person> tries to delete that note`, `the deletion is refused`, `the note is still in <person>'s note list` — red → green → commit

### 2.5 note-tagging

- [ ] 2.5.1 note-tagging: `<person> tags a note with "X"`, `both notes carry the tag "Y"`, `the platform holds a single tag named "Y"` — normalization and lookup-or-create — red → green → commit
- [ ] 2.5.2 note-tagging: `<person> tries to tag a note with "X"` and `the note is refused because the tag is invalid` — unsupported characters — red → green → commit
- [ ] 2.5.3 note-tagging: `<person> tries to tag a note with a name of 33 characters` — the length bound — red → green → commit
- [ ] 2.5.4 note-tagging: `<person> creates a note with no tags` and `the note carries no tags` — red → green → commit
- [ ] 2.5.5 note-tagging: `<person> owns a note tagged "X"`, `<person> creates a note tagged "X"`, `both notes reference the same tag` — red → green → commit
- [ ] 2.5.6 note-tagging: `<person> owns a note tagged "X" and "Y"`, `<person> updates the note with the single tag "X"`, `the note carries only the tag "X"` — whole-set replacement — red → green → commit
- [ ] 2.5.7 note-tagging: `"X" is the only tag on <person>'s note`, `<person> removes "X" from that note`, `<person>'s note references the same tag that <person> used` — orphan retention — red → green → commit
- [ ] 2.5.8 note-tagging: `<person> lists her notes filtered by the tag "X"` and `she sees only the note tagged "X"` — red → green → commit
- [ ] 2.5.9 note-tagging: `a visitor browses the public feed filtered by the tag "X"` and `only the note tagged "X" is listed` — red → green → commit
- [ ] 2.5.10 note-tagging: filtering by an unknown tag yields `she sees no notes` — red → green → commit

### 2.6 note-publication

- [ ] 2.6.1 note-publication: `<person> requests publication of that note` and `the note is pending publication` — red → green → commit
- [ ] 2.6.2 note-publication: `<person>'s note "X" is pending publication`, `a visitor browses the public feed`, `"X" is not listed` — red → green → commit
- [ ] 2.6.3 note-publication: `<person> tries to request publication of that note`, `the request is refused`, `the note is still private` — red → green → commit
- [ ] 2.6.4 note-publication: `<person> requests publication of that note again` and `the request is refused as redundant` — red → green → commit
- [ ] 2.6.5 note-publication: `Hans approves that note`, `the note is published`, `"X" is listed on the public feed` — red → green → commit
- [ ] 2.6.6 note-publication: `Hans rejects that note with the reason "X"`, `the note is private again`, `<person> can read the rejection reason "X"` — red → green → commit
- [ ] 2.6.7 note-publication: `<person> tries to approve that note`, `the attempt is refused`, `the note is still pending publication` — red → green → commit
- [ ] 2.6.8 note-publication: editing a published note returns it to pending and drops it from the feed, per ADR-0005 — red → green → commit
- [ ] 2.6.9 note-publication: `<person>'s published note "X" went back to pending after she edited it` and re-approval restores it to the feed — red → green → commit
- [ ] 2.6.10 note-publication: `<person> withdraws it from publication`, `the note is private`, `it is still in <person>'s note list` — red → green → commit
- [ ] 2.6.11 note-publication: `Hans withdraws that note from publication` — administrator withdrawal — red → green → commit
- [ ] 2.6.12 note-publication: `a visitor with no account browses the public feed` and `"X" is listed` — red → green → commit
- [ ] 2.6.13 note-publication: `a visitor with no account opens "X"` and `the visitor sees its title, text and tags` — red → green → commit
- [ ] 2.6.14 note-publication: private notes never appear on the feed — red → green → commit
- [ ] 2.6.15 note-publication: `Hans bans <person>'s account` hides her published notes from the feed — red → green → commit
- [ ] 2.6.16 note-publication: `Hans unbans <person>'s account` restores them — red → green → commit
- [ ] 2.6.17 note-publication: `a visitor with no account tries to open "X"` and `the visitor is told the note does not exist` — red → green → commit

### 2.7 platform-administration

- [ ] 2.7.1 platform-administration: `Hans lists all notes as an administrator` across owners and `he sees both "X" and "Y"` — red → green → commit
- [ ] 2.7.2 platform-administration: `Hans reads that note as an administrator` and `he sees its title and text` — red → green → commit
- [ ] 2.7.3 platform-administration: `Hans changes its title to "X"` and the owner's list reflects it — red → green → commit
- [ ] 2.7.4 platform-administration: `Hans deletes that note as an administrator` — red → green → commit
- [ ] 2.7.5 platform-administration: `Hans opens the moderation queue`, `it holds "X"`, `it does not hold "Y" or "Z"` — red → green → commit
- [ ] 2.7.6 platform-administration: `<person> requested publication of "X" before <person> requested publication of "Y"` and `"X" is listed before "Y"` — queue ordering — red → green → commit
- [ ] 2.7.7 platform-administration: `<person> holds a live account`, `Hans bans <person>'s account`, `<person> cannot sign in` — red → green → commit
- [ ] 2.7.8 platform-administration: `Hans unbans <person>'s account` and `<person> can sign in with her existing password` — red → green → commit
- [ ] 2.7.9 platform-administration: `Hans tries to ban his own account`, `the attempt is refused`, `Hans can still sign in` — red → green → commit
- [ ] 2.7.10 platform-administration: `Hans deletes <person>'s account as an administrator` with the full cascade — red → green → commit
- [ ] 2.7.11 platform-administration: `Hans tries to delete his own account as an administrator` and `the attempt is refused` — red → green → commit
- [ ] 2.7.12 platform-administration: `<person> tries to list all notes as an administrator` / `open the moderation queue` / `ban <person>'s account`, and `every attempt is refused as forbidden` — red → green → commit
- [ ] 2.7.13 platform-administration: `the moderation queue is requested` unauthenticated and `the request is refused as unauthenticated` — red → green → commit

### 2.8 web-client — Playwright-backed page objects, `web` profile

- [ ] 2.8.1 web-client: page-object scaffolding — landing page, sign-in, registration, note list, editor and admin area objects exposing intent-level methods, waiting on visible state rather than timeouts — red → green → commit
- [ ] 2.8.2 web-client: `a visitor with no account opens the landing page` and `"X" is shown in the public feed` — red → green → commit
- [ ] 2.8.3 web-client: `a visitor opens that note`, `"X" is shown as a heading`, `"Y" is shown in italics` — markdown rendering — red → green → commit
- [ ] 2.8.4 web-client: `a published note whose text contains an embedded script tag`, `the script does not run`, `its markup is not added to the page` — the sanitization guarantee of ADR-0006 — red → green → commit
- [ ] 2.8.5 web-client: `<person> completes the registration form with valid details`, `she is signed in`, `her note list is shown` — red → green → commit
- [ ] 2.8.6 web-client: `<person> submits the sign-in form with a wrong password`, `she is shown a sign-in error`, `she is not signed in` — red → green → commit
- [ ] 2.8.7 web-client: `<person> signs out`, `the public feed is shown`, `no note list is offered` — red → green → commit
- [ ] 2.8.8 web-client: `<person> opens her note list`, `"X" is shown as private`, `"Y" is shown as published` — red → green → commit
- [ ] 2.8.9 web-client: `<person> deletes it from her note list` and `"X" is no longer listed` — red → green → commit
- [ ] 2.8.10 web-client: `<person> is editing a note`, `<person> types "X" into the editor`, `the preview shows "X" as a heading` — red → green → commit
- [ ] 2.8.11 web-client: `<person> enters the tags "X" and "Y"`, `<person> saves the note`, `the note is shown with the tags "x" and "y"` — red → green → commit
- [ ] 2.8.12 web-client: `<person> requests publication from the editor` and `the note is shown as pending publication` — red → green → commit
- [ ] 2.8.13 web-client: `Hans rejected <person>'s note "X" with the reason "Y"` and `she is shown the rejection reason "Y"` — red → green → commit
- [ ] 2.8.14 web-client: `Hans opens the moderation queue and approves "X"` and `"X" is shown in the public feed` — red → green → commit
- [ ] 2.8.15 web-client: `Hans bans <person> from the account list` and `<person> is shown as banned in the account list` — red → green → commit
- [ ] 2.8.16 web-client: `<person> navigates to the administration area`, `she is refused access`, `no administration navigation is offered to her` — red → green → commit
- [ ] 2.8.17 web-client: add the editor's warning that saving a published note sends it back for approval, as the design's mitigation for ADR-0005 — red → green → commit

## 3. Completion

- [ ] 3.1 Run `npm run lint:specs` in `acceptance-tests/` and resolve every gherkin-lint finding
- [ ] 3.2 Run the full suite: every scenario passes, zero pending and zero undefined steps, HTML report generated under `acceptance-tests/reports/`
- [ ] 3.3 Verify the profiles in isolation: the browser-only profile and the API-only profile each run and pass on their own
- [ ] 3.4 Confirm `docker compose down -v` followed by compose up, migrate, seed and the suite reproduces a green run from nothing
- [ ] 3.5 Run `openspec validate add-notetaking-platform --type change --strict` and resolve any finding before archive
- [ ] 3.6 Check the code zone against the design: no `rehype-raw` anywhere in the dependency tree, the partial unique indexes present in the applied migration, and no read path missing its `deletedAt` filter
- [ ] 3.7 Write the root `README.md` covering prerequisites, first run, the seeded administrator, and the plain statement that `SEED_ADMIN_PASSWORD` must be changed before this is exposed to anyone
