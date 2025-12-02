/**
 * Component that syncs Zustand store with database
 * Should be placed high in the component tree
 */
import { useStoreSync } from '../../hooks/useStoreSync';

export function StoreSync() {
  useStoreSync();
  return null; // This component doesn't render anything
}
