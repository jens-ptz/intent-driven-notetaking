# 0005 Model publication as a moderated state machine that re-moderates edited notes

Status: accepted
Date: 2026-09-04

## Context and Problem Statement

Notes are private by default and can become publicly readable by anonymous visitors. The product
requires that an owner asks for publication and an administrator grants it, so publication is a
decision made by someone other than the author. A moderation decision applies to a specific piece of
content, but the author can keep editing after approval — so the platform has to say what an edit does
to a decision that has already been made.

## Considered Options

- An enum `publicationState` of `PRIVATE | PENDING | PUBLISHED` on the note, where editing the content
  of a published note returns it to `PENDING`.
- The same enum, but where editing a published note leaves it published.
- A boolean `isPublic` toggled by the owner, with administrators unpublishing after the fact.
- A separate `publication_requests` table recording every request and decision as history.

## Decision Outcome

Chosen option: "an enum state machine in which editing a published note returns it to `PENDING`",
because otherwise moderation is trivially bypassed: an author publishes acceptable text, waits for
approval, then replaces the body, and unreviewed content is served to anonymous visitors under an
approval that was never given for it. Leaving an edited note published was rejected for exactly that
reason. A boolean cannot express "waiting for a decision" at all. The separate history table was
rejected because no requirement reads that history, and it can be added later without changing the
states.

### Consequences

- Good, because what is publicly visible is always content an administrator approved in that exact form.
- Good, because the pending state gives the moderation queue a definition that needs no extra table.
- Bad, because editing a typo in a published note takes it offline until someone approves it again,
  which will annoy authors; the editor warns before saving a published note.
- Bad, because only the most recent rejection reason is retained, so an author cannot see why an earlier
  version was refused.
- Bad, because publication throughput now depends on administrator availability, which is an
  operational commitment the platform did not previously have.
