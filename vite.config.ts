import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// ─────────────────────────────────────────────────────────────────────────────
// WHY the proxy only covers /api and NOT /oauth2 or /login/oauth2:
//
// OAuth2 is a browser-redirect flow, not an XHR/fetch call.
// When the user clicks "Login with Google":
//   1. Browser navigates to http://localhost:8080/oauth2/authorization/google
//      (the gateway/auth-service, directly — NOT through the Vite proxy)
//   2. Spring redirects browser → Google
//   3. Google redirects browser → http://localhost:8080/login/oauth2/code/google
//   4. Spring processes the callback, issues JWT, and redirects browser →
//      http://localhost:5173/?token=xxx&name=yyy
//   5. App.jsx reads the token from the URL and stores it in localStorage.
//
// If we proxy the OAuth2 URLs, the Set-Cookie header carrying the
// oauth2_auth_request state cookie is blocked (SameSite/cross-origin) and
// the callback always fails with "Authorization Request Not Found".
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    port: 5173,
    proxy: {
      // All REST API calls go through the gateway
      '/api': {
        target: process.env.VITE_API_URL || 'https://qma-api-gateway.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      // NOTE: /oauth2 and /login/oauth2 are intentionally NOT proxied.
      // See comment above — OAuth2 redirect flows must hit port 8080 directly.
    },
  },
})
