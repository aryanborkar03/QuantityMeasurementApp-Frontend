// ─────────────────────────────────────────────────────────────────────────────
// Central API config
//
// /api calls use a relative path — the Vite dev proxy forwards them to the
// gateway on port 8080, keeping REST calls same-origin and CORS-free.
//
// OAuth2 URLs are ABSOLUTE (port 8080) because OAuth2 is a browser-redirect
// flow, not a fetch/XHR call. The browser must land on the gateway directly so:
//   - Spring can set the oauth2_auth_request cookie on the correct origin
//   - The Google/GitHub callback returns to port 8080 where Spring is listening
//   - Spring then redirects to http://localhost:5173/?token=...&name=...
//   - App.jsx reads the token from the URL search params
//
// Proxying OAuth2 through Vite breaks the cookie SameSite rules and the
// redirect chain → the state cookie is lost → Spring rejects the callback
// → silent redirect to "/" with no token → looks like an auth loop.
// ─────────────────────────────────────────────────────────────────────────────

export const AUTH_BASE = '/api/v1/auth';
export const QMA_BASE  = '/api/v1/quantities';

// Direct to gateway — NOT through the Vite proxy
export const GATEWAY_BASE = import.meta.env.VITE_API_URL || 'https://qma-api-gateway-sg9f.onrender.com';
export const GOOGLE_AUTH_URL = `${GATEWAY_BASE}/oauth2/authorization/google`;
export const GITHUB_AUTH_URL = `${GATEWAY_BASE}/oauth2/authorization/github`;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns headers including Bearer token if one exists in localStorage */
export function authHeaders(extra = {}) {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

/**
 * Thin fetch wrapper — throws an Error with the server's message on non-2xx.
 * Callers can catch and pass err.message straight to showToast().
 */
export async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);

  // Try to parse JSON; fall back to empty object for responses with no body
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Prefer backend's message field, then error field, then generic HTTP status
    const msg = data.message || data.error || `HTTP ${response.status}`;
    throw new Error(msg);
  }
  return data;
}
