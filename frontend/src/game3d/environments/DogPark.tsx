import React, { useMemo, useRef } from 'react';
import { Cloud, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeGrassTexture, createCanvasTexture } from '../core/AssetLoader';
import { AgilityFacility } from '../props/AgilityFacility';
import { VetClinic } from '../props/VetClinic';
import { PlayPavilion } from '../props/PlayPavilion';
import { RestShelter } from '../props/RestShelter';
import { ParkHubBuilding } from '../props/ParkHubBuilding';
import { NavigationGuide } from '../ui/NavigationGuide';
import type { PetGame2State, ActivityZone } from '../core/SceneManager';

// --- Assets & Helpers ---

function makeGravelTexture() {
  return createCanvasTexture({
    size: 512,
    paint: (ctx, size) => {
      ctx.fillStyle = '#6a5a4e';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 15000; i++) {
        const shade = Math.random() > 0.5 ? 80 : 130;
        ctx.fillStyle = `rgba(${shade},${shade},${shade},0.3)`;
        const s = 1 + Math.random() * 2;
        ctx.fillRect(Math.random() * size, Math.random() * size, s, s);
      }
    }
  });
}

function Tree({ position, scale = 1, rotation = 0, lean = [0, 0] }: { position: [number, number, number]; scale?: number; rotation?: number, lean?: [number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const sway = Math.sin(t * 0.8 + position[0]) * 0.015;
    groupRef.current.rotation.z = lean[0] + sway;
    groupRef.current.rotation.x = lean[1] + Math.cos(t * 0.6 + position[2]) * 0.01;
  });
  return (
    <group ref={groupRef} position={position} scale={scale} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.8 * scale, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15 * scale, 0.25 * scale, 1.6 * scale, 8]} />
        <meshStandardMaterial color="#4a3b2f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.2 * scale, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1 * scale, 0]} />
        <meshStandardMaterial color="#4d7e36" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Bush({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#3a5e2a" roughness={0.9} />
      </mesh>
    </group>
  );
}

// --- SCENERY ---

export function DogPark({
  state,
  triggerNavigation,
  currentPetPosition
}: {
  state: PetGame2State;
  triggerNavigation: (zone: ActivityZone) => void;
  currentPetPosition: [number, number, number];
}) {
  const grassTex = useMemo(() => {
    const t = makeGrassTexture();
    t.repeat.set(32, 32);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  const gravelTex = useMemo(() => {
    const t = makeGravelTexture();
    t.repeat.set(10, 10);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  const scenery = useMemo(() => {
    const trees: { pos: [number, number, number]; scale: number; rot: number; lean: [number, number] }[] = [];
    const bushes: { pos: [number, number, number]; scale: number; rot: number }[] = [];

    // Bounds for organic forest
    for (let i = 0; i < 110; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 30;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Clearing for buildings
      if (Math.abs(x) < 18 && Math.abs(z) < 18) continue;

      trees.push({
        pos: [x, 0, z],
        scale: 0.7 + Math.random() * 1.2,
        rot: Math.random() * Math.PI,
        lean: [(Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15]
      });

      if (Math.random() > 0.4) {
        bushes.push({
          pos: [x + (Math.random() - 0.5) * 3, 0, z + (Math.random() - 0.5) * 3],
          scale: 0.5 + Math.random() * 0.5,
          rot: Math.random() * Math.PI
        });
      }
    }

    return { trees, bushes };
  }, []);

  return (
    <>
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 35, 100]} />

      <group position={[0, 25, -15]}>
        <Cloud opacity={0.6} speed={0.1} segments={40} bounds={[50, 6, 50]} volume={18} color="#ffffff" />
      </group>

      {/* --- MAIN GROUND --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial map={grassTex} color="#98c48a" roughness={1} />
      </mesh>

      {/* --- CENTRAL PLAZA (Organic Shape) --- */}
      {/* A large central circle with gravel */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[12, 64]} />
        <meshStandardMaterial map={gravelTex} color="#998877" transparent opacity={0.95} />
      </mesh>

      {/* Path Spokes */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 100]} />
        <meshStandardMaterial map={gravelTex} color="#998877" />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 5]} />
        <meshStandardMaterial map={gravelTex} color="#998877" />
      </mesh>

      {/* --- BUILDINGS IN ORGANIC LAYOUT --- */}

      {/* Agility - Tucked in a corner with bushes */}
      <group position={[-16, 0, -14]} rotation={[0, 0.8, 0]}>
        <AgilityFacility onSignClick={() => triggerNavigation('agility')} />
        {/* Environment Blending */}
        <Bush position={[-6, 0, -5]} scale={1.2} />
        <Bush position={[6, 0, -4]} scale={0.8} />
      </group>

      {/* Vet Clinic - Street side feel */}
      <group position={[-18, 0, 10]} rotation={[0, -0.3, 0]}>
        <VetClinic onSignClick={() => triggerNavigation('vet')} />
        <Bush position={[0, 0, -6]} scale={1} />
      </group>

      {/* Play Pavilion - Open area */}
      <group position={[14, 0, -18]} rotation={[0, -2.4, 0]}>
        <PlayPavilion onSignClick={() => triggerNavigation('play')} />
        <Bush position={[-5, 0, 5]} scale={1.1} />
      </group>

      {/* Rest Shelter - Shady spot under trees */}
      <group position={[16, 0, 14]} rotation={[0, 3.8, 0]}>
        <RestShelter onSignClick={() => triggerNavigation('rest')} />
        <Tree position={[-5, 0, -5]} scale={0.9} />
        <Bush position={[5, 0, 0]} scale={0.8} />
      </group>

      {/* Central Hub - Facing the entrance */}
      <ParkHubBuilding position={[0, 0, -7.5]} rotation={[0, 0, 0]} onSignClick={() => triggerNavigation('center')} />

      {/* --- DECORATIVE NATURE --- */}
      {scenery.trees.map((t, i) => <Tree key={`t-${i}`} position={t.pos} scale={t.scale} rotation={t.rot} lean={t.lean} />)}
      {scenery.bushes.map((b, i) => <Bush key={`b-${i}`} position={b.pos} scale={b.scale} rotation={b.rot} />)}

      <NavigationGuide navigationState={state.navigationState} currentPosition={currentPetPosition} />

      {/* --- ATMOSPHERE --- */}
      <Float speed={1.5} floatIntensity={0.3}>
        <group position={[0, 3, 0]}>
          {Array.from({ length: 30 }).map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 25, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 25]}>
              <sphereGeometry args={[0.02, 4, 4]} />
              <meshBasicMaterial color="#fff" transparent opacity={0.25} />
            </mesh>
          ))}
        </group>
      </Float>
    </>
  );
}
