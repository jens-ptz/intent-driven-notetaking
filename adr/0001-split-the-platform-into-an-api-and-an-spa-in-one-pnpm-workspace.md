# 0001 Split the platform into an API and an SPA in one pnpm workspace

Status: accepted
Date: 2026-09-04

## Context and Problem Statement

The repository is greenfield and needs a physical shape before any code exists. The product is a
note-taking platform with a browser client and a database, and the same request and response types are
consumed on both sides. The repository layout decided here will constrain how every later change is
organised, built and tested, so it is worth recording rather than discovering.

## Considered Options

- A pnpm workspace with `apps/api` (NestJS), `apps/web` (React + Vite SPA) and `packages/shared` for
  the types both sides import.
- A pnpm workspace with `apps/api` and a Next.js `apps/web`, giving server rendering for public pages.
- Two independent npm projects, `backend/` and `frontend/`, with no workspace tooling.

## Decision Outcome

Chosen option: "a pnpm workspace with `apps/api`, `apps/web` and `packages/shared`", because it keeps
exactly one server process in the system while still letting the compiler check the API contract that
the client depends on. Next.js was rejected because server rendering buys SEO for public notes at the
cost of a second Node runtime and a session model split between server and browser, neither of which
any requirement asks for. Two unlinked projects were rejected because the API types would be
maintained twice by hand.

### Consequences

- Good, because the API contract is checked at compile time from a single source in `packages/shared`.
- Good, because one install and one test command cover the whole repository.
- Good, because the API is the only server, so there is exactly one place where authorization lives.
- Bad, because public notes are rendered client-side and are therefore poorly indexed by search engines
  and slower to first paint; reversing this means adopting a server-rendering framework.
- Bad, because pnpm workspaces add a tooling concept that a contributor must understand before the
  first build.
