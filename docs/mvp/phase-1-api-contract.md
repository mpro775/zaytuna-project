# Zaytun Soft MVP Phase 1 API Contract

## Base

- Base URL: `http://localhost:3000/api/v1`
- Auth: `Authorization: Bearer <accessToken>`
- Token flow: `POST /auth/login` returns access and refresh tokens. `POST /auth/refresh` rotates tokens.
- Entity IDs are strings. They may be cuid-generated IDs or stable seed IDs such as `branch_main`. UUID v4 is not required.

## Standard Responses

Success:

```json
{
  "success": true,
  "data": {},
  "message": "optional",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Error:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Human readable message",
  "details": {},
  "timestamp": "2026-05-26T00:00:00.000Z",
  "path": "/api/v1/resource"
}
```

## Pagination And Filtering

List endpoints use:

```txt
?page=1&limit=20&search=&sortBy=createdAt&sortOrder=desc
```

Filters should be additive query parameters, for example `?isActive=true&branchId=branch_main`.

## Permissions

Permission namespaces use plural module names:

```txt
products.*, currencies.*, exchange-rates.*, settings.*, storage.*, notifications.*, sync.*
```

Wildcard matching rules:

- `*` and `*.*` grant all permissions.
- `products.*` grants `products.create`, `products.read`, `products.update`, and `products.delete`.
- Namespace names should not mix old aliases such as `purchases.*` and `reports.*`; use `purchasing.*` and `reporting.*`.

## Phase 1 Endpoints

Auth:

```txt
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

Foundation CRUD:

```txt
GET    /users
POST   /users
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id

GET    /roles
POST   /roles
GET    /permissions

GET    /branches
POST   /branches
GET    /warehouses
POST   /warehouses
GET    /categories
POST   /categories
GET    /products
POST   /products
GET    /product-variants
POST   /product-variants
```

Settings:

```txt
GET   /settings/company
PATCH /settings/company
GET   /settings/system
PATCH /settings/system
GET   /settings/security
PATCH /settings/security
GET   /settings/backup
PATCH /settings/backup
POST  /settings/validate/:type
POST  /settings/reset/:type
```

Currency and exchange rates:

```txt
GET    /currencies
POST   /currencies
GET    /currencies/:id
PATCH  /currencies/:id
DELETE /currencies/:id
POST   /currencies/:id/set-base
POST   /currencies/:id/set-default

GET  /exchange-rates
POST /exchange-rates
GET  /exchange-rates/latest?from=USD&to=YER
POST /exchange-rates/convert
```

Storage:

```txt
POST   /storage/upload
GET    /storage/files/:id
DELETE /storage/files/:id
```

Phase 1 storage stores metadata in `File`. Product images use `File.entityType = "product"` and `File.entityId = productId`.

Notifications:

```txt
GET   /notifications
PATCH /notifications/:id/read
PATCH /notifications/read-all
```

Sync:

```txt
POST /sync/devices/register
GET  /sync/status
```

## Reserved For Phase 2

```txt
POST /sales/confirm
POST /returns/confirm
POST /purchase-invoices/:id/approve
POST /inventory/transactions
POST /accounting/post
POST /notifications/triggers
POST /sync/push
POST /sync/pull
POST /backup/run
GET  /reports/*
```

Frontend integration should start only after the backend is deployed with PostgreSQL, migrations are applied, seed succeeds, and auth smoke tests pass.
