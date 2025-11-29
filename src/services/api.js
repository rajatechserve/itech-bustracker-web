
import axios from 'axios';
const baseURL = import.meta.env.VITE_API_URL || 'https://itech-bustracker-app-b9609b94f375.herokuapp.com/api';
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://itech-bustracker-app-b9609b94f375.herokuapp.com';
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

let unauthorizedHandled = false;
api.interceptors.response.use(r=>r, err=>{
  const status = err?.response?.status;
  if(status === 401){
    // Avoid repeated clearing/navigation storms on multiple concurrent 401s
    if(!unauthorizedHandled){
      unauthorizedHandled = true;
      setAuthToken(null);
      setAuthUser(null);
      // Redirect to login only if not already there
      const currentPath = window.location.pathname;
      if(currentPath !== '/login'){ window.location.replace('/login'); }
      // Reset the guard after a short delay to allow next legitimate 401
      setTimeout(()=>{ unauthorizedHandled = false; }, 2000);
    }
  }
  return Promise.reject(err);
});

export default api;
