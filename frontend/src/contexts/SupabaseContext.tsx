import React, { createContext, useContext, useMemo } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseMock, supabaseEnvironment } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type SupabaseContextValue = {
  client: SupabaseClient<Database>;
  isMock: boolean;
  environment: typeof supabaseEnvironment;
};

const SupabaseContext = createContext<SupabaseContextValue | undefined>(undefined);

type SupabaseProviderProps = {
  children: React.ReactNode;
};

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  const value = useMemo<SupabaseContextValue>(() => ({
    client: supabase,
    isMock: isSupabaseMock(),
    environment: supabaseEnvironment,
  }), []);

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = (): SupabaseContextValue => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};


