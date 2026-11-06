import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Where the backend lives. Switch to http://localhost:3000 to use a local backend.
const BACKEND = "https://saraha-app-production-7778.up.railway.app";

// The backend has no /api prefix, so the proxy strips it.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5500,
    proxy: {
      "/api": {
        target: BACKEND,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/uploads": { target: BACKEND, changeOrigin: true, secure: true },
    },
  },
});