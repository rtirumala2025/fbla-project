import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraController } from './core/CameraController.tsx';
import { Lighting, type LightingPreset } from './core/Lighting.tsx';
import type { PetGame2PetType, PetGame2State, ActivityZone } from './core/SceneManager.ts';
import { ACTIVITY_POSITIONS } from './core/SceneManager.ts';
import type { PetStats } from '@/types/pet';
import { DogPark } from './environments/DogPark.tsx';
import { CozyRoom } from './environments/CozyRoom.tsx';
import { BambooForest } from './environments/BambooForest.tsx';
import { DogModel, EquippedAccessory } from './pets/DogModel.tsx';
import { CatModel } from './pets/CatModel.tsx';
import { PandaModel } from './pets/PandaModel.tsx';
import { SceneVfx } from './core/SceneVfx.tsx';
import { PetHUD } from './ui/PetHUD.tsx';
import type { PetGame2Action } from './core/SceneManager.ts';
import { PerformanceMonitor } from './components/PerformanceMonitor';

function PetModel({
  petType,
  state,
  onPetTap,
  setPetPosition,
  targetRef,
  isMovingRef,
  rotationRef,
  accessories = []
}: {
  petType: PetGame2PetType;
  state: PetGame2State;
  onPetTap: () => void;
  setPetPosition: (pos: [number, number, number]) => void;
  targetRef: React.MutableRefObject<THREE.Vector3>;
  isMovingRef: React.MutableRefObject<boolean>;
  rotationRef: React.MutableRefObject<THREE.Quaternion>;
  accessories?: EquippedAccessory[];
}) {
  if (petType === 'cat') return <CatModel state={state} onPetTap={onPetTap} setPetPosition={setPetPosition} />;
  // Note: Only DogModel implements targetRef/rotationRef/isMovingRef for now
  if (petType === 'panda') return <PandaModel state={state} onPetTap={onPetTap} setPetPosition={setPetPosition} />;
  return <DogModel state={state} onPetTap={onPetTap} setPetPosition={setPetPosition} targetRef={targetRef} isMovingRef={isMovingRef} rotationRef={rotationRef} accessories={accessories} />;
}

function Environment({
  petType,
  state,
  triggerNavigation,
  onEnterBuilding,
  onPurchase,
}: {
  petType: PetGame2PetType;
  state: PetGame2State;
  triggerNavigation: (zone: any) => void;
  onEnterBuilding?: (zone: any) => void;
  onPurchase?: (item: any) => void;
}) {
  if (petType === 'cat') return <CozyRoom />;
  if (petType === 'panda') return <BambooForest />;
  return (
    <DogPark
      state={state}
      triggerNavigation={triggerNavigation}
      currentPetPosition={state.currentPosition}
      onEnterBuilding={onEnterBuilding}
      onPurchase={onPurchase}
    />
  );
}

function presetForPet(petType: PetGame2PetType): LightingPreset {
  if (petType === 'cat') return 'room';
  if (petType === 'panda') return 'bamboo';
  return 'park';
}

export function PetGame2Scene({
  petType,
  petName,
  stats,
  state,
  disabled,
  onPetTap,
  onAction,
  onToggleInventory,
  onToggleDiary,
  onToggleSound,
  soundEnabled,
  triggerNavigation,
  setPetPosition,
  onToggleDrone,
  setBreed,
  onExitBuilding,
  onEnterBuilding,
  onActivity,
  balance = 0,
  totalSpent = 0,
  balanceChange = null,
  onPurchase,
  accessories = [],
}: {
  petType: PetGame2PetType;
  petName: string;
  stats: PetStats | null;
  state: PetGame2State;
  disabled: boolean;
  onPetTap: () => void;
  onAction: (action: PetGame2Action) => void;
  onToggleInventory?: () => void;
  onToggleDiary?: () => void;
  onToggleSound?: () => void;
  soundEnabled?: boolean;
  triggerNavigation: (zone: any) => void;
  setPetPosition: (pos: [number, number, number]) => void;
  onToggleDrone: () => void;
  setBreed: (breed: any) => void;
  onExitBuilding?: () => void;
  onEnterBuilding?: (zone: any) => void;
  onActivity?: (id: string) => void;
  balance?: number;
  totalSpent?: number;
  balanceChange?: { amount: number; isPositive: boolean } | null;
  onPurchase?: (item: any) => void;
  accessories?: EquippedAccessory[];
}) {
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const isMovingRef = useRef(false);
  const rotationRef = useRef(new THREE.Quaternion());
  const preset = presetForPet(petType);

  const dpr = useMemo(() => {
    return Math.min(1.5, window.devicePixelRatio || 1);
  }, []);

  // Calculate nearby building for Enter button (only for dog park)
  const nearbyBuilding = useMemo<ActivityZone | null>(() => {
    if (petType !== 'dog') return null; // Only dog park has buildings
    if (state.indoorLocation) return null; // Already inside

    const proximityThreshold = 12;
    // Exclude outdoor-only zones
    const excludedZones: ActivityZone[] = ['play', 'rest', 'center'];

    const petPos = state.currentPosition;
    let nearest: { zone: ActivityZone; distance: number } | null = null;

    for (const [zone, pos] of Object.entries(ACTIVITY_POSITIONS)) {
      if (excludedZones.includes(zone as ActivityZone)) continue;

      const dx = petPos[0] - pos[0];
      const dz = petPos[2] - pos[2];
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < proximityThreshold) {
        if (!nearest || distance < nearest.distance) {
          nearest = { zone: zone as ActivityZone, distance };
        }
      }
    }

    return nearest?.zone ?? null;
  }, [petType, state.currentPosition, state.indoorLocation]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* HTML Overlay HUD - positioned above canvas */}
      <PetHUD
        petName={petName}
        species={petType}
        stats={stats}
        disabled={disabled || state.cameraMode === 'drone'}
        onAction={(action) => {
          if (state.cameraMode === 'drone') return;
          onAction(action);
        }}
        onToggleInventory={() => {
          if (state.cameraMode === 'drone') return;
          onToggleInventory?.();
        }}
        onToggleDiary={() => {
          if (state.cameraMode === 'drone') return;
          onToggleDiary?.();
        }}
        onToggleSound={onToggleSound}
        soundEnabled={soundEnabled}
        onToggleDrone={onToggleDrone}
        droneActive={state.cameraMode === 'drone'}
        breed={state.breed}
        setBreed={setBreed}
        indoorLocation={state.indoorLocation}
        onExitBuilding={onExitBuilding}
        onActivity={onActivity}
        balance={balance}
        totalSpent={totalSpent}
        balanceChange={balanceChange}
        nearbyBuilding={nearbyBuilding}
        onEnterBuilding={onEnterBuilding}
      />

      {/* Three.js Canvas */}
      <Canvas
        shadows
        dpr={dpr} // DPR is already capped at 2 in useMemo, could lower to 1.5 if needed
        camera={{ fov: 45, near: 0.5, far: 1000, position: [0, 8, 12] }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#0b1020', 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          // REMOVED: Loop that forced castShadow/receiveShadow on EVERYTHING.
          // Shadows should be opt-in for performance.
        }}
      >
        <Suspense fallback={null}>
          {/* Global Fog - Exclude 'bamboo' (custom fog) and 'park' (custom bright sky) */}
          {(preset !== 'bamboo' && preset !== 'park') && <fog attach="fog" args={['#b9d4ff', 25, 45]} />}
          <Lighting preset={preset} />
          <Environment
            petType={petType}
            state={state}
            triggerNavigation={triggerNavigation}
            onEnterBuilding={onEnterBuilding}
            onPurchase={onPurchase}
          />

          <group position={[0, 0, 0]}>
            <PetModel
              petType={petType}
              state={state}
              onPetTap={() => {
                if (state.cameraMode === 'drone') return;
                onPetTap();
              }}
              setPetPosition={setPetPosition}
              targetRef={targetRef}
              isMovingRef={isMovingRef}
              rotationRef={rotationRef}
              accessories={accessories}
            />
          </group>

          <SceneVfx vfx={state.vfx} />
          <CameraController
            mode={state.cameraMode}
            interaction={state.interaction}
            currentPosition={state.currentPosition}
            indoorLocation={state.indoorLocation}
            onDroneExit={onToggleDrone}
            targetRef={targetRef}
            isMovingRef={isMovingRef}
            rotationRef={rotationRef}
          />
        </Suspense>
      </Canvas>
      {process.env.NODE_ENV === 'development' && <PerformanceMonitor />}
    </div >
  );
}

export default PetGame2Scene;
