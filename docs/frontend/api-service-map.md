# Frontend API Service Map

## Shared Client

- `src/services/api/axios.ts`: base URL, auth header, refresh handling, error normalization.
- `src/services/api/index.ts`: exports the shared API client and API types.

## Service Mapping

- Auth: `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/verify`.
- Settings: `/settings/:type`, `/settings/company/logo`, `/storage/upload`, `/settings/backup/*`.
- Products: `/products`, `/products/:id`, `/products/:id/images`, `/products/lookup/:identifier`.
- Categories: `/categories`, `/categories/:id`.
- Inventory: `/inventory/stock-items`, `/inventory/movements`, `/inventory/alerts/low-stock`, `/inventory/stats`.
- Customers: `/customers`, `/customers/search`, `/customers/:id`.
- POS facade: `/products`, `/products/lookup/:identifier`, `/branches`, `/warehouses`, `/currencies`, `/sales/invoices`, `/sales/invoices/:id/payments`.
- Sales: `/sales/invoices`, `/sales/invoices/:id`, `/sales/invoices/:id/confirm`, `/sales/invoices/:id/payments`.
- Returns: `/returns`.
- Purchasing: `/purchasing/suppliers`, `/purchasing/orders`, `/purchasing/invoices`.
- Accounting: `/accounting/gl-accounts`, `/accounting/journal-entries`, `/accounting/reports/*`.
- Notifications: `/notifications`, `/notifications/unread-count`, `/notifications/:id/read`, `/notifications/read-all`.
- Sync/offline: `/sync/devices/register`, `/sync/status`, `/sync/initial-data`, `/sync/pull`, `/sync/push`.
- Reports: `/reporting/*`.
- Backup: `/backup/*` and settings backup convenience endpoints.

## Rule

Screens should call service modules only. Do not add direct `fetch` or ad-hoc `axios` calls inside pages.
