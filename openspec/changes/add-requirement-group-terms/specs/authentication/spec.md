# authentication

Requirement headings gain a Group Term. Signing in, session carriage and per-request revalidation are
unchanged in wording and in behaviour.

## RENAMED Requirements

- FROM: `### Requirement: Sign-in accepts either email or user name`
- TO: `### Requirement: Sign In - Sign-in accepts either email or user name`

- FROM: `### Requirement: A session is carried by the Access Token Cookie`
- TO: `### Requirement: Carry Session - A session is carried by the Access Token Cookie`

- FROM: `### Requirement: Bans and deletions take effect on the next request`
- TO: `### Requirement: Revalidate Account - Bans and deletions take effect on the next request`
