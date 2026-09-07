# note-publication Specification

## Purpose

How a private **Note** reaches the **Public Feed**: the **Owner**'s **Publication Request**, the
**Administrator**'s decision, and the visibility rules the feed enforces on every read.

## Requirements

### Requirement: An Owner requests publication

An **Owner** SHALL request publication of a **Note** they own, moving its **Publication State** from
private to pending. A pending **Note** MUST NOT appear on the **Public Feed**. Requesting publication of
a **Note** owned by someone else MUST be refused, and requesting publication of a **Note** that is
already pending or published MUST be refused as redundant rather than silently accepted.

#### Scenario: An owner submits a private note for publication

```gherkin
Given Priya owns a private note titled "Rust notes"
When Priya requests publication of that note
Then the note is pending publication
```

#### Scenario: A pending note is not on the Public Feed

```gherkin
Given Priya's note "Rust notes" is pending publication
When a visitor browses the public feed
Then "Rust notes" is not listed
```

#### Scenario: A non-owner cannot request publication

```gherkin
Given Marek owns a private note titled "Marek's plan"
When Priya tries to request publication of that note
Then the request is refused
And the note is still private
```

#### Scenario: Requesting publication twice is refused

```gherkin
Given Priya's note "Rust notes" is pending publication
When Priya requests publication of that note again
Then the request is refused as redundant
```

### Requirement: An Administrator approves or rejects a Publication Request

An **Administrator** SHALL approve or reject any pending **Note**. Approval MUST move the **Note** to
published and MUST make it visible on the **Public Feed**. Rejection MUST return the **Note** to private,
MUST record the reason supplied by the **Administrator**, and the **Owner** MUST be able to read that
reason. A **Registered User** without the admin **Role** MUST NOT be able to approve or reject anything.

#### Scenario: An administrator approves a pending note

```gherkin
Given Priya's note "Rust notes" is pending publication
When Hans approves that note
Then the note is published
And "Rust notes" is listed on the public feed
```

#### Scenario: An administrator rejects a pending note with a reason

```gherkin
Given Priya's note "Rust notes" is pending publication
When Hans rejects that note with the reason "needs a summary"
Then the note is private again
And Priya can read the rejection reason "needs a summary"
```

#### Scenario: A regular user cannot approve a note

```gherkin
Given Priya's note "Rust notes" is pending publication
When Marek tries to approve that note
Then the attempt is refused
And the note is still pending publication
```

### Requirement: Editing a published Note returns it to moderation

Changing the title, body text or **Tags** of a published **Note** SHALL return it to the pending
**Publication State** and remove it from the **Public Feed** until an **Administrator** approves it
again. Without this rule an **Owner** could publish acceptable content and then replace it, so the
moderation decision MUST apply to the content that is actually public.

#### Scenario: An owner edits a published note

```gherkin
Given Priya owns a published note titled "Rust notes"
When Priya changes its text to "a different article entirely"
Then the note is pending publication
And "Rust notes" is absent from the public feed
```

#### Scenario: The re-approved note returns to the Public Feed

```gherkin
Given Priya's published note "Rust notes" went back to pending after she edited it
When Hans approves that note
Then "Rust notes" is listed on the public feed again
```

### Requirement: A published Note can be withdrawn

An **Owner** SHALL withdraw their own published **Note**, and an **Administrator** SHALL withdraw any
published **Note**. Withdrawal MUST return the **Publication State** to private and MUST remove the
**Note** from the **Public Feed** without deleting it.

#### Scenario: An owner withdraws their published note

```gherkin
Given Priya owns a published note titled "Rust notes"
When Priya withdraws it from publication
Then the note is private
And it is still in Priya's note list
And "Rust notes" is absent from the public feed
```

#### Scenario: An administrator withdraws someone else's published note

```gherkin
Given Priya owns a published note titled "Rust notes"
When Hans withdraws that note from publication
Then "Rust notes" is absent from the public feed
And the note is still in Priya's note list
```

### Requirement: The Public Feed is readable without an Account

The **Public Feed** and each published **Note** on it SHALL be readable by a visitor holding no
**Account** and no session. The feed MUST list exactly those **Notes** that are published, not
soft-deleted, and whose **Owner** is neither banned nor deleted.

#### Scenario: A visitor with no account browses the feed

```gherkin
Given Priya owns a published note titled "Rust notes"
When a visitor with no account browses the public feed
Then "Rust notes" is listed
```

#### Scenario: A visitor reads a published note

```gherkin
Given Priya owns a published note titled "Rust notes"
When a visitor with no account opens "Rust notes"
Then the visitor sees its title, text and tags
```

#### Scenario: Private notes are never on the feed

```gherkin
Given Priya owns a private note titled "Shopping list"
When a visitor browses the public feed
Then "Shopping list" is not listed
```

#### Scenario: A banned owner's published notes leave the feed

```gherkin
Given Priya owns a published note titled "Rust notes"
When Hans bans Priya's account
Then "Rust notes" is absent from the public feed
```

#### Scenario: Unbanning restores the owner's published notes

```gherkin
Given Priya is banned and owns a published note titled "Rust notes"
When Hans unbans Priya's account
Then "Rust notes" is listed on the public feed again
```

#### Scenario: A visitor cannot read a note that is not published

```gherkin
Given Priya owns a private note titled "Shopping list"
When a visitor with no account tries to open "Shopping list"
Then the visitor is told the note does not exist
```
