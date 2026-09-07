# platform-foundation Specification

## Purpose

The invariants every other capability depends on: the always-present **Seed Administrator**,
**Soft Delete** as the only removal semantic, and autoincrement integer identifiers.

## Requirements

### Requirement: Seed Administrator always exists

The platform SHALL guarantee that an **Administrator** **Account** with user name `hans.admin` and
password `p@assw0rt` is present in every initialized environment. Initialization MUST be idempotent:
running it against a database that already holds the **Seed Administrator** MUST NOT create a second
**Account** and MUST NOT alter the existing one.

#### Scenario: Seed Administrator is present after a fresh initialization

```gherkin
Given an empty platform database
When the platform is initialized
Then an administrator account named "hans.admin" exists
And that account holds the admin role
```

#### Scenario: Re-initializing does not duplicate the Seed Administrator

```gherkin
Given an initialized platform holding the seed administrator
When the platform is initialized again
Then exactly one account named "hans.admin" exists
```

#### Scenario: Seed Administrator signs in with the documented credentials

```gherkin
Given an initialized platform
When Hans signs in as "hans.admin" with the password "p@assw0rt"
Then he is signed in as an administrator
```

### Requirement: Removal is always a Soft Delete

Every delete of an **Account** or a **Note** SHALL be recorded as a **Soft Delete**. Soft-deleted
records MUST be absent from every read path, including owner listings, administrator listings and the
**Public Feed**. The platform MUST NOT expose an operation that permanently removes an **Account** or a
**Note**.

#### Scenario: A deleted note is gone from every listing

```gherkin
Given Priya owns a note titled "Draft"
When Priya deletes that note
Then the note is absent from her note list
And reading that note reports it does not exist
```

#### Scenario: An administrator does not see soft-deleted notes either

```gherkin
Given Priya has deleted her note titled "Draft"
When Hans lists all notes as an administrator
Then the note titled "Draft" is absent from the results
```

### Requirement: Records carry autoincrement integer identifiers

Every **Account**, **Note** and **Tag** SHALL be identified by an integer assigned by the database in
increasing order. Identifiers MUST NOT be reused after a **Soft Delete**.

#### Scenario: Successively created notes receive increasing identifiers

```gherkin
Given Priya is signed in
When Priya creates a note titled "First"
And Priya creates a note titled "Second"
Then the identifier of "Second" is greater than the identifier of "First"
```

### Requirement: The API reports its readiness

The API SHALL expose an unauthenticated health check reporting whether the database is reachable, so
the **Acceptance Suite** can wait for a usable platform before running scenarios.

#### Scenario: Health check reports a reachable database

```gherkin
Given the API is running against an initialized database
When the health of the platform is checked
Then the platform reports itself healthy
```

#### Scenario: Health check reports an unreachable database

```gherkin
Given the API is running and the database is unreachable
When the health of the platform is checked
Then the platform reports itself unhealthy
```
