# note-management

What an **Owner** may do with their own **Notes**, and the ownership boundary that separates one
**Registered User**'s notes from another's.

## ADDED Requirements

### Requirement: A Registered User creates Notes
A signed-in **Registered User** SHALL create a **Note** with a title and body text. The creating
**Registered User** MUST become its **Owner**, and ownership MUST NOT be transferable afterwards. A new
**Note** MUST start in the private **Publication State**. Creation MUST be refused when the title is
empty or longer than 200 characters.

#### Scenario: A user creates a note

```gherkin
Given Priya is signed in
When Priya creates a note titled "Rust notes" with the text "ownership and borrowing"
Then the note appears in her note list
And the note is private
And Priya is its owner
```

#### Scenario: Creation is refused without a title

```gherkin
Given Priya is signed in
When Priya tries to create a note with an empty title
Then creation is refused because the title is required
```

### Requirement: A Registered User lists and reads only their own Notes
Listing **Notes** SHALL return only the **Notes** owned by the requesting **Registered User**, excluding
soft-deleted ones. Reading a **Note** owned by someone else MUST be refused as if the **Note** did not
exist, so that note identifiers cannot be probed to learn what other people have written.

#### Scenario: The note list holds only the requester's notes

```gherkin
Given Priya owns a note titled "Rust notes"
And Marek owns a note titled "Marek's plan"
When Priya lists her notes
Then she sees "Rust notes"
And she does not see "Marek's plan"
```

#### Scenario: Reading someone else's note reports it does not exist

```gherkin
Given Marek owns a private note titled "Marek's plan"
When Priya tries to read that note
Then she is told the note does not exist
```

### Requirement: An Owner updates their own Note
An **Owner** SHALL change the title, body text and **Tags** of a **Note** they own. An update by anyone
other than the **Owner** MUST be refused; an update by an **Administrator** is governed by
`platform-administration`.

#### Scenario: An owner edits their note

```gherkin
Given Priya owns a note titled "Rust notes"
When Priya changes its text to "lifetimes and borrowing"
Then reading the note shows the text "lifetimes and borrowing"
```

#### Scenario: A non-owner cannot edit a note

```gherkin
Given Marek owns a note titled "Marek's plan"
When Priya tries to change that note's text
Then the change is refused
And reading it as Marek shows the original text
```

### Requirement: An Owner deletes their own Note
An **Owner** SHALL delete a **Note** they own, which MUST apply a **Soft Delete**. A deleted **Note**
MUST disappear from the **Owner**'s list, MUST be unreadable, and if it was published MUST leave the
**Public Feed**. Deletion by anyone other than the **Owner** or an **Administrator** MUST be refused.

#### Scenario: An owner deletes their note

```gherkin
Given Priya owns a note titled "Rust notes"
When Priya deletes it
Then it is absent from her note list
And reading it reports it does not exist
```

#### Scenario: Deleting a published note removes it from the Public Feed

```gherkin
Given Priya owns a published note titled "Rust notes"
When Priya deletes it
Then "Rust notes" is absent from the public feed
```

#### Scenario: A non-owner cannot delete a note

```gherkin
Given Marek owns a note titled "Marek's plan"
When Priya tries to delete that note
Then the deletion is refused
And the note is still in Marek's note list
```
