# Known Limitations

- POS shift endpoints are not available in the current backend, so shift open/close is local UI state only.
- Receipt email is blocked because no backend endpoint is available in the MVP contract.
- Some admin monitoring screens contain static dashboard content and are outside the core MVP acceptance path.
- Full manual acceptance requires a running backend with seeded reference data.
- `npm run lint` currently passes with existing warnings in `useWarehouses.ts` and `ProductForm.tsx`; they are warnings, not errors.
