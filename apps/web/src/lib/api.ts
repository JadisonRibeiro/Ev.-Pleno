import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export const api = axios.create({ baseURL });

const TOKEN_KEY = 'igreja.token';
const AUTH_STORE_KEY = 'igreja.auth'; // chave usada pelo zustand persist

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

api.interceptors.request.use((cfg) => {
  const token = getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

let redirecting = false;

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      // Limpa o token E o estado persistido do zustand pra evitar loop
      // (Login redirecionaria pra '/' se `user` ainda estivesse no store)
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(AUTH_STORE_KEY);

      if (!redirecting && location.pathname !== '/login') {
        redirecting = true;
        location.replace('/login');
      }
    }
    return Promise.reject(err);
  },
);
