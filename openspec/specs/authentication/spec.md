# authentication Specification

## Purpose

Signing in with either identifier, the **Access Token Cookie** that carries the session, and immediate
rejection of banned or deleted **Accounts**.

## Requirements

### Requirement: Sign-in accepts either email or user name

The platform SHALL accept a single identifier at sign-in and resolve it against both the email and the
user name of **Live Rows**. Sign-in MUST be refused for an unknown identifier, a wrong password, a
deleted **Account** and a banned **Account**. The refusal for an unknown identifier and the refusal for
a wrong password MUST be indistinguishable, so that sign-in cannot be used to discover which accounts
exist.

#### Scenario: Signing in with an email address

```gherkin
Given Priya holds an account with the email "priya@example.com" and the user name "priya"
When Priya signs in with the identifier "priya@example.com" and her password
Then she is signed in
```

#### Scenario: Signing in with a user name

```gherkin
Given Priya holds an account with the email "priya@example.com" and the user name "priya"
When Priya signs in with the identifier "priya" and her password
Then she is signed in
```

#### Scenario: A wrong password and an unknown identifier are refused alike

```gherkin
Given Priya holds an account with the user name "priya"
When Priya signs in as "priya" with a wrong password
And someone signs in as "nobody" with any password
Then both attempts are refused with the same message
```

#### Scenario: A banned account cannot sign in

```gherkin
Given Priya's account is banned
When Priya signs in with her correct password
Then sign-in is refused because the account is banned
```

#### Scenario: A deleted account cannot sign in

```gherkin
Given Priya has deleted her account
When Priya signs in with her former password
Then sign-in is refused
```

### Requirement: A session is carried by the Access Token Cookie

On successful sign-in the platform SHALL issue an **Access Token Cookie** that the browser returns
automatically on subsequent requests. The cookie MUST NOT be readable by page scripts. Requests to
protected operations without a valid cookie MUST be refused as unauthenticated. Signing out MUST clear
the cookie so the same browser can no longer act as that **Registered User**.

#### Scenario: A signed-in user reaches a protected operation

```gherkin
Given Priya has signed in
When Priya lists her notes
Then the notes are returned
```

#### Scenario: An unauthenticated request is refused

```gherkin
Given no one is signed in
When the note list is requested
Then the request is refused as unauthenticated
```

#### Scenario: Signing out ends the session

```gherkin
Given Priya has signed in
When Priya signs out
And Priya lists her notes
Then the request is refused as unauthenticated
```

### Requirement: Bans and deletions take effect on the next request

The **Auth Guard** SHALL re-check the **Account** behind the **Access Token Cookie** on every
authenticated request. A **Registered User** who is banned or deleted while holding a valid cookie MUST
be refused on their very next request, without waiting for the cookie to expire.

#### Scenario: A user banned mid-session is refused immediately

```gherkin
Given Priya is signed in with a valid session
When Hans bans Priya's account
And Priya lists her notes
Then the request is refused because the account is banned
```

#### Scenario: A user deleted mid-session is refused immediately

```gherkin
Given Priya is signed in with a valid session
When Hans deletes Priya's account
And Priya lists her notes
Then the request is refused as unauthenticated
```
