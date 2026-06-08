/**
 * @license SPDX-License-Identifier: Apache-2.0
 * AuthContext — untouched business logic, LUMEN-compatible
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { DbUser, SiteSettings } from '../types';

interface AuthContextType {
  user: (User & Partial<DbUser>) | null;
  dbUser: DbUser | null;
  session: Session | null;
  loading: boolean;
  balance: number;
  siteSettings: SiteSettings;
  refreshBalance: () => Promise<number>;
  fetchSiteSettings: () => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'Panel Bazaar BD',
  site_logo_url: '',
  primary_color: '#10b981',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<(User & Partial<DbUser>) | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);

  const fetchSiteSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('site_settings').select('key, value');
      if (error) throw error;
      if (data && data.length > 0) {
        const settings: Partial<SiteSettings> = {};
        data.forEach((row) => {
          if (row.key === 'site_name') settings.site_name = row.value;
          if (row.key === 'site_logo_url') settings.site_logo_url = row.value;
          if (row.key === 'primary_color') settings.primary_color = row.value;
        });
        setSiteSettings({ site_name: settings.site_name || DEFAULT_SETTINGS.site_name, site_logo_url: settings.site_logo_url || DEFAULT_SETTINGS.site_logo_url, primary_color: settings.primary_color || DEFAULT_SETTINGS.primary_color });
      }
    } catch (e) { console.warn('Failed to load site settings:', e); }
  }, []);

  const fetchDbUser = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
      if (error) throw error;
      if (data) { setDbUser(data as DbUser); setBalance(Number(data.balance) || 0); }
    } catch (e) { console.warn('Failed to load user profile:', e); }
  }, []);

  const refreshBalance = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    try {
      const { data, error } = await supabase.from('users').select('balance').eq('id', user.id).single();
      if (error) throw error;
      const fresh = Number(data?.balance) || 0;
      setBalance(fresh);
      return fresh;
    } catch { return balance; }
  }, [user, balance]);

  const updateProfileName = useCallback(async (name: string) => {
    if (!user) return;
    const { error } = await supabase.from('users').update({ display_name: name }).eq('id', user.id);
    if (error) throw error;
    setUser(prev => prev ? { ...prev, display_name: name } : prev);
    setDbUser(prev => prev ? { ...prev, display_name: name } : prev);
  }, [user]);

  useEffect(() => {
    fetchSiteSettings();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user as User & Partial<DbUser>);
        fetchDbUser(session.user.id);
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user as User & Partial<DbUser>);
        fetchDbUser(session.user.id);
      } else {
        setUser(null);
        setDbUser(null);
        setBalance(0);
      }
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [fetchSiteSettings, fetchDbUser]);

  return (
    <AuthContext.Provider value={{ user, dbUser, session, loading, balance, siteSettings, refreshBalance, fetchSiteSettings, updateProfileName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
