# Offline Sync Flow

## Runtime Flags

- `VITE_ENABLE_OFFLINE=true`
- `VITE_ENABLE_PWA=true`
- `VITE_USE_MOCK_DATA=false`

## Flow

1. Authenticated user opens the app online.
2. Sync context registers or reuses a local device id.
3. Initial data is pulled from backend sync endpoints.
4. Offline operations are queued locally with an idempotency key.
5. UI must show queued operations as pending, not confirmed backend records.
6. When connectivity returns, queued operations are pushed to `/sync/push`.
7. Backend decides whether each operation is processed or rejected.
8. Rejected operations remain visible with the backend reason.

## POS Constraint

Online POS sales are confirmed only after `/sales/invoices` and payment endpoints succeed. Offline sales must remain pending until sync accepts them; the frontend must not deduct inventory locally as final truth.
