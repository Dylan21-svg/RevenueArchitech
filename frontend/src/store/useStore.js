import { create } from 'zustand';
import * as api from '../services/api';
import { supabase } from '../services/supabase';

export const useStore = create((set, get) => ({
  // ============================================================================
  // AUTH STATE
  // ============================================================================
  isAuthenticated: false, // Will be updated by Supabase listener
  user: null,

  setAuth: (session) => {
    set({ 
      isAuthenticated: !!session, 
      user: session?.user || null 
    });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ isAuthenticated: false, user: null, stores: [], currentStore: null });
  },

  // ============================================================================
  // STORES (Multi-store Support)
  // ============================================================================
  stores: [],
  currentStore: null,
  storesLoading: false,
  storesError: null,

  fetchStores: async () => {
    set({ storesLoading: true, storesError: null });
    try {
      const response = await api.getStores();
      set({ stores: response.data, storesLoading: false });
    } catch (error) {
      set({ storesError: error.message, storesLoading: false });
    }
  },

  setCurrentStore: (store) => set({ currentStore: store }),

  addStore: (store) => set((state) => ({ stores: [...state.stores, store] })),

  removeStore: (storeId) => set((state) => ({
    stores: state.stores.filter((s) => s.id !== storeId),
    currentStore: state.currentStore?.id === storeId ? null : state.currentStore,
  })),

  // ============================================================================
  // THEMES
  // ============================================================================
  themes: [],
  themesLoading: false,

  fetchThemes: async (storeId) => {
    set({ themesLoading: true });
    try {
      const response = await api.getThemes(storeId);
      set({ themes: response.data.themes || [], themesLoading: false });
    } catch (error) {
      set({ themesLoading: false });
    }
  },

  // ============================================================================
  // AUDITS
  // ============================================================================
  audits: [],
  currentAudit: null,
  auditHistory: [],
  auditsLoading: false,
  auditError: null,

  runAudit: async (url, dailyAdSpend = 0) => {
    set({ auditsLoading: true, auditError: null });
    try {
      const response = await api.runAudit(url, dailyAdSpend);
      const audit = response.data;
      set((state) => ({
        audits: [audit, ...state.audits],
        currentAudit: audit,
        auditsLoading: false,
      }));
      return audit;
    } catch (error) {
      set({ auditError: error.message, auditsLoading: false });
      throw error;
    }
  },

  fetchAudits: async (storeId) => {
    set({ auditsLoading: true });
    try {
      const response = await api.getAudits(storeId);
      set({ audits: response.data, auditsLoading: false });
    } catch (error) {
      set({ auditsLoading: false });
    }
  },

  fetchAuditHistory: async (storeId, limit = 10) => {
    try {
      const response = await api.getAuditHistory(storeId, limit);
      set({ auditHistory: response.data });
    } catch (error) {
      console.error('Failed to fetch audit history:', error);
    }
  },

  setCurrentAudit: (audit) => set({ currentAudit: audit }),

  // ============================================================================
  // FIXES
  // ============================================================================
  fixes: [],
  fixesLoading: false,
  fixProgress: null,

  applyFix: async (storeId, fixData) => {
    set({ fixesLoading: true, fixProgress: { stage: 'starting', percentage: 0, message: 'Initializing fix...' } });
    try {
      const response = await api.applyFix(storeId, fixData);
      set((state) => ({
        fixes: [response.data, ...state.fixes],
        fixesLoading: false,
        fixProgress: null,
      }));
      return response.data;
    } catch (error) {
      set({ fixesLoading: false, fixProgress: null });
      throw error;
    }
  },

  applyAutoFix: async (storeId, themeId, auditUrl) => {
    set({ fixesLoading: true, fixProgress: { stage: 'analyzing', percentage: 0, message: 'Analyzing audit results...' } });
    try {
      const response = await api.applyAutoFix(storeId, themeId, auditUrl);
      set((state) => ({
        fixes: [response.data, ...state.fixes],
        fixesLoading: false,
        fixProgress: null,
      }));
      return response.data;
    } catch (error) {
      set({ fixesLoading: false, fixProgress: null });
      throw error;
    }
  },

  setFixProgress: (progress) => set({ fixProgress: progress }),

  fetchFixHistory: async (storeId) => {
    try {
      const response = await api.getFixHistory(storeId);
      set({ fixes: response.data });
    } catch (error) {
      console.error('Failed to fetch fix history:', error);
    }
  },

  // ============================================================================
  // A/B TESTING
  // ============================================================================
  abTests: [],
  currentABTest: null,
  abTestsLoading: false,

  createABTest: async (testData) => {
    set({ abTestsLoading: true });
    try {
      const response = await api.createABTest(testData);
      set((state) => ({
        abTests: [response.data, ...state.abTests],
        currentABTest: response.data,
        abTestsLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({ abTestsLoading: false });
      throw error;
    }
  },

  fetchABTests: async (storeId) => {
    try {
      const response = await api.getABTests(storeId);
      set({ abTests: response.data });
    } catch (error) {
      console.error('Failed to fetch A/B tests:', error);
    }
  },

  setCurrentABTest: (test) => set({ currentABTest: test }),

  // ============================================================================
  // ANALYTICS
  // ============================================================================
  revenueAnalytics: null,
  roiAnalytics: null,
  conversionMetrics: null,
  attributionData: null,
  analyticsLoading: false,

  fetchRevenueAnalytics: async (storeId, dateRange) => {
    set({ analyticsLoading: true });
    try {
      const response = await api.getRevenueAnalytics(storeId, dateRange);
      set({ revenueAnalytics: response.data, analyticsLoading: false });
    } catch (error) {
      set({ analyticsLoading: false });
    }
  },

  fetchROIAnalytics: async (storeId) => {
    try {
      const response = await api.getROIAnalytics(storeId);
      set({ roiAnalytics: response.data });
    } catch (error) {
      console.error('Failed to fetch ROI analytics:', error);
    }
  },

  fetchConversionMetrics: async (storeId) => {
    try {
      const response = await api.getConversionMetrics(storeId);
      set({ conversionMetrics: response.data });
    } catch (error) {
      console.error('Failed to fetch conversion metrics:', error);
    }
  },

  fetchAttributionData: async (storeId) => {
    try {
      const response = await api.getAttributionData(storeId);
      set({ attributionData: response.data });
    } catch (error) {
      console.error('Failed to fetch attribution data:', error);
    }
  },

  // ============================================================================
  // UI STATE
  // ============================================================================
  sidebarOpen: true,
  activeTab: 'dashboard',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export default useStore;