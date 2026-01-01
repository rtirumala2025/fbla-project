/**
 * PetGame2Screen Page Component
 * Blank page for Pet Game 2
 */
import React, { useCallback, useMemo, useState } from 'react';
import { usePet } from '@/context/PetContext';
import PetGame2Scene from '@/game3d/PetGame2Scene';
import { usePetGame2State, type PetGame2Action, type PetGame2PetType } from '@/game3d/core/SceneManager';

export const PetGame2Screen: React.FC = () => {
  const { pet, loading, error, feed, play, rest } = usePet();
  const { state, triggerPetTap, triggerAction } = usePetGame2State();
  const [actionBusy, setActionBusy] = useState(false);

  const petType = useMemo<PetGame2PetType>(() => {
    const raw = (pet?.species || 'dog').toLowerCase();
    if (raw === 'cat') return 'cat';
    if (raw === 'panda') return 'panda';
    return 'dog';
  }, [pet?.species]);

  const petName = useMemo(() => {
    return pet?.name || 'Your Pet';
  }, [pet?.name]);

  const onAction = useCallback(
    async (action: PetGame2Action) => {
      if (actionBusy) return;

      triggerAction(action);
      setActionBusy(true);
      try {
        if (action === 'feed') await feed();
        if (action === 'play') await play();
        if (action === 'rest') await rest();
      } finally {
        setActionBusy(false);
      }
    },
    [actionBusy, triggerAction, feed, play, rest]
  );

  const onPetTap = useCallback(() => {
    triggerPetTap();
  }, [triggerPetTap]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-[#0b1020] flex items-center justify-center">
        <div className="text-white/90 text-lg font-semibold">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-[#0b1020] flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <div className="text-white text-2xl font-bold">Pet Game 2</div>
          <div className="text-white/70 mt-3">{error}</div>
        </div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-[#0b1020] flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <div className="text-white text-2xl font-bold">Pet Game 2</div>
          <div className="text-white/70 mt-3">You need a pet before you can play.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-[#0b1020] overflow-hidden relative font-sans">
      <PetGame2Scene
        petType={petType}
        petName={petName}
        stats={pet.stats}
        state={state}
        disabled={actionBusy}
        onPetTap={onPetTap}
        onAction={onAction}
      />
    </div>
  );
};

export default PetGame2Screen;
