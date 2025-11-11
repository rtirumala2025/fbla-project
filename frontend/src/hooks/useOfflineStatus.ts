import { useEffect, useMemo, useState } from 'react';

export interface OfflineStatus {
  offline: boolean;
  lastSyncedAt: number | null;
  connectionType?: string;
}

type NavigatorWithConnection = Navigator & {
  connection?: {
    effectiveType?: string;
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
  };
};

export const useOfflineStatus = (): OfflineStatus => {
  const [offline, setOffline] = useState<boolean>(() => !navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => (navigator.onLine ? Date.now() : null));
  const [connectionType, setConnectionType] = useState<string | undefined>(() => {
    const nav = navigator as NavigatorWithConnection;
    return nav.connection?.effectiveType;
  });

  useEffect(() => {
    const handleOnline = () => {
      setOffline(false);
      setLastSyncedAt(Date.now());
      const nav = navigator as NavigatorWithConnection;
      setConnectionType(nav.connection?.effectiveType);
    };

    const handleOffline = () => {
      setOffline(true);
      const nav = navigator as NavigatorWithConnection;
      setConnectionType(nav.connection?.effectiveType);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const nav = navigator as NavigatorWithConnection;

    const updateConnection = () => setConnectionType(nav.connection?.effectiveType);

    if (nav.connection?.addEventListener) {
      nav.connection.addEventListener('change', updateConnection);
    }

    return () => {
      if (nav.connection?.removeEventListener) {
        nav.connection.removeEventListener('change', updateConnection);
      }
    };
  }, []);

  return useMemo(
    () => ({
      offline,
      lastSyncedAt,
      connectionType,
    }),
    [offline, lastSyncedAt, connectionType],
  );
};

