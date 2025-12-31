import { useCallback, useMemo, useRef, useState } from 'react';

export type PetGame2PetType = 'dog' | 'cat' | 'panda';

export type PetGame2Action = 'feed' | 'play' | 'rest';

export type PetGame2Interaction =
  | { kind: 'idle' }
  | { kind: 'petTap'; startedAt: number }
  | { kind: 'action'; action: PetGame2Action; startedAt: number };

export type PetGame2Vfx =
  | { id: string; kind: 'sparkleBurst'; startedAt: number; durationMs: number }
  | { id: string; kind: 'foodPuff'; startedAt: number; durationMs: number }
  | { id: string; kind: 'toyBounce'; startedAt: number; durationMs: number }
  | { id: string; kind: 'sleepZ'; startedAt: number; durationMs: number };

export type PetGame2CameraMode = 'follow' | 'focus';

export interface PetGame2State {
  interaction: PetGame2Interaction;
  cameraMode: PetGame2CameraMode;
  vfx: PetGame2Vfx[];
}

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const makeId = () => {
  const t = nowMs().toFixed(0);
  const r = Math.random().toString(16).slice(2);
  return `${t}-${r}`;
};

export function usePetGame2State() {
  const [interaction, setInteraction] = useState<PetGame2Interaction>({ kind: 'idle' });
  const [cameraMode, setCameraMode] = useState<PetGame2CameraMode>('follow');
  const [vfx, setVfx] = useState<PetGame2Vfx[]>([]);

  const vfxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearVfxTimer = () => {
    if (vfxTimerRef.current) {
      clearTimeout(vfxTimerRef.current);
      vfxTimerRef.current = null;
    }
  };

  const scheduleVfxCleanup = useCallback(() => {
    clearVfxTimer();
    vfxTimerRef.current = setTimeout(() => {
      const t = nowMs();
      setVfx((prev) => prev.filter((x) => t - x.startedAt <= x.durationMs));
    }, 250);
  }, []);

  const pushVfx = useCallback(
    (next: Omit<PetGame2Vfx, 'id' | 'startedAt'>) => {
      const startedAt = nowMs();
      const id = makeId();
      setVfx((prev) => [...prev, { ...next, id, startedAt }]);
      scheduleVfxCleanup();
    },
    [scheduleVfxCleanup]
  );

  const triggerPetTap = useCallback(() => {
    const startedAt = nowMs();
    setInteraction({ kind: 'petTap', startedAt });
    setCameraMode('focus');
    pushVfx({ kind: 'sparkleBurst', durationMs: 900 });

    window.setTimeout(() => {
      setInteraction((prev) => (prev.kind === 'petTap' && prev.startedAt === startedAt ? { kind: 'idle' } : prev));
      setCameraMode((m) => (m === 'focus' ? 'follow' : m));
    }, 900);
  }, [pushVfx]);

  const triggerAction = useCallback(
    (action: PetGame2Action) => {
      const startedAt = nowMs();
      setInteraction({ kind: 'action', action, startedAt });
      setCameraMode('focus');

      if (action === 'feed') pushVfx({ kind: 'foodPuff', durationMs: 1100 });
      if (action === 'play') pushVfx({ kind: 'toyBounce', durationMs: 1100 });
      if (action === 'rest') pushVfx({ kind: 'sleepZ', durationMs: 1400 });

      window.setTimeout(() => {
        setInteraction((prev) => (prev.kind === 'action' && prev.startedAt === startedAt ? { kind: 'idle' } : prev));
        setCameraMode((m) => (m === 'focus' ? 'follow' : m));
      }, 1100);
    },
    [pushVfx]
  );

  const state: PetGame2State = useMemo(
    () => ({
      interaction,
      cameraMode,
      vfx,
    }),
    [interaction, cameraMode, vfx]
  );

  return {
    state,
    triggerPetTap,
    triggerAction,
  };
}
