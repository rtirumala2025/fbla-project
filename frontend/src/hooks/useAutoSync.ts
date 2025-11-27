/**
 * useAutoSync Hook
 * Automatically triggers sync when app state changes
 * Integrates with PetContext, FinancialContext, and other state providers
 */
import { useEffect, useRef } from 'react';
import { useSyncManager } from './useSyncManager';
import { usePet } from '../context/PetContext';
import { useOfflineStatus } from './useOfflineStatus';

/**
 * Hook to automatically sync state when it changes
 * Call this in components that modify state
 */
export function useAutoSync() {
  const { save, status } = useSyncManager();
  const { pet } = usePet();
  const offlineStatus = useOfflineStatus();
  const lastPetIdRef = useRef<string | null>(null);
  const lastPetUpdatedRef = useRef<string | null>(null);

  // Sync when pet changes
  useEffect(() => {
    if (!pet) {
      lastPetIdRef.current = null;
      lastPetUpdatedRef.current = null;
      return;
    }

    const petId = pet.id;
    const petUpdated = pet.updatedAt?.toISOString() || new Date().toISOString();

    // Only sync if pet actually changed
    if (
      lastPetIdRef.current !== petId ||
      lastPetUpdatedRef.current !== petUpdated
    ) {
      lastPetIdRef.current = petId;
      lastPetUpdatedRef.current = petUpdated;

      // Debounce sync to avoid too many requests
      const timeoutId = setTimeout(() => {
        if (!offlineStatus.offline && status !== 'syncing') {
          void save({ silent: true });
        }
      }, 2000); // 2 second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [pet, save, status, offlineStatus.offline]);
}

/**
 * Hook to sync on specific state changes
 * Use this when you want more control over when to sync
 */
export function useSyncOnChange<T>(
  value: T,
  options: {
    enabled?: boolean;
    debounceMs?: number;
    silent?: boolean;
  } = {},
) {
  const { save, status } = useSyncManager();
  const offlineStatus = useOfflineStatus();
  const { enabled = true, debounceMs = 1000, silent = true } = options;
  const lastValueRef = useRef<T>(value);

  useEffect(() => {
    if (!enabled || offlineStatus.offline || status === 'syncing') {
      return;
    }

    // Only sync if value actually changed
    if (lastValueRef.current === value) {
      return;
    }

    lastValueRef.current = value;

    const timeoutId = setTimeout(() => {
      void save({ silent });
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, enabled, debounceMs, silent, save, status, offlineStatus.offline]);
}

