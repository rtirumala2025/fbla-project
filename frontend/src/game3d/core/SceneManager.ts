import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type PetGame2PetType = 'dog' | 'cat' | 'panda';

export type PetGame2Action = 'feed' | 'play' | 'rest' | 'bathe';

export type ActivityZone = 'agility' | 'vet' | 'play' | 'rest' | 'center';

export type PetGame2Interaction =
  | { kind: 'idle' }
  | { kind: 'petTap'; startedAt: number }
  | { kind: 'action'; action: PetGame2Action; startedAt: number }
  | { kind: 'navigating'; zone: ActivityZone; startedAt: number }
  | { kind: 'atActivity'; zone: ActivityZone; startedAt: number };

export interface NavigationState {
  target: ActivityZone | null;
  progress: number; // 0-1
  startPosition: [number, number, number];
  endPosition: [number, number, number];
}

export type PetGame2Vfx =
  | { id: string; kind: 'sparkleBurst'; startedAt: number; durationMs: number }
  | { id: string; kind: 'foodPuff'; startedAt: number; durationMs: number }
  | { id: string; kind: 'toyBounce'; startedAt: number; durationMs: number }
  | { id: string; kind: 'sleepZ'; startedAt: number; durationMs: number }
  | { id: string; kind: 'bubbleBurst'; startedAt: number; durationMs: number }
  | { id: string; kind: 'cleaning'; startedAt: number; durationMs: number };

export type PetGame2CameraMode = 'follow' | 'focus' | 'drone';

export interface PetGame2State {
  interaction: PetGame2Interaction;
  cameraMode: PetGame2CameraMode;
  vfx: PetGame2Vfx[];
  navigationState: NavigationState;
  currentPosition: [number, number, number];
}

// Activity zone positions (matching DogPark.tsx building positions)
export const ACTIVITY_POSITIONS: Record<ActivityZone, [number, number, number]> = {
  agility: [-16, 0, -14],
  vet: [-18, 0, 10],
  play: [14, 0, -18],
  rest: [16, 0, 14],
  center: [0, 0, 0],
};

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
  const [navigationState, setNavigationState] = useState<NavigationState>({
    target: null,
    progress: 0,
    startPosition: [0, 0, 0],
    endPosition: [0, 0, 0],
  });
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>([0, 0, 0]);

  const vfxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navAnimRef = useRef<number | null>(null);
  const petPositionRef = useRef<[number, number, number]>([0, 0, 0]);

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
    // PREVENT: Don't allow camera jumps/interactions if we are in drone mode
    setCameraMode((m) => {
      if (m === 'drone') return 'drone';

      const startedAt = nowMs();
      setInteraction({ kind: 'petTap', startedAt });

      window.setTimeout(() => {
        setInteraction((prev) => (prev.kind === 'petTap' && prev.startedAt === startedAt ? { kind: 'idle' } : prev));
        setCameraMode((curr) => (curr === 'focus' ? 'follow' : curr));
      }, 900);

      return 'focus';
    });
    pushVfx({ kind: 'sparkleBurst', durationMs: 900 });
  }, [pushVfx]);

  const triggerAction = useCallback(
    (action: PetGame2Action) => {
      setCameraMode((m) => {
        if (m === 'drone') return 'drone';

        const startedAt = nowMs();
        setInteraction({ kind: 'action', action, startedAt });

        if (action === 'feed') pushVfx({ kind: 'foodPuff', durationMs: 1100 });
        if (action === 'play') pushVfx({ kind: 'toyBounce', durationMs: 1100 });
        if (action === 'rest') pushVfx({ kind: 'sleepZ', durationMs: 1400 });
        if (action === 'bathe') {
          pushVfx({ kind: 'bubbleBurst', durationMs: 1200 });
          pushVfx({ kind: 'cleaning', durationMs: 1200 });
        }

        window.setTimeout(() => {
          setInteraction((prev) => (prev.kind === 'action' && prev.startedAt === startedAt ? { kind: 'idle' } : prev));
          setCameraMode((curr) => (curr === 'focus' ? 'follow' : curr));
        }, 1100);

        return 'focus';
      });
    },
    [pushVfx]
  );

  const triggerNavigation = useCallback((zone: ActivityZone) => {
    setCameraMode(m => {
      if (m === 'drone') return 'drone';

      const startedAt = nowMs();
      const endPosition = ACTIVITY_POSITIONS[zone];

      setNavigationState({
        target: zone,
        progress: 0,
        startPosition: petPositionRef.current,
        endPosition,
      });

      setInteraction({ kind: 'navigating', zone, startedAt });
      return 'follow';
    });
  }, []);

  // Navigation animation loop
  useEffect(() => {
    if (interaction.kind !== 'navigating' || !navigationState.target) return;

    const startTime = interaction.startedAt;
    const duration = 2000; // 2 seconds to walk to destination

    const animate = () => {
      const elapsed = nowMs() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setNavigationState((prev) => ({
        ...prev,
        progress,
      }));

      if (progress >= 1) {
        // Navigation complete
        setInteraction({ kind: 'atActivity', zone: navigationState.target!, startedAt: nowMs() });
        setNavigationState((prev) => ({ ...prev, target: null, progress: 0 }));

        // Return to idle after 2 seconds at activity
        window.setTimeout(() => {
          setInteraction((prev) =>
            prev.kind === 'atActivity' && prev.zone === navigationState.target
              ? { kind: 'idle' }
              : prev
          );
        }, 2000);
      } else {
        navAnimRef.current = requestAnimationFrame(animate);
      }
    };

    navAnimRef.current = requestAnimationFrame(animate);

    return () => {
      if (navAnimRef.current) {
        cancelAnimationFrame(navAnimRef.current);
        navAnimRef.current = null;
      }
    };
  }, [interaction, navigationState.target]);

  const state: PetGame2State = useMemo(
    () => ({
      interaction,
      cameraMode,
      vfx,
      navigationState,
      currentPosition,
    }),
    [interaction, cameraMode, vfx, navigationState, currentPosition]
  );

  return {
    state,
    triggerPetTap,
    triggerAction,
    triggerNavigation,
    setPetPosition: (pos: [number, number, number]) => {
      petPositionRef.current = pos;
      setCurrentPosition(pos);
    },
    setCameraMode,
  };
}
