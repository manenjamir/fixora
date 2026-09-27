import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { normalizePhone } from '@/lib/phone';
import type { ProfileRow } from '@/types/database';

type AppRole = 'customer' | 'tech';

type AuthContextValue = {
  session: Session | null;
  profile: ProfileRow | null;
  loading: boolean;
  sendOtp: (phone: string, role: AppRole) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string, fallback?: { role: AppRole; phone?: string | null }) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    if (data) return data;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  if (fallback) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: userId, role: fallback.role, phone: fallback.phone ?? null })
      .select('*')
      .single();
    if (!error && data) return data;
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | undefined, session?: Session | null) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const metaRole = session?.user.user_metadata?.role;
    const role: AppRole = metaRole === 'tech' ? 'tech' : 'customer';
    setProfile(await fetchProfile(userId, { role, phone: session?.user.phone }));
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      try {
        await loadProfile(data.session?.user.id, data.session);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      await loadProfile(nextSession?.user.id, nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const sendOtp = useCallback(async (phone: string, role: AppRole) => {
    const e164 = normalizePhone(phone);
    const { error } = await supabase.auth.signInWithOtp({
      phone: e164,
      options: { data: { role } },
    });
    if (error) throw error;
  }, []);

  const verifyOtp = useCallback(async (phone: string, token: string) => {
    const e164 = normalizePhone(phone);
    const { error } = await supabase.auth.verifyOtp({
      phone: e164,
      token: token.trim(),
      type: 'sms',
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ session, profile, loading, sendOtp, verifyOtp, signOut }),
    [session, profile, loading, sendOtp, verifyOtp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
