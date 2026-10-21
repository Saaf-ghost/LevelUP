# BoostUP Frontend

React 19 + TypeScript + Vite client for BoostUP.

## Commands
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # TypeScript check + production bundle
npm run lint
npm run preview
```

## Configuration
The API base URL is read from `VITE_API_BASE_URL`. Set it in the root `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8082/api
```

## Structure
- `src/pages/` - landing, authentication, and workspace screens
- `src/context/` - authentication and sprint/project state
- `src/components/` - layout, Kanban, and shared UI
- `src/lib/` - API client and utilities
