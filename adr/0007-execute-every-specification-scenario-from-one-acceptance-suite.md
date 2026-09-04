# 0007 Execute every specification scenario from one acceptance suite

Status: accepted
Date: 2026-09-04

## Context and Problem Statement

The project treats OpenSpec `spec.md` files as the executable source of truth: the Gherkin inside them
is extracted and run, and the suite must have no undefined or pending steps. Some capabilities are
API-level and some describe browser behaviour, and the extracted Gherkin makes no distinction between
them. The verification architecture must therefore cover both without splitting the source of truth.

## Considered Options

- One cucumber-js project under `acceptance-tests/` where API scenarios use an HTTP client and
  browser scenarios use Playwright-backed page objects behind the same intent-level steps.
- A cucumber-js project for API scenarios plus a separate Playwright project with its own test files
  for the UI.
- No browser-facing specification at all; describe only the API in specs and cover the UI with
  component tests.

## Decision Outcome

Chosen option: "one cucumber-js project covering both", because it is the only option under which every
extracted scenario has a step definition and the suite can be honestly green. The separate Playwright
project was rejected because the browser capability's scenarios would still be extracted into the
cucumber suite with nothing to run them, leaving permanently undefined steps. Dropping the browser
specification was rejected because it removes the behaviour contract from the part of the system users
actually touch.

Scenario selection uses cucumber profiles with explicit paths rather than tags, because the fenced
Gherkin in a `spec.md` holds only Given/When/Then steps and offers no place to write a tag.

### Consequences

- Good, because one command runs every scenario in the repository and produces one HTML report.
- Good, because no scenario in any `spec.md` can be quietly left unexecuted.
- Bad, because the suite carries a browser dependency, so it is slower and more failure-prone than an
  HTTP-only suite, and it needs browsers installed in any environment that runs it.
- Bad, because selecting subsets depends on the extracted directory layout, so renaming a capability
  changes the profile paths.
- Bad, because a single suite means a browser problem can block feedback on purely API-level work.
