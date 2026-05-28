# Zaytun Soft MVP Phase 1 Completion Report

Date: 2026-05-26

## Completed

- Installed backend dependencies with `npm install`.
- Fixed the broken Prisma schema around `StockItem`/`StockMovement`.
- Added schema foundation for `AppSetting`, `ExchangeRate`, `SyncDevice`, and `SyncOperation`.
- Expanded `Currency` with `decimalPlaces`, `isDefault`, and exchange-rate relations.
- Added financial snapshot fields for sales invoices, purchase invoices, and payments.
- Added storage `File.key` metadata field.
- Loaded `security.config.ts` in `AppModule`.
- Made Redis/cache optional for local development through an in-memory fallback when `CACHE_ENABLED=false` or `REDIS_ENABLED=false`.
- Fixed auth login controller flow to issue tokens from the validated local-strategy user.
- Removed the strict cache-session check from JWT validation so optional cache does not break auth.
- Fixed RBAC wildcard matching for `*`, `*.*`, and namespace wildcards such as `products.*`.
- Added `CurrentUser`, `IsEntityId`, compatibility permission decorator/guard exports, and `SharedModule`.
- Replaced internal `@IsUUID('4')` DTO validation with string entity ID validation.
- Added Phase 1 Settings API shell.
- Added Phase 1 Currency and Exchange Rate APIs.
- Replaced Mongoose-based Notification runtime with a Prisma-backed shell.
- Replaced advanced Sync runtime with a Prisma-backed device/status shell.
- Replaced advanced Storage runtime with a minimal local-upload metadata shell.
- Scoped `AppModule` and `tsconfig.build.json` to stable Phase 1 modules. Advanced modules are deferred and documented for Phase 2.
- Rebuilt the seed file for required MVP foundation data.
- Generated a migration SQL file without connecting to a database:
  `backend/prisma/migrations/20260526000000_init_mvp_core/migration.sql`.

## Migration

Migration name:

```txt
20260526000000_init_mvp_core
```

Local migration execution was intentionally not completed because PostgreSQL is not installed locally. Apply on the server after setting `DATABASE_URL`:

```bash
cd backend
npm install
npx prisma validate
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

For a fresh development database, this can also be run on the server:

```bash
npx prisma migrate dev --name init_mvp_core
```

If an existing development database blocks migration:

```bash
npx prisma migrate reset
```

## Seeded Data

- Company: `company_main`
- Branch: `branch_main`
- Warehouse: `warehouse_main`
- Roles: `role_admin`, `role_manager`, `role_cashier`
- Admin user:
  - username: `admin`
  - email: `admin@zaytunsoft.local`
  - password: `Admin@123456`
- Currencies: `currency_yer`, `currency_usd`, `currency_sar`
- Sample exchange rates are manual seed samples, not live market rates.
- Category: `category_phones`
- Product: `product_sample_phone`
- Variant: `variant_sample_phone_black_128`
- Stock item in `warehouse_main`
- Base chart of accounts for assets, liabilities, equity, revenue, and expenses.

## Verification Results

Passed:

```bash
npm install
npm run build
npx prisma format
npx prisma validate
npx prisma generate
npm test -- --runInBand
```

Not run locally by request / environment:

```bash
npx prisma migrate dev --name init_mvp_core
npx prisma db seed
npm run start:dev
```

Reason: PostgreSQL is not installed locally. These should be run against the server PostgreSQL database after `DATABASE_URL` is configured.

Attempted:

```bash
npm run lint
```

Result: timed out after 120 seconds. The lint script still scans all `src/**/*.ts`, including Phase 2 deferred modules. Recommended follow-up: scope lint to MVP-loaded modules or split lint scripts by phase.

## Known Issues And Risks

- `package.json#prisma` seed configuration emits a Prisma 7 deprecation warning because this project uses `prisma.config.ts`. The `db:seed` script is available and `npx prisma db seed` should be verified on the server Prisma version.
- Advanced modules remain in source but are excluded from Phase 1 build/runtime: sales workflows, purchasing workflows, returns, payment gateways, monitoring, backup, reporting, security dashboard, performance tooling, advanced storage providers, and advanced sync gateway.
- `dist/` is tracked in this repository and was updated by `npm run build`.
- API smoke tests requiring HTTP and DB were not run locally because PostgreSQL is unavailable.

## Recommended Next Step

Provision PostgreSQL on the server, set `DATABASE_URL`, run migration deploy and seed, then perform the auth and foundation API smoke tests from `phase-1-api-contract.md`.
