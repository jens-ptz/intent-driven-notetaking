# web-client

Requirement headings gain a Group Term. The browser-observable behaviour is unchanged in wording and
in behaviour. `Read Public Feed`, `Sign In` and `Guard Administration` are shared with the API
capabilities that specify the same operations, which is what makes those families visible.

Two of these requirements bundle more than one operation, so their Group Term names only the dominant
one: `Sign In` also covers registration, and `Guard Administration` also covers offering the area.
Splitting them is recorded as a follow-up in the proposal rather than done here, because splitting a
requirement changes the specs instead of renaming them.

## RENAMED Requirements

- FROM: `### Requirement: A visitor browses the Public Feed without signing in`
- TO: `### Requirement: Read Public Feed - A visitor browses the Public Feed without signing in`

- FROM: `### Requirement: A visitor registers and signs in from the browser`
- TO: `### Requirement: Sign In - A visitor registers and signs in from the browser`

- FROM: `### Requirement: A Registered User works with their own Notes in the browser`
- TO: `### Requirement: Manage Notes - A Registered User works with their own Notes in the browser`

- FROM: `### Requirement: The editor writes markdown, Tags and Publication Requests`
- TO: `### Requirement: Edit Note - The editor writes markdown, Tags and Publication Requests`

- FROM: `### Requirement: The admin area is gated on the admin Role`
- TO: `### Requirement: Guard Administration - The admin area is gated on the admin Role`
