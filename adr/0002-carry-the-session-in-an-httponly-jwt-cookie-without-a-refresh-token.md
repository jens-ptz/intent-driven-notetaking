# 0002 Carry the session in an httpOnly JWT cookie without a refresh token

Status: accepted
Date: 2026-09-04

## Context and Problem Statement

The SPA must prove who it is on every API call. The platform renders markdown written by one user to
anonymous strangers, so a cross-site scripting flaw in the renderer is a realistic threat, and whatever
holds the session must survive it. The choice also determines whether the client needs token-refresh
machinery and how sign-out behaves.

## Considered Options

- An httpOnly, `SameSite=Lax` cookie holding a one-hour JWT, with no refresh token.
- A bearer JWT returned in the response body and stored in `localStorage`.
- A short-lived access token in memory plus a rotating refresh token in an httpOnly cookie.

## Decision Outcome

Chosen option: "an httpOnly cookie holding a one-hour JWT, with no refresh token", because page scripts
cannot read it, so an injected script on a note page cannot steal a session. `localStorage` was
rejected precisely because any injected script can read it, which is the wrong trade for a product
whose core feature is rendering untrusted content. The access-and-refresh pair was rejected as the
right answer to a problem this platform does not yet have: it roughly doubles the authentication
surface to buy shorter-lived credentials, and it can supersede this record when that matters.

### Consequences

- Good, because a successful XSS cannot exfiltrate the session credential.
- Good, because the client needs no token storage, no refresh scheduling and no retry-on-401 logic.
- Bad, because cookies are sent automatically, so mutating routes need CSRF defence; `SameSite=Lax`
  withholds the cookie from cross-site non-GET requests and an `Origin` check backs it up.
- Bad, because a one-hour expiry with no refresh means users are signed out mid-session with no warning.
- Bad, because the cookie cannot be revoked by itself, which forces the separate decision recorded in
  ADR-0003.
