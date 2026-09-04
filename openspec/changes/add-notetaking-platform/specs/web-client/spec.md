# web-client

The browser-observable behaviour of the React single-page application. These scenarios are executed
through a real browser; the API-level rules they rely on are specified by the other capabilities and are
not restated here.

## ADDED Requirements

### Requirement: A visitor browses the Public Feed without signing in
The landing page SHALL show the **Public Feed** to a visitor holding no **Account**, and opening an
entry SHALL show that **Note**'s title, rendered markdown body and **Tags**. Markdown MUST be rendered
without executing author-supplied scripts or embedded HTML, because the body of a published **Note** is
attacker-controlled content served to anonymous visitors.

#### Scenario: The landing page shows published notes

```gherkin
Given Priya owns a published note titled "Rust notes"
When a visitor with no account opens the landing page
Then "Rust notes" is shown in the public feed
```

#### Scenario: A visitor reads a note as rendered markdown

```gherkin
Given Priya owns a published note whose text is "# Ownership\nborrowing is *simple*"
When a visitor opens that note
Then "Ownership" is shown as a heading
And "simple" is shown in italics
```

#### Scenario: Markdown cannot smuggle a script into the page

```gherkin
Given Priya owns a published note whose text contains an embedded script tag
When a visitor opens that note
Then the script does not run
And its markup is not added to the page
```

### Requirement: A visitor registers and signs in from the browser
The application SHALL offer registration and sign-in forms, sign the **Registered User** in on success,
and show a message explaining the refusal on failure without clearing what was typed into the identifier
field. Signing out SHALL return the browser to the anonymous **Public Feed**.

#### Scenario: A visitor registers and lands signed in

```gherkin
Given no account uses the email "priya@example.com"
When Priya completes the registration form with valid details
Then she is signed in
And her note list is shown
```

#### Scenario: Signing in with the wrong password shows an error

```gherkin
Given Priya holds an account
When Priya submits the sign-in form with a wrong password
Then she is shown a sign-in error
And she is not signed in
```

#### Scenario: Signing out returns to the public feed

```gherkin
Given Priya is signed in
When Priya signs out
Then the public feed is shown
And no note list is offered
```

### Requirement: A Registered User works with their own Notes in the browser
The note list SHALL show only the signed-in **Registered User**'s **Notes** with each one's
**Publication State**, and SHALL offer creating, opening and deleting a **Note**.

#### Scenario: The note list shows publication state

```gherkin
Given Priya owns a private note titled "Shopping list" and a published note titled "Rust notes"
When Priya opens her note list
Then "Shopping list" is shown as private
And "Rust notes" is shown as published
```

#### Scenario: A user deletes a note from the list

```gherkin
Given Priya owns a note titled "Shopping list"
When Priya deletes it from her note list
Then "Shopping list" is no longer listed
```

### Requirement: The editor writes markdown, Tags and Publication Requests
Editing a **Note** SHALL offer a markdown editor with a live preview of the rendered result, a way to
enter **Tags** as free text, and a way to submit a **Publication Request**. After submitting, the
application SHALL show that the **Note** is pending, and after a rejection it SHALL show the reason the
**Administrator** gave.

#### Scenario: A user writes markdown and sees it previewed

```gherkin
Given Priya is editing a note
When Priya types "# Ownership" into the editor
Then the preview shows "Ownership" as a heading
```

#### Scenario: A user tags a note from the editor

```gherkin
Given Priya is editing a note
When Priya enters the tags "Rust Lang" and "draft"
And Priya saves the note
Then the note is shown with the tags "rust-lang" and "draft"
```

#### Scenario: A user requests publication and sees the pending state

```gherkin
Given Priya owns a private note titled "Rust notes"
When Priya requests publication from the editor
Then the note is shown as pending publication
```

#### Scenario: A rejected note shows the administrator's reason

```gherkin
Given Hans rejected Priya's note "Rust notes" with the reason "needs a summary"
When Priya opens that note
Then she is shown the rejection reason "needs a summary"
```

### Requirement: The admin area is gated on the admin Role
The application SHALL offer an administration area holding the **Moderation Queue**, an **Account** list
supporting **Ban**, unban and delete, and a browser over every **Note**. It MUST be reachable only by a
**Registered User** holding the admin **Role**; anyone else MUST be refused rather than shown an empty
or broken screen.

#### Scenario: An administrator works the moderation queue

```gherkin
Given Priya's note "Rust notes" is pending publication
When Hans opens the moderation queue and approves "Rust notes"
Then "Rust notes" is shown in the public feed
```

#### Scenario: An administrator bans an account from the user list

```gherkin
Given Priya holds a live account
When Hans bans Priya from the account list
Then Priya is shown as banned in the account list
```

#### Scenario: A regular user is refused the admin area

```gherkin
Given Priya is signed in and holds the user role only
When Priya navigates to the administration area
Then she is refused access
And no administration navigation is offered to her
```
