
import axios from 'axios';
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';
const api = axios.create({ baseURL, timeout: 12000 });

export function setAuthToken(token){
  if(token) localStorage.setItem('auth_token', token); else localStorage.removeItem('auth_token');
}
export function getAuthToken(){ return localStorage.getItem('auth_token'); }
export function setAuthUser(user){ if(user) localStorage.setItem('auth_user', JSON.stringify(user)); else localStorage.removeItem('auth_user'); }
export function getAuthUser(){ try{ const v = localStorage.getItem('auth_user'); return v? JSON.parse(v): null; }catch{ return null; } }

api.interceptors.request.use((config)=>{
  const t = getAuthToken();
  if(t) config.headers = { ...config.headers, Authorization: `Bearer ${t}` };
  return config;
});

api.interceptors.response.use(r=>r, err=>{
  if(err?.response?.status === 401){ setAuthToken(null); }
  return Promise.reject(err);
});

export default api;
