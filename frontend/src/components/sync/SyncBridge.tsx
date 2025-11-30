/**
 * SyncBridge Component
 * Bridges pet state changes to sync manager
 * Note: This is a simplified version that works with SyncContext
 * For full pet integration, a PetContext would need to be created
 */
import { useEffect, useRef } from 'react';
import { useSyncManager } from '../../hooks/useSyncManager';
import type { Pet } from '../../types/pet';

interface SyncBridgeProps {
  pet?: Pet | null;
  onRefreshPet?: () => void;
}

const buildSnapshot = (pet: Pet | null) => {
  if (!pet) {
    return {
      pets: [],
      inventory: [],
      quests: [],
      progress: {},
    };
  }

  return {
    pets: [
      {
        id: pet.id,
        name: pet.name,
        species: pet.species,
        level: pet.level ?? 1,
        experience: pet.experience ?? 0,
        stats: {
          health: pet.stats.health,
          hunger: pet.stats.hunger,
          happiness: pet.stats.happiness,
          cleanliness: pet.stats.cleanliness,
          energy: pet.stats.energy,
        },
        updated_at: pet.updatedAt instanceof Date ? pet.updatedAt.toISOString() : new Date().toISOString(),
      },
    ],
    inventory: [],
    quests: [],
    progress: {
      level: pet.level ?? 1,
      experience: pet.experience ?? 0,
    },
  };
};

export const SyncBridge = ({ pet, onRefreshPet }: SyncBridgeProps) => {
  const { enqueueChange, cloudState, refresh } = useSyncManager();
  const lastSnapshotRef = useRef<string | null>(null);
  const appliedVersionRef = useRef<number>(cloudState?.version ?? 0);
  const attemptedInitialPullRef = useRef<boolean>(false);

  useEffect(() => {
    if (pet && !cloudState && !attemptedInitialPullRef.current) {
      attemptedInitialPullRef.current = true;
      void refresh();
    }
  }, [pet, cloudState, refresh]);

  useEffect(() => {
    if (!cloudState) {
      return;
    }
    if (cloudState.version > appliedVersionRef.current) {
      appliedVersionRef.current = cloudState.version;
      onRefreshPet?.();
    }
  }, [cloudState, onRefreshPet]);

  useEffect(() => {
    if (!pet) {
      return;
    }

    const snapshot = buildSnapshot(pet);
    const signature = JSON.stringify(snapshot);
    if (signature === lastSnapshotRef.current) {
      return;
    }
    lastSnapshotRef.current = signature;
    enqueueChange({ snapshot, timestamp: new Date().toISOString() });
  }, [
    pet?.id,
    pet?.stats?.health,
    pet?.stats?.happiness,
    pet?.stats?.hunger,
    pet?.stats?.cleanliness,
    pet?.stats?.energy,
    enqueueChange
  ]);

  return null;
};

export default SyncBridge;

