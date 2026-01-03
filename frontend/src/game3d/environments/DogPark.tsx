import React, { useMemo, useRef } from 'react';
import { Sky, Cloud, Float, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeGrassTexture, makeWoodTexture, createCanvasTexture } from '../core/AssetLoader';
import { AgilityFacility } from '../props/AgilityFacility';
import { VetClinic } from '../props/VetClinic';
import { PlayPavilion } from '../props/PlayPavilion';
import { RestShelter } from '../props/RestShelter';
import { Bench } from '../props/Bench';
import { LampPost } from '../props/LampPost';
import { ParkHubBuilding } from '../props/ParkHubBuilding';
import { NavigationGuide } from '../ui/NavigationGuide';
import type { PetGame2State, ActivityZone } from '../core/SceneManager';

// --- Assets & Helpers ---

function makeGravelTexture() {
  return createCanvasTexture({
    size: 512,
    paint: (ctx, size) => {
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(0, 0, size, size);
      for (let i = 0; i < 15000; i++) {
        const shade = Math.random() > 0.5 ? 60 : 120;
        ctx.fillStyle = `rgba(${shade},${shade},${shade},0.3)`;
        const s = 1 + Math.random() * 2;
        ctx.fillRect(Math.random() * size, Math.random() * size, s, s);
      }
    }
  });
}

function distToSegment(p: { x: number, z: number }, v: { x: number, z: number }, w: { x: number, z: number }) {
  const l2 = (w.x - v.x) ** 2 + (w.z - v.z) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.z - v.z);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.z - v.z) * (w.z - v.z)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.z - (v.z + t * (w.z - v.z)));
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
  const foliageColors = ['#3a5e2a', '#5d9646', '#85bf66', '#b0e090'];
  return (
    <group ref={groupRef} position={position} scale={scale} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.8 * scale, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15 * scale, 0.25 * scale, 1.6 * scale, 8]} />
        <meshStandardMaterial color="#5e5044" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.2 * scale, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.9 * scale, 0]} />
        <meshStandardMaterial color={foliageColors[1]} roughness={0.8} />
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

function Rock({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <mesh position={position} scale={scale} rotation={[Math.random() * 0.5, rotation, Math.random() * 0.5]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.4, 1]} />
      <meshStandardMaterial color="#7a7a7a" roughness={0.9} />
    </mesh>
  );
}

function Fence({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const woodTex = useMemo(() => makeWoodTexture(), []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial map={woodTex} color="#8a6e56" roughness={0.9} />
      </mesh>
      <mesh position={[1.2, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.08, 0.05]} />
        <meshStandardMaterial map={woodTex} color="#8a6e56" roughness={0.9} />
      </mesh>
      <mesh position={[1.2, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.08, 0.05]} />
        <meshStandardMaterial map={woodTex} color="#8a6e56" roughness={0.9} />
      </mesh>
    </group>
  );
}

function FenceCorner({ position }: { position: [number, number, number] }) {
  const woodTex = useMemo(() => makeWoodTexture(), []);
  return (
    <mesh position={[position[0], 0.6, position[2]]} castShadow receiveShadow>
      <boxGeometry args={[0.2, 1.3, 0.2]} />
      <meshStandardMaterial map={woodTex} color="#8a6e56" roughness={0.9} />
    </mesh>
  );
}

const forestTrails = [
  { start: { x: 0, z: -8 }, end: { x: 0, z: -20 }, width: 3 },
  { start: { x: 8, z: 0 }, end: { x: 20, z: 0 }, width: 3 },
  { start: { x: -8, z: 0 }, end: { x: -20, z: 0 }, width: 3 }
];

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
    t.repeat.set(24, 24);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  const gravelTex = useMemo(() => {
    const t = makeGravelTexture();
    t.repeat.set(8, 8);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  const scenery = useMemo(() => {
    const trees: { pos: [number, number, number]; scale: number; rot: number; lean: [number, number] }[] = [];
    const bushes: any[] = [];
    const rocks: any[] = [];
    const fenceSegments: { pos: [number, number, number]; rot: number }[] = [];
    const fenceCorners: any[] = [];
    const fenceW = 8;
    const fenceD = 10;

    for (let i = 0; i < 70; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 20;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (Math.abs(x) < fenceW + 2 && Math.abs(z) < fenceD + 2) continue;
      trees.push({ pos: [x, 0, z] as [number, number, number], scale: 0.8 + Math.random() * 0.8, rot: Math.random() * Math.PI, lean: [(Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2] as [number, number] });
    }

    // Tighter Fence Layout
    for (let x = -fenceW; x < fenceW; x += 2.45) {
      if (Math.abs(x) < 2.0) continue;
      fenceSegments.push({ pos: [x, 0, -fenceD] as [number, number, number], rot: 0 });
      fenceSegments.push({ pos: [x, 0, fenceD] as [number, number, number], rot: 0 });
    }
    for (let z = -fenceD; z < fenceD; z += 2.45) {
      if (Math.abs(z) < 2.0) continue;
      fenceSegments.push({ pos: [-fenceW, 0, z] as [number, number, number], rot: Math.PI / 2 });
      fenceSegments.push({ pos: [fenceW, 0, z] as [number, number, number], rot: Math.PI / 2 });
    }

    return { trees, bushes, rocks, fenceSegments, fenceCorners };
  }, []);

  return (
    <>
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 30, 80]} />

      <group position={[0, 25, -10]}>
        <Cloud opacity={0.8} speed={0.1} segments={40} bounds={[40, 5, 40]} volume={15} color="#ffffff" />
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial map={grassTex} color="#98c48a" />
      </mesh>

      {/* Tighter Ground Pads (+/- 16) */}
      <mesh position={[-16, 0.02, -16]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial map={gravelTex} color="#6e5a4e" transparent opacity={0.6} />
      </mesh>
      <mesh position={[-16, 0.02, 16]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#d0d5dd" />
      </mesh>
      <mesh position={[16, 0.02, -16]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#98c48a" />
      </mesh>
      <mesh position={[16, 0.02, 16]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial map={gravelTex} color="#8a7561" transparent opacity={0.4} />
      </mesh>

      {/* Main Path Hub */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 50]} />
        <meshStandardMaterial map={gravelTex} color="#8a7561" />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 4]} />
        <meshStandardMaterial map={gravelTex} color="#8a7561" />
      </mesh>
      <mesh position={[0, 0.031, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5, 32]} />
        <meshStandardMaterial map={gravelTex} color="#8a7561" />
      </mesh>

      {/* Activity Buildings at +/- 16 */}
      <AgilityFacility position={[-16, 0, -16]} rotation={[0, Math.PI / 4, 0]} onSignClick={() => triggerNavigation('agility')} />
      <VetClinic position={[-16, 0, 16]} rotation={[0, -Math.PI / 4, 0]} onSignClick={() => triggerNavigation('vet')} />
      <PlayPavilion position={[16, 0, -16]} rotation={[0, -Math.PI * 0.75, 0]} onSignClick={() => triggerNavigation('play')} />
      <RestShelter position={[16, 0, 16]} rotation={[0, 1.25 * Math.PI, 0]} onSignClick={() => triggerNavigation('rest')} />

      {/* Rescaled Hub at center */}
      <ParkHubBuilding position={[0, 0, -4.5]} onSignClick={() => triggerNavigation('center')} />

      {/* Scenery */}
      {scenery.trees.map((t, i) => <Tree key={i} position={t.pos} scale={t.scale} />)}
      {scenery.fenceSegments.map((f, i) => <Fence key={i} position={f.pos} rotation={f.rot} />)}

      <NavigationGuide navigationState={state.navigationState} currentPosition={currentPetPosition} />

      <Float speed={1} floatIntensity={0.5}>
        <group position={[0, 2, 0]}>
          {Array.from({ length: 20 }).map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 15]}>
              <sphereGeometry args={[0.02, 4, 4]} />
              <meshBasicMaterial color="#fff" transparent opacity={0.2} />
            </mesh>
          ))}
        </group>
      </Float>
    </>
  );
}
