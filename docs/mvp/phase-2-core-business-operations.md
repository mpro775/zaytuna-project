# Phase 2 Core Business Operations

## Scope Implemented

- Enabled Phase 2 backend modules in the Nest runtime: sales, purchasing, returns, reporting, backup, and payment.
- Settings supports company, system, security, backup, validation, reset, system info, cache clear, company logo, and backup aliases.
- Currency supports currencies, base/default selection in one transaction, exchange rates, latest rate lookup, and conversion using `fromCurrencyId` / `toCurrencyId`.
- Storage supports local and S3/R2-compatible providers with real AWS SDK calls for S3/R2, file metadata, file URLs, deletion, and product image attachment.
- Sales now keeps draft invoices non-mutating. Stock is deducted only when the invoice is confirmed, inside the same database transaction.
- Sale cancellation restores stock only for previously confirmed invoices.
- Notifications use Prisma models only. The legacy Mongoose schema file was removed.
- Sync supports device registration, initial data, pull, push, batch lookup, and idempotency for offline POS sale pushes.
- Backup exposes `/backup/history`, `/backup/manual`, `/settings/backup/history`, and `/settings/backup/manual`.

## Verification

- `npm run build` passed.
- `npx prisma validate` passed with a temporary local `DATABASE_URL` value for schema validation only.
- Database migration, reset, seed, and live DB scenario execution were intentionally skipped because the external database will be connected manually later.
- `npm run lint` was attempted. The project currently has many pre-existing strict lint errors across shared modules, guards, interceptors, and older services. The command also ran with `--fix`, which formatted many files.

## Notes For External Database Connection

After the external PostgreSQL database is connected, run:

```bash
npm install
npx prisma validate
npx prisma generate
npm run build
```

Then run migrations and seed manually against the external database when ready.
