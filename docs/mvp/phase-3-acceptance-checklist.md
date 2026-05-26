# Phase 3 Acceptance Checklist

## Environment and Mock

- [x] `VITE_USE_MOCK_DATA=false` in frontend env files.
- [x] API client no longer imports or falls back to mock services.
- [x] Backend/network errors are shown as errors instead of mock data.
- [x] Mock files remain isolated for later development references only.

## API Client

- [x] Single Axios client in `src/services/api/axios.ts`.
- [x] Standard `ApiResponse<T>` and `PaginationMeta` types exist.
- [x] API errors are normalized to `ApiError`.
- [x] Access token is attached to requests.
- [x] Refresh token flow retries the original request after `401`.
- [x] Refresh failure clears session and redirects to login.

## Auth and Permissions

- [x] Login/logout/me/refresh use backend endpoints.
- [x] Session restore loads `/auth/me`.
- [x] Protected routes support role checks and backend permissions.
- [x] Wildcard permissions are supported.

## Core MVP Areas

- [x] Settings services call backend endpoints.
- [x] Logo upload is linked through backend storage.
- [x] Products call backend product endpoints.
- [x] Categories call backend `/categories`.
- [x] Inventory services call backend inventory endpoints.
- [x] Customers services call backend customer endpoints.
- [x] POS products use backend products.
- [x] POS checkout creates confirmed sales invoices and payments through backend sales endpoints.
- [x] Reports/dashboard services remain backend API driven.
- [x] Offline/sync service layer remains configured against backend `/sync`.

## UX and Build

- [x] Arabic/RTL theme remains enabled.
- [x] Loading and error handling remain in the existing screens.
- [x] TypeScript build passes.
- [x] ESLint passes.

## Manual Acceptance Still Required With Running Backend

- [ ] Login with seeded admin.
- [ ] Create company settings and upload logo.
- [ ] Create currency and exchange rate.
- [ ] Create category, product, variant, and product image.
- [ ] Add inventory quantity.
- [ ] Create customer.
- [ ] Complete POS sale and payment.
- [ ] Confirm stock decrease and notification.
- [ ] Confirm accounting journal entry.
- [ ] Create return and verify stock/accounting reversal.
- [ ] Create supplier and purchase invoice.
- [ ] Verify reports/dashboard changes.
- [ ] Create backup.
- [ ] Test offline sale and sync idempotency.
