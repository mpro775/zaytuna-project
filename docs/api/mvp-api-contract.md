# MVP API Contract - Phase 2

All routes are under the configured API prefix, usually `/api/v1`.

## Settings

- `GET /settings/company`
- `PATCH /settings/company`
- `POST /settings/company/logo`
- `GET /settings/system`
- `PATCH /settings/system`
- `GET /settings/security`
- `PATCH /settings/security`
- `GET /settings/backup`
- `PATCH /settings/backup`
- `POST /settings/validate/:type`
- `POST /settings/reset/:type`
- `GET /settings/system/info`
- `POST /settings/system/clear-cache`
- `GET /settings/backup/history`
- `POST /settings/backup/manual`

## Currency

- `GET /currencies`
- `POST /currencies`
- `GET /currencies/:id`
- `PATCH /currencies/:id`
- `DELETE /currencies/:id`
- `POST /currencies/:id/set-base`
- `POST /currencies/:id/set-default`
- `GET /exchange-rates`
- `POST /exchange-rates`
- `GET /exchange-rates/latest?fromCurrencyId=&toCurrencyId=`
- `POST /exchange-rates/convert`

## Storage And Product Images

- `POST /storage/upload`
- `GET /storage/files`
- `GET /storage/files/:id`
- `GET /storage/files/:id/url`
- `DELETE /storage/files/:id`
- `POST /products/:id/images`
- `GET /products/:id/images`
- `DELETE /products/:id/images/:fileId`

## Sales

- `POST /sales/invoices`
- `GET /sales/invoices`
- `GET /sales/invoices/:id`
- `PATCH /sales/invoices/:id`
- `POST /sales/invoices/:id/confirm`
- `DELETE /sales/invoices/:id/cancel`
- `POST /sales/invoices/:id/payments`
- `GET /sales/stats`

## Notifications

- `GET /notifications`
- `GET /notifications/unread-count`
- `POST /notifications/send`
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- `DELETE /notifications/:id`
- `GET /notifications/preferences`
- `PATCH /notifications/preferences`

## Sync

- `POST /sync/devices/register`
- `GET /sync/initial-data`
- `GET /sync/pull?since=`
- `POST /sync/push`
- `GET /sync/status`
- `GET /sync/batches/:id`

## Backup

- `GET /backup/history`
- `GET /backup/list`
- `POST /backup/manual`
- `GET /backup/:backupId`
- `DELETE /backup/:backupId`

## Reporting

- `GET /reporting/dashboard/overview`
- `GET /reporting/sales`
- `GET /reporting/inventory`
- `GET /reporting/inventory/low-stock`
- `GET /reporting/financial/profit-loss`
- `GET /reporting/financial/balance-sheet`
