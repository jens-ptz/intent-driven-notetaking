## Why

Requirement headings in the **Specs Zone** are free-form sentences. Nothing in a heading says which
operation the requirement governs, so the 34 requirements read as a flat list, and the several places
that specify one operation from different angles cannot be recognised as one family. Adding a short
operation label to the front of every heading makes each capability scannable, gives every requirement
a stable short handle to cite from tasks, ADRs and commit messages, and exposes the cross-capability
families that are currently invisible.

Now, because the specs are complete and stable but no active change depends on their heading text, so
a rename costs nothing beyond the rename itself. Every later change would have to be rewritten if the
convention arrived after it.

## What Changes

**The convention** — every requirement heading becomes:

```
### Requirement: <Group Term> - <Intent Sentence>
```

- The Group Term names the requirement's primary operation as `<Verb> <Object>` in Title Case, one to
  three words. Invariants use the same shape, so `Removal is always a Soft Delete` is grouped under
  `Remove Record` rather than a bare noun.
- The separator is space, ASCII hyphen-minus, space. It is inert for the Gherkin extractor, which
  copies the whole heading into a `Rule:` name.
- The Intent Sentence is the existing heading text, unchanged in every one of the 34 renames.
- A Group Term is unique within its capability, so `<capability> + <Group Term>` is a short unambiguous
  handle for a requirement.
- The same Group Term is reused verbatim across capabilities when they address the same operation.
  `Read Public Feed` covers both the API rule in `note-publication` and the browser rule in
  `web-client`; `Sign In` and `Guard Administration` likewise span two capabilities each.

**Rename all 34 requirements** across all eight capabilities. **BREAKING** for spec identity keys:
a requirement heading is the match key for MODIFIED, REMOVED and RENAMED deltas, for the extracted
Gherkin `Rule:` name, and for delta composition in the **Acceptance Suite**. No behaviour changes, no
scenario changes and no application code changes.

**Relax one lint rule.** A RENAMED-only delta carries no scenarios, and `lint:specs` currently fails
it with `no-files-without-scenarios`. Verified by running the extractor and `gherkin-lint` over a
RENAMED-only delta: exit 1. The rule moves to the deliberately-off block in
`acceptance-tests/.gherkin-lintrc`, alongside `no-dupe-feature-names`, which is already off for the
same reason: a legitimate OpenSpec delta shape trips it. This gap is pre-existing rather than
introduced here, since a REMOVED-only delta has always had the same problem.

- Alternative rejected: keep the rule on and lint `.extracted/specs` and `.extracted/changes` in two
  passes with two config files. `gherkin-lint` has no per-path rule scoping, and it hard-errors on a
  non-existent path, so the second pass needs a guard for the periods when no change is active. The
  cost is a second config file, a more complex script and a new failure mode, to preserve a rule that
  the schema instruction and `/opsx:verify` already enforce more directly.

**Record the convention** in `openspec/schemas/intent-driven/templates/spec.md` and in the schema's
`specs` instruction, so future requirements are born with a Group Term instead of needing a second
rename later.

**Add two glossary entries** to `glossary/technical.md`: Group Term and Intent Sentence. Both are
needed to state the convention, and neither is covered by an existing term.

**The full mapping** — Group Term followed by the Intent Sentence it prefixes:

| Capability | Group Term | Intent Sentence |
| --- | --- | --- |
| `authentication` | Sign In | Sign-in accepts either email or user name |
| `authentication` | Carry Session | A session is carried by the Access Token Cookie |
| `authentication` | Revalidate Account | Bans and deletions take effect on the next request |
| `user-accounts` | Register Account | Visitors register their own Account |
| `user-accounts` | Manage Profile | Account holders manage their own profile |
| `user-accounts` | Delete Own Account | Self-deletion cascades to the holder's Notes |
| `user-accounts` | Release Identity | A deleted identity is released for reuse |
| `note-management` | Create Note | A Registered User creates Notes |
| `note-management` | List Notes | A Registered User lists and reads only their own Notes |
| `note-management` | Update Note | An Owner updates their own Note |
| `note-management` | Delete Note | An Owner deletes their own Note |
| `note-tagging` | Normalize Tag | Tag input is normalized before lookup |
| `note-tagging` | Attach Tag | Tags are created on demand and shared between Notes |
| `note-tagging` | Replace Tags | Updating a Note replaces its whole Tag set |
| `note-tagging` | Filter by Tag | Note lists can be filtered by Tag |
| `note-publication` | Request Publication | An Owner requests publication |
| `note-publication` | Decide Publication | An Administrator approves or rejects a Publication Request |
| `note-publication` | Re-moderate Note | Editing a published Note returns it to moderation |
| `note-publication` | Withdraw Note | A published Note can be withdrawn |
| `note-publication` | Read Public Feed | The Public Feed is readable without an Account |
| `platform-administration` | Administer Notes | An Administrator reaches every Note |
| `platform-administration` | List Moderation Queue | The Moderation Queue lists work awaiting a decision |
| `platform-administration` | Ban Account | An Administrator bans and unbans Accounts |
| `platform-administration` | Delete Account | An Administrator deletes Accounts |
| `platform-administration` | Guard Administration | Administration is closed to everyone else |
| `platform-foundation` | Seed Administrator | Seed Administrator always exists |
| `platform-foundation` | Remove Record | Removal is always a Soft Delete |
| `platform-foundation` | Identify Record | Records carry autoincrement integer identifiers |
| `platform-foundation` | Report Readiness | The API reports its readiness |
| `web-client` | Read Public Feed | A visitor browses the Public Feed without signing in |
| `web-client` | Sign In | A visitor registers and signs in from the browser |
| `web-client` | Manage Notes | A Registered User works with their own Notes in the browser |
| `web-client` | Edit Note | The editor writes markdown, Tags and Publication Requests |
| `web-client` | Guard Administration | The admin area is gated on the admin Role |

The longest resulting heading is 96 characters, for `Decide Publication`. The spec files already wrap
prose at 103 to 105 characters, so no rewrapping is needed.

**Decisions taken here that the request did not settle** — called out so they can be struck:

- Naming runs verb-first rather than object-first. Object-first noun phrases such as `Note Creation`
  group by leading noun, which sounds closer to the stated goal, but inside a capability the object is
  nearly constant, so `Note` would repeat four times in `note-management` and carry no information.
  The capability file already fixes the object; the verb is the distinguishing word.
- Four requirements bundle more than one operation, so no Group Term fits them cleanly. They keep a
  compromise term and stay unsplit, because splitting a requirement changes the specs rather than
  renaming them, which is a different and larger change. Recorded under Impact as follow-ups.
- `Seed Administrator` repeats its own Intent Sentence almost verbatim. Left as is rather than
  invented into `Bootstrap Administrator`, because the glossary already fixes `Seed Administrator` as
  the name of that account.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

No behaviour changes. Each capability below needs a delta spec carrying only a
`## RENAMED Requirements` section, because a requirement heading is a spec-level identity key and
renaming it is what this change does.

- `authentication`: 3 requirement headings renamed.
- `user-accounts`: 4 requirement headings renamed.
- `note-management`: 4 requirement headings renamed.
- `note-tagging`: 4 requirement headings renamed.
- `note-publication`: 5 requirement headings renamed.
- `platform-administration`: 5 requirement headings renamed.
- `platform-foundation`: 4 requirement headings renamed.
- `web-client`: 5 requirement headings renamed.

## Impact

- **Specs Zone**: eight delta specs now; the same eight files under `openspec/specs/` at sync and
  archive time. No `## Purpose` text and no requirement body changes.
- **Workflow configuration**: `openspec/schemas/intent-driven/templates/spec.md` and the schema's
  `specs` instruction gain the convention.
- **Code Zone**: `acceptance-tests/.gherkin-lintrc` turns `no-files-without-scenarios` off with a
  comment; `glossary/technical.md` gains two entries. **Specs Zone** and **Code Zone** edits stay in
  separate commits.
- **Acceptance Suite**: no scenario changes and no step-definition changes. Verified inert for
  composition: `openspec-effective-paths.cjs` treats only MODIFIED and REMOVED as superseding, and
  RENAMED bullets extract to blank lines, so a RENAMED-only delta supersedes nothing and contributes
  no rules. The extracted `Rule:` names change, which is visible only in reports.
- **No application code**: nothing under `apps/`, `packages/` or `acceptance-tests/step-definitions/`.
- **Archived change**: `openspec/changes/archive/2026-09-04-add-notetaking-platform` keeps the old
  headings. That is correct for a historical record and must not be rewritten.
- **Nothing else cites a requirement heading**: no ADR, no file under `docs/`, no step definition and
  no README refers to one, so the rename is contained to the eight spec files.
- **Follow-ups, deliberately not in scope**: split `web-client`'s register-and-sign-in requirement
  into `Register Account` and `Sign In`; split `web-client`'s admin-area requirement into offering
  the area and gating it; consider splitting `note-management`'s `List Notes` from the
  do-not-probe rule it also carries; consider splitting `platform-administration`'s
  `Administer Notes`, which covers list, read, update and delete in one requirement.
- **Out of scope**: making the Group Term the whole requirement name with the Intent Sentence moved
  into the requirement body. That would make headings stable identity keys immune to rewording, and
  this change is its prerequisite, but it is a separate decision.
