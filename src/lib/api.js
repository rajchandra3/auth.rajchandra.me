import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error) {
  refreshQueue.forEach((cb) => (error ? cb.reject(error) : cb.resolve()));
  refreshQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const code = err.response?.data?.code;

    // Only attempt refresh for TOKEN_EXPIRED — not NO_TOKEN, JTI_REVOKED, etc.
    // Never retry if the failing request is the refresh endpoint itself.
    const shouldRefresh =
      err.response?.status === 401 &&
      code === 'TOKEN_EXPIRED' &&
      !original._retry &&
      !original.url?.includes('/identity/auth/refresh');

    if (shouldRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then(() => api(original))
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await api.post('/identity/auth/refresh');
        processQueue(null);
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr);
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  },
);

export const getMe = () => api.get('/identity/auth/me');
export const logout = () => api.post('/identity/auth/logout');
export const updatePreferences = (data) => api.patch('/identity/auth/preferences', data);
export const deleteAccount = () => api.delete('/identity/auth/account');

export const adminListUsers = (params) => api.get('/identity/admin/users', { params });
export const adminGetUser = (id) => api.get(`/identity/admin/users/${id}`);
export const adminUpdateRole = (id, role) => api.patch(`/identity/admin/users/${id}/role`, { role });
export const adminBlockUser = (id, reason) => api.post(`/identity/admin/users/${id}/block`, { reason });
export const adminUnblockUser = (id) => api.post(`/identity/admin/users/${id}/unblock`);
export const adminRevokeSessions = (id) => api.delete(`/identity/admin/users/${id}/sessions`);
export const adminDeleteUser = (id) => api.delete(`/identity/admin/users/${id}`);

export const getGoogleLoginUrl = () => `${API_URL}/identity/auth/google/start`;
export const agentBypass = (params = {}) =>
  api.post('/identity/auth/agent-bypass', typeof params === 'string' ? { returnTo: params } : params);
