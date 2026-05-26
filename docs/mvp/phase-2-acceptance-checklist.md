# Phase 2 Acceptance Checklist

## Completed In Code

- [x] Backend build passes.
- [x] Prisma schema validates with a temporary validation-only `DATABASE_URL`.
- [x] Phase 2 runtime modules are enabled.
- [x] Settings API paths are available.
- [x] Currency API paths are available.
- [x] Base/default currency updates are transactional.
- [x] S3/R2 storage provider uses AWS SDK, not console mock success.
- [x] Product image API paths are available.
- [x] Draft sales invoices do not change inventory.
- [x] Confirmed sales invoices deduct inventory in the same transaction.
- [x] Sale cancellation restores stock for confirmed invoices.
- [x] Notifications use Prisma and expose read/preferences/send APIs.
- [x] Sync exposes register, initial data, pull, push, status, and batch APIs.
- [x] Sync push uses idempotency for offline sale batches.
- [x] Backup history/manual APIs are available.

## Deferred Until External Database Is Connected

- [ ] Run migrations against the external PostgreSQL database.
- [ ] Run seed against the external PostgreSQL database.
- [ ] Execute full Postman/Swagger end-to-end scenario.
- [ ] Verify accounting postings with real seeded GL accounts.
- [ ] Verify reporting values against real operational data.
