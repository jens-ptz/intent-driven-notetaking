# note-tagging Specification

## Purpose

How free-text tag input becomes a shared **Tag**, how **Tags** attach to and detach from **Notes**, and
how note lists are filtered by tag.

## Requirements

### Requirement: Tag input is normalized before lookup

Tag input SHALL be normalized by trimming surrounding whitespace, lowercasing, and collapsing each run
of internal whitespace into a single hyphen. A normalized name MUST consist of 1 to 32 characters drawn
from `a`-`z`, `0`-`9` and `-`; input that normalizes to anything else MUST be refused. Two inputs that
normalize to the same name MUST resolve to one **Tag**.

#### Scenario: Differing inputs resolve to one Tag

```gherkin
Given Priya is signed in
When Priya tags a note with "  Rust Lang "
And Priya tags another note with "RUST-LANG"
Then both notes carry the tag "rust-lang"
And the platform holds a single tag named "rust-lang"
```

#### Scenario: A tag with unsupported characters is refused

```gherkin
Given Priya is signed in
When Priya tries to tag a note with "rust/lang!"
Then the note is refused because the tag is invalid
```

#### Scenario: An over-long tag is refused

```gherkin
Given Priya is signed in
When Priya tries to tag a note with a name of 33 characters
Then the note is refused because the tag is invalid
```

### Requirement: Tags are created on demand and shared between Notes

Writing a **Note** SHALL attach the **Tag** matching each normalized name, creating the **Tag** when no
such name exists yet. A **Note** MUST carry 0..n **Tags** and a **Tag** MUST be attachable to 0..n
**Notes**. Attaching an existing name MUST reuse the existing **Tag** rather than create a duplicate.

#### Scenario: A note may carry no tags at all

```gherkin
Given Priya is signed in
When Priya creates a note with no tags
Then the note carries no tags
```

#### Scenario: Two owners share one tag

```gherkin
Given Priya owns a note tagged "rust-lang"
When Marek creates a note tagged "rust-lang"
Then both notes reference the same tag
```

### Requirement: Updating a Note replaces its whole Tag set

Supplying tags when updating a **Note** SHALL replace that **Note**'s **Tags** with exactly the supplied
set. **Tags** left attached to no **Note** MUST be retained rather than removed, and MUST be reusable by
a later **Note** without changing identity.

#### Scenario: An update replaces rather than adds tags

```gherkin
Given Priya owns a note tagged "rust-lang" and "draft"
When Priya updates the note with the single tag "rust-lang"
Then the note carries only the tag "rust-lang"
```

#### Scenario: A tag left on no notes is retained

```gherkin
Given "draft" is the only tag on Priya's note
When Priya removes "draft" from that note
And Marek creates a note tagged "draft"
Then Marek's note references the same tag that Priya used
```

### Requirement: Note lists can be filtered by Tag

Both a **Registered User**'s own note list and the **Public Feed** SHALL accept a tag filter and return
only the **Notes** carrying that **Tag**. Filtering by a tag name that no **Tag** matches MUST return an
empty result rather than an error.

#### Scenario: A user filters their own notes by tag

```gherkin
Given Priya owns a note tagged "rust-lang" and a note tagged "cooking"
When Priya lists her notes filtered by the tag "rust-lang"
Then she sees only the note tagged "rust-lang"
```

#### Scenario: The Public Feed is filtered by tag

```gherkin
Given a published note tagged "rust-lang" and a published note tagged "cooking"
When a visitor browses the public feed filtered by the tag "rust-lang"
Then only the note tagged "rust-lang" is listed
```

#### Scenario: Filtering by an unknown tag returns nothing

```gherkin
Given Priya owns a note tagged "rust-lang"
When Priya lists her notes filtered by the tag "gardening"
Then she sees no notes
```
