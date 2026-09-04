# Follow-ups

Findings from `/opsx:verify` on `add-notetaking-platform` that were deliberately
deferred rather than fixed before archive. Each is small and self-contained; pick
one up as its own OpenSpec change.

## 1. Design D2 overstates the Origin check

**Where:** `openspec/changes/archive/*-add-notetaking-platform/design.md`, decision D2, and
`apps/api/src/common/origin.guard.ts:28`.

**Gap:** the design says mutating requests "must carry an `Origin` matching the
configured web origin, or be refused". The guard also allows a *missing* Origin,
so non-browser clients (curl, the acceptance suite's HTTP world) can call the API.

**Why the code is right and the text is wrong:** CSRF is browser-borne, and
browsers always send `Origin` on cross-site non-GET requests. A client that sends
no Origin is not a browser and carries no ambient cookie to abuse. Tightening the
guard would break every non-browser client for no security gain.

**Fix:** amend the wording to "…must carry either no `Origin` or one matching
the configured web origin". Specs-zone edit, its own commit. If the project
later wants to forbid non-browser clients, that is a new decision (a new ADR
superseding nothing yet, since ADR-0002 only names the mechanism).

## 2. Moderation queue order can drift under edits

**Where:** `apps/api/src/notes/notes.repository.ts` (`listPending`, `orderBy: { updatedAt: 'asc' }`)
and `apps/api/prisma/schema.prisma` (`Note`).

**Gap:** the spec says "oldest request first". The queue orders by `updatedAt`,
which also moves when an owner edits a *pending* note, sending it to the back of
the queue. No current scenario edits mid-queue, so the suite is green.

**Fix:**
1. Add `requestedAt DateTime? @map("requested_at")` to `Note` with a migration.
2. Set it in `PublicationService.request` on the `PRIVATE → PENDING` transition;
   clear it on approve/reject/withdraw.
3. Order `listPending` by `requestedAt asc`.
4. Pin it with a scenario in `platform-administration`: request A, request B,
   edit A while pending → A is still listed before B.

## Also noted (suggestions, not gaps)

- The `tag` filter on note lists does not normalize its input, so `?tag=Rust
  Lang` will not match `rust-lang`. Run the value through `normalizeTag`
  (`apps/api/src/tags/tag-normalization.ts`), treating invalid input as an empty
  result.
- The archived design's "Migration Plan" names `pnpm --filter api prisma migrate
  deploy`; the real commands are `pnpm migrate` and `pnpm seed`.
