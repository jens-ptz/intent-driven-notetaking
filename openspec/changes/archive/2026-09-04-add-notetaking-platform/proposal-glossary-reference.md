# Glossary Reference

| Term | Source Glossary | Context |
| --- | --- | --- |
| Account | `glossary/business.md` | The identity record whose lifecycle registration, ban and deletion act on. |
| Registered User | `glossary/business.md` | The actor who owns and manages notes. |
| Administrator | `glossary/business.md` | The actor holding moderation and user-management powers. |
| Note | `glossary/business.md` | The core content record the platform is built around. |
| Owner | `glossary/business.md` | Used to state that ownership is fixed and drives authorization. |
| Tag | `glossary/business.md` | Shared classification records attached to notes. |
| Publication Request | `glossary/business.md` | The owner-initiated step that starts moderation. |
| Publication State | `glossary/business.md` | The private/pending/published lifecycle stored on a note. |
| Public Feed | `glossary/business.md` | What anonymous visitors read. |
| Moderation Queue | `glossary/business.md` | The administrator's pending-review workload. |
| Ban | `glossary/business.md` | The reversible suspension that also hides published notes. |
| Seed Administrator | `glossary/business.md` | The always-present `hans.admin` account. |
| Soft Delete | `glossary/technical.md` | The delete semantics applied to every account and note. |
| Live Row | `glossary/technical.md` | Explains scoped uniqueness and identity reuse after deletion. |
| Access Token Cookie | `glossary/technical.md` | How the SPA authenticates against the API. |
| Auth Guard | `glossary/technical.md` | Where immediate ban and deletion enforcement happens. |
| Role | `glossary/technical.md` | The `USER` / `ADMIN` values driving authorization. |
| Tag Normalization | `glossary/technical.md` | Why differing tag inputs resolve to one tag. |
| Acceptance Suite | `glossary/technical.md` | The executable specification run introduced by this change. |
