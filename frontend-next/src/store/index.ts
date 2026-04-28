import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@/lib/supabase';

interface AuthStore {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  setAuth: (session: Session | null) => void;
  logout: () => Promise<void>;
}

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  setAuth: (session) =>
    set({ session, user: session?.user ?? null, isAuthenticated: !!session }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false });
  },
}));

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
