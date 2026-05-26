# Phase 3 Frontend Integration

## Scope

Phase 3 connects `frontend-customer` to the real NestJS backend and removes mock data from MVP runtime paths.

## Completed Integration

- API runtime now uses `VITE_API_BASE_URL` directly through one Axios client.
- `VITE_USE_MOCK_DATA=false` is set in frontend environment templates.
- Mock handlers are no longer wired into the API client. Backend/network failures now surface as real errors.
- Auth uses real `/auth/login`, `/auth/refresh`, `/auth/logout`, and `/auth/me`.
- Token refresh runs once on `401`; refresh failure clears local tokens and sends the user to `/login`.
- Product categories now call backend `/categories` instead of the old mock-style `/products/categories`.
- Product image upload sends `file` to match backend `FileInterceptor('file')`.
- Company logo upload uses `/storage/upload` then links the returned file with `/settings/company/logo`.
- POS product and checkout flows use real `/products`, `/products/lookup`, `/branches`, `/warehouses`, `/currencies`, and `/sales/invoices`.
- POS payments post to `/sales/invoices/:id/payments`; inventory deduction remains backend-owned through confirmed sales.
- Route protection supports backend permissions, including wildcard permissions such as `products.*`.

## Deferred or Restricted

- POS shift management remains local UI state because the current backend does not expose shift endpoints.
- Emailing receipts is explicitly blocked as outside the current MVP backend surface.
- Admin monitoring pages still exist but are not part of the core MVP acceptance flow.

## Verification

- `npx tsc -b --pretty false` passes.
- `npm run lint` passes with existing warnings only.
- `npm run build` passes.
