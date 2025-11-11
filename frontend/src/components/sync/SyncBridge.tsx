import { useEffect, useRef } from 'react';
import { usePet } from '../../context/PetContext';
import { useSync } from '../../contexts/SyncContext';
import type { Pet } from '@/types/pet';

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
        level: pet.level,
        experience: pet.experience,
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
      level: pet.level,
      experience: pet.experience,
    },
  };
};

const SyncBridge = () => {
  const { pet, refreshPet } = usePet();
  const { enqueueChange, cloudState, refresh } = useSync();
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
      void refreshPet();
    }
  }, [cloudState, refreshPet]);

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
    enqueueChange(snapshot, new Date().toISOString());
  }, [pet, pet?.stats.health, pet?.stats.happiness, pet?.stats.hunger, pet?.stats.cleanliness, pet?.stats.energy, enqueueChange]);

  return null;
};

export default SyncBridge;


