# Phase 2 Request Flow

Use this as the Postman or Swagger smoke scenario after the external database is connected.

1. Login as admin.
2. Create or confirm YER as base/default currency.
3. Create USD currency.
4. Create USD to YER exchange rate.
5. Create product and product variant.
6. Upload product image with `POST /products/:id/images`.
7. Create stock item.
8. Create customer.
9. Create draft sale with `POST /sales/invoices`.
10. Confirm sale with `POST /sales/invoices/:id/confirm`.
11. Add payment with `POST /sales/invoices/:id/payments`.
12. Verify stock decreased.
13. Verify notification exists.
14. Create return and confirm it.
15. Create purchase invoice and approve it.
16. Register sync device.
17. Push offline POS sale with a unique `deviceId + idempotencyKey`.
18. Push the same offline sale again and verify no duplicate invoice is created.
19. Create manual backup record.
20. Open dashboard, sales, inventory, and financial reports.
