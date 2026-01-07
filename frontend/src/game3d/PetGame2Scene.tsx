import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraController } from './core/CameraController.tsx';
import { Lighting, type LightingPreset } from './core/Lighting.tsx';
import type { PetGame2PetType, PetGame2State } from './core/SceneManager.ts';
import type { PetStats } from '@/types/pet';
import { DogPark } from './environments/DogPark.tsx';
import { CozyRoom } from './environments/CozyRoom.tsx';
import { BambooForest } from './environments/BambooForest.tsx';
import { DogModel } from './pets/DogModel.tsx';
import { CatModel } from './pets/CatModel.tsx';
import { PandaModel } from './pets/PandaModel.tsx';
import { SceneVfx } from './core/SceneVfx.tsx';
import { PetHUD } from './ui/PetHUD.tsx';
import type { PetGame2Action } from './core/SceneManager.ts';

function PetModel({
  petType,
  state,
  onPetTap,
  setPetPosition,
  targetRef,
  isMovingRef,
  rotationRef
}: {
  petType: PetGame2PetType;
  state: PetGame2State;
  onPetTap: () => void;
  setPetPosition: (pos: [number, number, number]) => void;
  targetRef: React.MutableRefObject<THREE.Vector3>;
  isMovingRef: React.MutableRefObject<boolean>;
  rotationRef: React.MutableRefObject<THREE.Quaternion>;
}) {
  if (petType === 'cat') return <CatModel state={state} onPetTap={onPetTap} setPetPosition={setPetPosition} />;
  // Note: Only DogModel implements targetRef/rotationRef/isMovingRef for now
  if (petType === 'panda') return <PandaModel state={state} onPetTap={onPetTap} setPetPosition={setPetPosition} />;
  return <DogModel state={state} onPetTap={onPetTap} setPetPosition={setPetPosition} targetRef={targetRef} isMovingRef={isMovingRef} rotationRef={rotationRef} />;
}

function Environment({
  petType,
  state,
  triggerNavigation
}: {
  petType: PetGame2PetType;
  state: PetGame2State;
  triggerNavigation: (zone: any) => void;
}) {
  if (petType === 'cat') return <CozyRoom />;
  if (petType === 'panda') return <BambooForest />;
  return (
    <DogPark
      state={state}
      triggerNavigation={triggerNavigation}
      currentPetPosition={state.currentPosition}
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
  onActivity,
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
  onActivity?: (id: string) => void;
}) {
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const isMovingRef = useRef(false);
  const rotationRef = useRef(new THREE.Quaternion());
  const preset = presetForPet(petType);

  const dpr = useMemo(() => {
    if (typeof window === 'undefined') return 1;
    return Math.min(2, window.devicePixelRatio || 1);
  }, []);

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
      />

      {/* Three.js Canvas */}
      <Canvas
        shadows
        dpr={dpr}
        camera={{ fov: 45, near: 0.5, far: 1000, position: [0, 8, 12] }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#0b1020', 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              (obj as THREE.Mesh).castShadow = true;
              (obj as THREE.Mesh).receiveShadow = true;
            }
          });
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
    </div>
  );
}

export default PetGame2Scene;
