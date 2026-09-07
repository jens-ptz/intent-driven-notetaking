# user-accounts Specification

## Purpose

Self-service registration, the **Account** holder's own profile, and self-deletion with its cascade and
identity release.

## Requirements

### Requirement: Visitors register their own Account

A visitor SHALL create an **Account** by supplying first name, last name, email, user name and password.
Registration MUST be refused when the email or the user name is already held by a **Live Row**, when the
email is malformed, or when the password is shorter than 8 characters. A newly registered **Account**
MUST hold the user **Role** only; a registration request MUST NOT be able to grant itself the admin
**Role**.

#### Scenario: A visitor registers with valid details

```gherkin
Given no account uses the email "priya@example.com"
When Priya registers as "priya" with the email "priya@example.com"
Then her account exists
And she holds the user role only
```

#### Scenario: Registration is refused when the email is already held

```gherkin
Given a live account uses the email "priya@example.com"
When Marek tries to register with the email "priya@example.com"
Then registration is refused because the email is taken
```

#### Scenario: Registration is refused when the user name is already held

```gherkin
Given a live account uses the user name "priya"
When Marek tries to register as "priya"
Then registration is refused because the user name is taken
```

#### Scenario: Registration is refused for invalid details

```gherkin
Given no account uses the email "not-an-email"
When Priya tries to register with the email "not-an-email" and the password "short"
Then registration is refused because the details are invalid
And no account is created for her
```

#### Scenario: A registration request cannot grant itself the admin role

```gherkin
Given no account uses the email "sneaky@example.com"
When Marek registers with the email "sneaky@example.com" and asks for the admin role
Then his account holds the user role only
```

### Requirement: Account holders manage their own profile

A signed-in **Registered User** SHALL read their own profile and update their first name, last name and
user name. A profile MUST NOT expose the stored password in any form. A **Registered User** MUST NOT be
able to change their own **Role** set.

#### Scenario: A user reads their own profile

```gherkin
Given Priya is signed in
When Priya views her profile
Then she sees her first name, last name, email and user name
And no password material is shown
```

#### Scenario: A user updates their own name

```gherkin
Given Priya is signed in
When Priya changes her last name to "Sharma"
Then her profile shows the last name "Sharma"
```

#### Scenario: A user cannot grant themselves the admin role

```gherkin
Given Priya is signed in and holds the user role only
When Priya tries to give herself the admin role
Then the change is refused
And she still holds the user role only
```

### Requirement: Self-deletion cascades to the holder's Notes

A signed-in **Registered User** SHALL delete their own **Account**. Deleting an **Account** MUST apply a
**Soft Delete** to every **Note** that **Account** owns, including published ones, which MUST therefore
leave the **Public Feed** immediately. The deleted holder MUST NOT be able to sign in afterwards.

#### Scenario: A user deletes their own account

```gherkin
Given Priya is signed in
When Priya deletes her account
Then she can no longer sign in with her former credentials
```

#### Scenario: Deleting an account removes its published notes from the Public Feed

```gherkin
Given Priya owns a published note titled "Rust notes"
When Priya deletes her account
Then "Rust notes" is absent from the public feed
```

### Requirement: A deleted identity is released for reuse

Email and user name uniqueness SHALL apply only among **Live Rows**. After an **Account** is
soft-deleted, its email and user name MUST become available for a new registration, and the new
**Account** MUST NOT inherit any **Note** of the deleted one.

#### Scenario: The released email can be registered again

```gherkin
Given Priya has deleted her account which used the email "priya@example.com"
When Marek registers with the email "priya@example.com"
Then his account is created
And his note list is empty
```
