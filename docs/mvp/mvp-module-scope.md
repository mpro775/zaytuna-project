# Zaytuna MVP Module Scope

## Included In Phase 1

- Config, Prisma, optional Redis/cache fallback.
- Auth login, refresh, logout, and current-user flow.
- RBAC permission checks with wildcard support.
- Users, roles, permissions.
- Branches and warehouses.
- Categories, products, product variants, and inventory foundation.
- Customers.
- Accounting schema readiness and seeded base chart of accounts.
- Settings foundation API backed by `AppSetting` and `Company`.
- Currency and exchange-rate foundation API.
- Storage metadata shell backed by `File`.
- Notification shell backed by PostgreSQL/Prisma.
- Sync device/status shell backed by PostgreSQL/Prisma.
- Audit module remains loaded.

## Limited In Phase 1

- Storage implements local metadata and upload shell only. R2/S3 variables are documented but provider execution is Phase 2.
- Notifications expose read/read-all shell only. Provider delivery is Phase 2.
- Sync exposes device registration and status only. Offline push/pull and conflict handling are Phase 2.
- Accounting includes schema and seed readiness only. Automatic posting is Phase 2.

## Out Of Scope

- Full POS sale confirmation workflow.
- Purchase approval and receiving workflow.
- Return confirmation and credit-note workflow.
- Payment gateway integrations.
- WhatsApp/SMS/email provider delivery.
- File image processing pipeline.
- Offline conflict resolution.
- Backup execution.
- Frontend integration.

## Phase 2 Business Modules

- Sales/POS confirmed-sale workflow.
- Inventory transaction helpers.
- Purchase invoice approval.
- Returns and credit notes.
- Accounting auto-posting.
- Notification triggers.
- Offline sync push/pull.
- Backup execution.
- Operational reports.

## Frontend Notes

The frontend should consume the standard response/error shapes in `phase-1-api-contract.md`, use bearer tokens from `/auth/login`, and treat all IDs as strings. Do not assume UUID v4. Currency values must use transaction snapshot fields, not live exchange rates.
