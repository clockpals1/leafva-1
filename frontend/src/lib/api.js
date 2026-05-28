import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("leafva_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401 && window.location.pathname.startsWith("/admin")) {
      localStorage.removeItem("leafva_token");
      if (!window.location.pathname.endsWith("/login")) {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const auth = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
  logout: () => {
    localStorage.removeItem("leafva_token");
    localStorage.removeItem("leafva_user");
  },
  setToken: (token, user) => {
    localStorage.setItem("leafva_token", token);
    localStorage.setItem("leafva_user", JSON.stringify(user));
  },
  isLoggedIn: () => !!localStorage.getItem("leafva_token"),
  user: () => {
    const u = localStorage.getItem("leafva_user");
    return u ? JSON.parse(u) : null;
  },
};

export const chat = {
  start: () => api.post("/chat/start"),
  send: (session_id, message) => api.post("/chat/message", { session_id, message }),
  session: (id) => api.get(`/chat/session/${id}`),
};
