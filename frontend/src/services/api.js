import axios from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// HEALTH & AUTH
// ============================================================================

export const healthCheck = () => api.get('/health');

export const initiateShopifyAuth = (shopDomain) =>
  api.post('/auth/initiate', { shop_domain: shopDomain });

export const handleShopifyCallback = (code, shop) =>
  api.get('/auth/callback', { params: { code, shop } });

// ============================================================================
// STORES (Multi-store Support)
// ============================================================================

export const getStores = () => api.get('/stores');

export const getStore = (storeId) => api.get(`/stores/${storeId}`);

export const deleteStore = (storeId) => api.delete(`/stores/${storeId}`);

// ============================================================================
// THEMES
// ============================================================================

export const getThemes = (storeId) => api.get(`/themes/${storeId}`);

// ============================================================================
// AUDITS
// ============================================================================

export const runAudit = (url, dailyAdSpend = 0) =>
  api.post('/audit', { url, daily_ad_spend: dailyAdSpend });

export const getAudits = (storeId) => 
  storeId ? api.get(`/audits?store_id=${storeId}`) : api.get('/audits');

export const getAudit = (auditId) => api.get(`/audits/${auditId}`);

export const getAuditHistory = (storeId, limit = 10) =>
  api.get(`/audits/history/${storeId}?limit=${limit}`);

// ============================================================================
// FIXES
// ============================================================================

export const applyFix = (storeId, fixData) => api.post(`/fix/${storeId}`, fixData);

export const applyAutoFix = (storeId, themeId, auditUrl) =>
  api.post(`/fix/auto/${storeId}`, null, { params: { theme_id: themeId, audit_url: auditUrl } });

export const getFixHistory = (storeId) => api.get(`/fixes/history/${storeId}`);

export const revertFix = (fixId) => api.post(`/fixes/revert/${fixId}`);

// ============================================================================
// A/B TESTING
// ============================================================================

export const createABTest = (testData) => api.post('/ab-tests', testData);

export const getABTests = (storeId) => api.get(`/ab-tests?store_id=${storeId}`);

export const getABTest = (testId) => api.get(`/ab-tests/${testId}`);

export const updateABTestStatus = (testId, status) =>
  api.patch(`/ab-tests/${testId}`, { status });

export const getABTestResults = (testId) => api.get(`/ab-tests/${testId}/results`);

// ============================================================================
// ANALYTICS
// ============================================================================

export const getRevenueAnalytics = (storeId, dateRange) =>
  api.get(`/analytics/revenue/${storeId}`, { params: dateRange });

export const getROIAnalytics = (storeId) => api.get(`/analytics/roi/${storeId}`);

export const getConversionMetrics = (storeId) => api.get(`/analytics/conversions/${storeId}`);

export const getAttributionData = (storeId) => api.get(`/analytics/attribution/${storeId}`);

export default api;