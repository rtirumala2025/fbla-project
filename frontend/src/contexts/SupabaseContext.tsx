/**
 * Supabase Context
 * Provides Supabase client and environment information
 * Adapted to work with existing lib/supabase.ts structure
 */
import React, { createContext, useContext, useMemo } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type SupabaseContextValue = {
  client: SupabaseClient<Database>;
  isMock: boolean;
  environment: {
    url: string | undefined;
    anonKey: string | undefined;
  };
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

const isSupabaseMock = (): boolean => {
  return !process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY;
};

type SupabaseProviderProps = {
  children: React.ReactNode;
};

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const value = useMemo<SupabaseContextValue>(
    () => ({
      client: supabase as SupabaseClient<Database>,
      isMock: isSupabaseMock(),
      environment: {
        url: process.env.REACT_APP_SUPABASE_URL,
        anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
      },
    }),
    []
  );

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
};

export const useSupabase = (): SupabaseContextValue => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

