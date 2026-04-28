'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuth(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setAuth(session));
    return () => subscription.unsubscribe();
  }, [setAuth]);

  return <>{children}</>;
}
