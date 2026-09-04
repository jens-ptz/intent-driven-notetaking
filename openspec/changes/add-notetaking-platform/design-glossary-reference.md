# Glossary Reference

| Term | Source Glossary | Context |
| --- | --- | --- |
| Account | `glossary/business.md` | Reloaded per request by the guard; subject to ban and soft delete. |
| Registered User | `glossary/business.md` | The signed-in actor the SPA is built for. |
| Administrator | `glossary/business.md` | The single exception to owner-only authorization. |
| Note | `glossary/business.md` | The record whose publication state machine is designed here. |
| Owner | `glossary/business.md` | The default authorization subject. |
| Tag | `glossary/business.md` | Shared reference data, never soft-deleted. |
| Publication Request | `glossary/business.md` | The transition that starts moderation. |
| Public Feed | `glossary/business.md` | The only anonymous read path, and the reason for sanitized rendering. |
| Moderation Queue | `glossary/business.md` | The administrator worklist backed by the pending state. |
| Ban | `glossary/business.md` | Enforced by the per-request lookup and the feed's owner filter. |
| Seed Administrator | `glossary/business.md` | The idempotent seed, and the change's sharpest security risk. |
| Soft Delete | `glossary/technical.md` | Implemented by explicit repository filters. |
| Live Row | `glossary/technical.md` | The scope of the partial unique indexes. |
| Access Token Cookie | `glossary/technical.md` | The httpOnly session credential chosen in D2. |
| Auth Guard | `glossary/technical.md` | Where immediate ban enforcement lives. |
| Role | `glossary/technical.md` | Gates the `/admin` route prefix. |
| Tag Normalization | `glossary/technical.md` | The single entry point before upsert. |
| Acceptance Suite | `glossary/technical.md` | One cucumber-js project covering API and browser scenarios. |
