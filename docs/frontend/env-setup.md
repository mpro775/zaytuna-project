# Frontend Environment Setup

## Local MVP

Use `frontend-customer/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=10000
VITE_USE_MOCK_DATA=false
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_PWA=true
VITE_DEFAULT_LOCALE=ar
```

## Backend Requirements

- Backend listens on `http://localhost:3000`.
- Global prefix is `api/v1`.
- CORS allows the Vite origin.
- Seeded admin user exists.
- Required reference data exists or can be created: branch, warehouse, currency, category, product variant, stock item.

## Commands

```bash
npm install
npm run lint
npm run build
npm run dev
```

The app should fail visibly when the backend is down. It should not switch to mock data.
