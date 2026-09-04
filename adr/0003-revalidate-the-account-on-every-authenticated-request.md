# 0003 Revalidate the account on every authenticated request

Status: accepted
Date: 2026-09-04

## Context and Problem Statement

ADR-0002 chose a stateless JWT, which stays valid until it expires. Administrators must be able to ban
an account and users must be able to delete their own account, and both are expected to take effect
now rather than eventually. A specification cannot honestly describe a ban that a user keeps working
through for up to an hour, so the revocation strategy has to be settled explicitly.

## Considered Options

- Load the account by primary key inside the authentication guard on every request and refuse it when
  it is banned or deleted.
- Trust the token's claims and enforce bans only at sign-in, accepting up to one hour of lag.
- Add a token-version column, embed the version as a claim, and compare the two on each request.

## Decision Outcome

Chosen option: "load the account on every request", because it makes bans and deletions effective on
the very next call and needs no extra schema. Trusting claims was rejected because the resulting
behaviour is not describable as a scenario anyone would accept. The token-version approach was rejected
because it also queries the database on every request but adds a column and a bump-on-ban obligation to
buy nothing extra at this scale.

### Consequences

- Good, because a ban, an unban and an account deletion are all observable on the next request.
- Good, because the guard is the single place enforcing account state, so no route can forget it.
- Bad, because the session is no longer stateless: every authenticated request costs one indexed
  primary-key lookup, which rules out serving the API from a cache or an edge runtime without revisiting
  this.
- Bad, because a database outage now fails authenticated reads that a purely stateless check would have
  served.
