# 0004 Make soft delete the only removal semantic and scope uniqueness to live rows

Status: accepted
Date: 2026-09-04

## Context and Problem Statement

Every delete in the platform is required to be reversible in principle: accounts and notes are marked
as deleted rather than removed. That requirement collides with identity uniqueness. If a user deletes
their account and email is globally unique, the address is burned forever and the person can never come
back, which is not what "delete my account" is understood to mean. How deletion is represented, and how
it interacts with uniqueness, shapes every query in the system.

## Considered Options

- A `deleted_at` timestamp on accounts and notes, filtered explicitly in per-entity repositories, with
  partial unique indexes on email and user name restricted to rows where `deleted_at IS NULL`.
- The same `deleted_at` column, but with a Prisma client extension injecting the filter into every
  query automatically.
- Hard deletes for accounts and soft deletes for notes only.
- Soft delete with global unique constraints, rewriting the email on delete (for example to
  `deleted-17-priya@example.com`) so the original becomes free.

## Decision Outcome

Chosen option: "explicit `deleted_at` filters in repositories plus partial unique indexes", because the
database enforces the uniqueness rule that actually applies — one live account per address — while every
query states plainly which rows it means. The client extension was rejected because it silently changes
the meaning of every query, behaves awkwardly for nested reads and relation counts, and makes the rare
query that legitimately wants deleted rows hard to express. Hard-deleting accounts was rejected because
it contradicts the platform-wide requirement. Rewriting the email on delete was rejected because it
corrupts the very record that soft deletion exists to preserve.

### Consequences

- Good, because a released email or user name can be registered again, enforced by the database rather
  than by application code.
- Good, because every read path says out loud whether it includes deleted rows.
- Bad, because the partial indexes cannot be expressed in the Prisma schema and must live in
  hand-written SQL inside a migration, where a future generated migration could drop them unnoticed.
- Bad, because a new read path that forgets its `deleted_at` filter leaks deleted content, and only a
  test will catch it.
- Bad, because deleted rows accumulate with no purge path, so storage grows monotonically and any future
  retention policy becomes its own change.
