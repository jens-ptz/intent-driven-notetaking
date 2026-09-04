# platform-administration Specification

## Purpose
What holding the admin **Role** grants: reach across every **Note**, the **Moderation Queue** as a
worklist, and **Ban** / unban / delete over every **Account**.

## Requirements

### Requirement: An Administrator reaches every Note
An **Administrator** SHALL list, read, update and delete any **Note** regardless of its **Owner** or
**Publication State**, excluding soft-deleted ones. An **Administrator**'s update MUST follow the same
rules as an **Owner**'s: supplying **Tags** replaces the whole set, and changing the content of a
published **Note** returns it to pending exactly as `note-publication` requires. Deleting a **Note** as
an **Administrator** MUST apply a **Soft Delete**, exactly as an **Owner**'s delete does.

#### Scenario: An administrator lists notes across owners

```gherkin
Given Priya owns a note titled "Rust notes"
And Marek owns a note titled "Marek's plan"
When Hans lists all notes as an administrator
Then he sees both "Rust notes" and "Marek's plan"
```

#### Scenario: An administrator reads someone else's private note

```gherkin
Given Priya owns a private note titled "Shopping list"
When Hans reads that note as an administrator
Then he sees its title and text
```

#### Scenario: An administrator edits someone else's note

```gherkin
Given Priya owns a note titled "Rust notes"
When Hans changes its title to "Rust notes (reviewed)"
Then Priya's note list shows "Rust notes (reviewed)"
```

#### Scenario: An administrator deletes someone else's note

```gherkin
Given Priya owns a note titled "Rust notes"
When Hans deletes that note as an administrator
Then it is absent from Priya's note list
And reading it reports it does not exist
```

#### Scenario: An administrator's edit of a published note returns it to moderation

```gherkin
Given Priya owns a published note titled "Rust notes"
When Hans changes its title to "Rust notes (reviewed)"
Then the note is pending publication
And "Rust notes (reviewed)" is absent from the public feed
```

#### Scenario: An administrator replaces a note's tags

```gherkin
Given Priya owns a note tagged "draft"
When Hans replaces its tags with "reviewed" as an administrator
Then the note carries only the tag "reviewed"
```

### Requirement: The Moderation Queue lists work awaiting a decision
An **Administrator** SHALL retrieve the **Moderation Queue**, holding exactly those **Notes** whose
**Publication State** is pending, oldest request first. Private, published and soft-deleted **Notes**
MUST be absent from it.

#### Scenario: The queue holds only pending notes

```gherkin
Given Priya's note "Rust notes" is pending publication
And Priya owns a private note titled "Shopping list"
And Marek owns a published note titled "Marek's plan"
When Hans opens the moderation queue
Then it holds "Rust notes"
And it does not hold "Shopping list" or "Marek's plan"
```

#### Scenario: The queue is ordered oldest request first

```gherkin
Given Priya requested publication of "Rust notes" before Marek requested publication of "Marek's plan"
When Hans opens the moderation queue
Then "Rust notes" is listed before "Marek's plan"
```

### Requirement: An Administrator bans and unbans Accounts
An **Administrator** SHALL apply a reversible **Ban** to any other **Account** and SHALL lift it again.
A **Ban** MUST block the banned **Registered User** from signing in and from every authenticated
operation, and MUST hide their published **Notes** from the **Public Feed** without deleting anything.
Lifting the **Ban** MUST restore both. An **Administrator** MUST NOT be able to ban their own
**Account**.

#### Scenario: A banned user loses access

```gherkin
Given Priya holds a live account
When Hans bans Priya's account
Then Priya cannot sign in
```

#### Scenario: Unbanning restores access

```gherkin
Given Priya's account is banned
When Hans unbans Priya's account
Then Priya can sign in with her existing password
```

#### Scenario: An administrator cannot ban themselves

```gherkin
Given Hans is signed in as an administrator
When Hans tries to ban his own account
Then the attempt is refused
And Hans can still sign in
```

### Requirement: An Administrator deletes Accounts
An **Administrator** SHALL delete any other **Account**, with the same cascade as self-deletion: every
**Note** owned by that **Account** is soft-deleted and leaves the **Public Feed**, and the released
email and user name become available again. An **Administrator** MUST NOT be able to delete their own
**Account** through the administration surface; self-deletion remains available under `user-accounts`.

#### Scenario: An administrator deletes a user and their notes

```gherkin
Given Priya owns a published note titled "Rust notes"
When Hans deletes Priya's account as an administrator
Then Priya cannot sign in
And "Rust notes" is absent from the public feed
```

#### Scenario: An administrator cannot delete their own account from the administration surface

```gherkin
Given Hans is signed in as an administrator
When Hans tries to delete his own account as an administrator
Then the attempt is refused
```

### Requirement: Administration is closed to everyone else
Every administration operation SHALL be refused for an unauthenticated visitor and for a signed-in
**Registered User** who does not hold the admin **Role**. A refusal MUST NOT reveal any of the data the
operation would have returned.

#### Scenario: A regular user is refused every administration operation

```gherkin
Given Priya is signed in and holds the user role only
When Priya tries to list all notes as an administrator
And Priya tries to open the moderation queue
And Priya tries to ban Marek's account
Then every attempt is refused as forbidden
```

#### Scenario: A visitor is refused administration operations

```gherkin
Given no one is signed in
When the moderation queue is requested
Then the request is refused as unauthenticated
```
