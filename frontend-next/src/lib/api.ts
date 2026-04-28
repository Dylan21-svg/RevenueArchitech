import axios from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log('API Request Interceptor - Session exists:', !!session);
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      console.error('Authentication Error Details:', err.response?.data?.detail);
      alert('Auth Error: ' + err.response?.data?.detail);
      // window.location.href = '/sign-in';
    }
    return Promise.reject(err);
  }
);

export const healthCheck = () => api.get('/health');
export const getMe = () => api.get('/auth/me');

export const runAudit = (url: string, dailyAdSpend = 0, niche = 'General') =>
  api.post('/audit/', { url, daily_ad_spend: dailyAdSpend, niche });

export const getAudits = (storeId?: string) =>
  storeId ? api.get(`/audit/?store_id=${storeId}`) : api.get('/audit/');

export const getAudit = (auditId: string) => api.get(`/audit/${auditId}`);

export default api;
