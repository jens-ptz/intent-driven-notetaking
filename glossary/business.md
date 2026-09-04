# Business Glossary

| Term | Definition | Use When | Avoid |
| --- | --- | --- | --- |
| Account | The record identifying one person on the platform, holding their names, email, user name, roles and lifecycle state. | Referring to the identity and its lifecycle (registration, ban, deletion). | "profile", "login" |
| Registered User | A person who holds an Account and can authenticate. | Describing the actor who owns and manages Notes. | "member", "customer" |
| Administrator | A Registered User whose roles include the admin role, granting moderation and user-management powers over every Account and Note. | Describing privileged actions across all data. | "superuser", "moderator", "staff" |
| Note | A markdown document owned by exactly one Registered User, made of a title, body text and zero or more Tags. | Referring to the core content record. | "document", "post", "article" |
| Owner | The single Registered User a Note belongs to; ownership is fixed at creation and never transfers. | Expressing authorization rules on a Note. | "author", "creator" |
| Tag | A shared, normalized lowercase label that classifies zero or more Notes. | Referring to the classification record shared across Notes. | "label", "keyword", "category" |
| Publication Request | An Owner's request to make one of their Notes visible on the Public Feed, pending an Administrator decision. | Describing the act of asking for publication. | "publish", "share" |
| Publication State | A Note's position in the public-visibility lifecycle: private, pending or published. | Describing or querying a Note's visibility status. | "status", "isPublic" |
| Public Feed | The anonymously readable list of published Notes whose Owner is neither banned nor deleted. | Referring to what unauthenticated visitors can read. | "home page", "timeline" |
| Moderation Queue | The Administrator view listing every Note whose Publication State is pending. | Referring to the Administrator's review workload. | "inbox", "approvals" |
| Ban | A reversible Administrator action that blocks an Account from all authenticated access and hides its published Notes from the Public Feed. | Describing account suspension and its visibility effect. | "block", "suspend", "disable" |
| Seed Administrator | The always-present `hans.admin` Account inserted idempotently at database initialization. | Referring to the bootstrap Administrator that must exist in every environment. | "default user", "root" |
