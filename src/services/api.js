import axios from 'axios';

const BASE = 'http://localhost:8080';

// Axios instance — attaches JWT from localStorage on every request
const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/register  →  { name, email, password }
// POST /api/v1/auth/login     →  { email, password }
// GET  /api/v1/auth/me        →  Bearer token required
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login',    data),
  getMe:    ()     => api.get('/auth/me'),

  // OAuth redirect URLs  (Spring Security handles the flow)
  googleOAuthUrl: `${BASE}/oauth2/authorization/google`,
  githubOAuthUrl: `${BASE}/oauth2/authorization/github`,
};

// ─── Quantity operations ─────────────────────────────────────────────────────
// All POST endpoints expect:
//   { thisQuantityDTO: { value, unit, measurementType },
//     thatQuantityDTO: { value, unit, measurementType },
//     targetUnitDTO?:  { unit, measurementType } }          ← add/subtract only
//
// Helper to build the shared DTO wrapper
function qBody(v1, u1, v2, u2, type, targetUnit) {
  const body = {
    thisQuantityDTO: { value: v1, unit: u1, measurementType: type },
    thatQuantityDTO: { value: v2 ?? 0, unit: u2, measurementType: type },
  };
  if (targetUnit) body.targetUnitDTO = { unit: targetUnit, measurementType: type };
  return body;
}

export const quantityAPI = {
  compare:  (v1, u1, v2, u2, type)            => api.post('/quantities/compare',  qBody(v1, u1, v2, u2, type)),
  convert:  (v1, u1, toUnit, type)            => api.post('/quantities/convert',  qBody(v1, u1, 0, toUnit, type)),
  add:      (v1, u1, v2, u2, type, tgt)       => api.post('/quantities/add',      qBody(v1, u1, v2, u2, type, tgt)),
  subtract: (v1, u1, v2, u2, type, tgt)       => api.post('/quantities/subtract', qBody(v1, u1, v2, u2, type, tgt)),
  divide:   (v1, u1, v2, u2, type)            => api.post('/quantities/divide',   qBody(v1, u1, v2, u2, type)),
};

// ─── History ─────────────────────────────────────────────────────────────────
// GET /api/v1/quantities/history/operation/{operation}
// GET /api/v1/quantities/history/type/{measurementType}
// GET /api/v1/quantities/history/errored
// GET /api/v1/quantities/count/{operation}
export const historyAPI = {
  getByOperation: (op)   => api.get(`/quantities/history/operation/${op}`),
  getByType:      (type) => api.get(`/quantities/history/type/${type}`),
  getErrors:      ()     => api.get('/quantities/history/errored'),
  getCount:       (op)   => api.get(`/quantities/count/${op}`),
};

export default api;
