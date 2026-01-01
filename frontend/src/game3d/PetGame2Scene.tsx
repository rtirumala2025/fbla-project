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

function PetModel({ petType, state, onPetTap }: { petType: PetGame2PetType; state: PetGame2State; onPetTap: () => void }) {
  if (petType === 'cat') return <CatModel state={state} onPetTap={onPetTap} />;
  if (petType === 'panda') return <PandaModel state={state} onPetTap={onPetTap} />;
  return <DogModel state={state} onPetTap={onPetTap} />;
}

function Environment({ petType }: { petType: PetGame2PetType }) {
  if (petType === 'cat') return <CozyRoom />;
  if (petType === 'panda') return <BambooForest />;
  return <DogPark />;
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
}: {
  petType: PetGame2PetType;
  petName: string;
  stats: PetStats | null;
  state: PetGame2State;
  disabled: boolean;
  onPetTap: () => void;
  onAction: (action: PetGame2Action) => void;
}) {
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
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
        disabled={disabled}
        onAction={onAction}
      />

      {/* Three.js Canvas */}
      <Canvas
        shadows
        dpr={dpr}
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 2.4, 5.2] }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#0b1020', 1);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          scene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              (obj as THREE.Mesh).castShadow = true;
              (obj as THREE.Mesh).receiveShadow = true;
            }
          });
        }}
      >
        <Suspense fallback={null}>
          <fog attach="fog" args={preset === 'bamboo' ? ['#cfead8', 7, 18] : ['#b9d4ff', 25, 45]} />
          <Lighting preset={preset} />
          <Environment petType={petType} />

          <group position={[0, 0, 0]}>
            <PetModel petType={petType} state={state} onPetTap={onPetTap} />
          </group>

          <SceneVfx vfx={state.vfx} />
          <CameraController mode={state.cameraMode} target={targetRef.current} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default PetGame2Scene;
