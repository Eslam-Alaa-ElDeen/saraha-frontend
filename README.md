# Saraha Frontend

React frontend for the Saraha anonymous-messaging backend. Built by **Eslam 3laa**.

Stack: Vite, React, react-router-dom, Tailwind CSS v4. No other libraries.

## Run it

1. Start the backend on port 3000.
2. In this folder:

```bash
npm install
npm run dev      # http://localhost:5500
```

The dev server proxies `/api` to `http://localhost:3000`, so there are no CORS or image-blocking problems. Port 5500 is already in the backend's `ALLOWED_ORIGINS`.

## Configuration

`.env.development` / `.env.production`:

- `VITE_API_URL=/api` is the API base path.
- `VITE_GOOGLE_CLIENT_ID=` is optional. When empty, the Google button is hidden.

## Build

```bash
npm run build    # output in dist/
```

In production, serve `dist/` and reverse-proxy `/api` to the backend, stripping the `/api` prefix. Route all other paths to `index.html`.

## Backend setting to change

Set `ACCESS_TOKEN_EXPIRES_IN=3600`. Token refresh relies on it matching the 3600 s login lifetime.

## Layout

- `src/api.js` is the only file that talks to the backend.
- `src/pages/` holds one file per route.
- `src/components/` holds shared pieces.
- `src/validate.js` holds client-side checks.
