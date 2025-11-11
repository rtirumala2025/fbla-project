import React, { createContext, useContext } from 'react';
import { useSyncManager } from '../hooks/useSyncManager';

export const SyncContext = createContext<ReturnType<typeof useSyncManager> | null>(null);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sync = useSyncManager();
  return <SyncContext.Provider value={sync}>{children}</SyncContext.Provider>;
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};


