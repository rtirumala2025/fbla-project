import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { Sky, Instance, Instances, Clone, Cloud, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeGrassTexture } from '../core/AssetLoader';

// --- Assets & Helpers ---

// Simple cloud-like foliage geometry for trees
const foliageGeo = new THREE.SphereGeometry(1, 12, 12);
const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 1, 8);

function Tree({ position, scale = 1, rotation = 0, lean = [0, 0] }: { position: [number, number, number]; scale?: number; rotation?: number, lean?: [number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  // Subtle wind sway
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Trees sway slightly differently based on position
    const sway = Math.sin(t * 0.8 + position[0]) * 0.015;
    groupRef.current.rotation.z = lean[0] + sway;
    groupRef.current.rotation.x = lean[1] + Math.cos(t * 0.6 + position[2]) * 0.01;
  });

  // Unique tree characteristics

  const foliageColors = useMemo(() => {
    // Photorealistic foliage tones: mix of deep green and lighter tips
    return [
      '#2d4c1e', // Deep shadow
      '#4a7a36', // Mid
      '#6b9c52', // High
      '#8fbc72', // Tips
    ];
  }, []);

  return (
    <group ref={groupRef} position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Trunk - Detailed Grey/Brown Bark */}
      <mesh position={[0, 0.8 * scale, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15 * scale, 0.25 * scale, 1.6 * scale, 12]} />
        <meshStandardMaterial color="#5e5044" roughness={0.9} />
      </mesh>

      {/* Branches implied by foliage positioning */}

      {/* Foliage Clouds - Irregular shapes */}
      {/* 1. Main Crown */}
      <mesh position={[0, 2.2 * scale, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.9 * scale, 0]} />
        <meshStandardMaterial color={foliageColors[1]} roughness={0.8} />
      </mesh>
      {/* 2. Side Lobes */}
      <mesh position={[0.6 * scale, 1.8 * scale, 0.2 * scale]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.6 * scale, 0]} />
        <meshStandardMaterial color={foliageColors[2]} roughness={0.8} />
      </mesh>
      <mesh position={[-0.5 * scale, 1.9 * scale, 0.4 * scale]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.55 * scale, 0]} />
        <meshStandardMaterial color={foliageColors[0]} roughness={0.8} />
      </mesh>
      <mesh position={[-0.2 * scale, 2.6 * scale, -0.3 * scale]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.5 * scale, 0]} />
        <meshStandardMaterial color={foliageColors[3]} roughness={0.8} />
      </mesh>
    </group>
  );
}

export function DogPark() {
  const grassTex = useMemo(() => {
    const t = makeGrassTexture();
    t.repeat.set(12, 12); // High frequency detail
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  return (
    <group>
      {/* --- ATMOSPHERE --- */}
      <Sky
        sunPosition={[5, 10, 5]}
        turbidity={8}
        rayleigh={1.2}
        mieCoefficient={0.005} // Clearer day
        mieDirectionalG={0.8}
      />

      {/* Distant Clouds */}
      <group position={[0, 15, -20]}>
        <Cloud opacity={0.5} speed={0.2} segments={10} />
      </group>

      {/* --- TERRAIN --- */}

      {/* Main Grass Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60, 128, 128]} />
        <meshStandardMaterial
          map={grassTex}
          roughness={1.0}
          roughnessMap={grassTex} // Grass is rough
          metalness={0}
          color="#809c7a" // Base tint
        />
      </mesh>

      {/* Dirt Path - Curving */}
      <mesh position={[0, 0.02, -5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {/* Simple strip for now, in a real engine we'd use splat maps */}
        <planeGeometry args={[8, 2.5]} />
        <meshStandardMaterial color="#8a7561" roughness={0.95} />
      </mesh>

      {/* Dirt Patches (Procedural placement manually) */}
      {[
        [-2.5, 0, 1.5, 0.8],
        [3.2, 0, 0.8, 0.6],
        [1.2, 0, -2.5, 0.7],
        [-4.0, 0, -1.0, 0.9]
      ].map((patch, i) => (
        <mesh key={i} position={[patch[0], 0.03, patch[2]]} rotation={[-Math.PI / 2, 0, Math.random()]} receiveShadow>
          <circleGeometry args={[patch[3], 16]} />
          <meshStandardMaterial color="#6b5a42" roughness={1.0} opacity={0.8} transparent />
        </mesh>
      ))}


      {/* --- VEGETATION --- */}

      <Tree position={[3.5, 0, -4.5]} scale={1.2} rotation={0.3} />
      <Tree position={[-4.2, 0, -3.8]} scale={1.0} rotation={-0.5} />
      <Tree position={[6.5, 0, -1.5]} scale={1.4} rotation={1.2} />
      <Tree position={[-6.8, 0, -0.5]} scale={1.3} rotation={-1.0} />
      <Tree position={[1.5, 0, -8.5]} scale={1.1} rotation={0.8} />

      {/* --- PROPS --- */}

      {/* Metal Water Bowl - Photorealistic Stainless Steel */}
      <group position={[2.2, 0, -3.5]}>
        {/* Bowl */}
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.25, 0.16, 32]} />
          <meshStandardMaterial
            color="#b0b0b0"
            roughness={0.25} // Brushed metal
            metalness={0.85}
          />
        </mesh>
        {/* Interior Water */}
        <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.26, 32]} />
          <meshStandardMaterial
            color="#204060"
            roughness={0.05} // Water smoothness
            metalness={0.4}
            transparent opacity={0.8}
          />
        </mesh>
      </group>

      {/* Rubber Chew Toy - SSS effect simulation via color/roughness */}
      <mesh position={[-1.5, 0.06, -2]} rotation={[0.5, 2, 0.8]} castShadow receiveShadow>
        <torusKnotGeometry args={[0.12, 0.04, 64, 8, 2, 3]} />
        <meshStandardMaterial
          color="#ff5555" // Bright red rubber
          roughness={0.4} // Slightly glossy
          metalness={0.05}
          emissive="#ff0000"
          emissiveIntensity={0.1} // Fake SSS
        />
      </mesh>

      {/* Leash Post - Weathered Wood & Metal */}
      <group position={[4, 0, -2]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 12]} />
          <meshStandardMaterial color="#5d4037" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.82, 0.06]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[0.07, 0.015, 12, 12]} />
          <meshStandardMaterial color="#888" roughness={0.4} metalness={0.9} />
        </mesh>
      </group>

      {/* --- PARTICLES --- */}
      {/* Pollen / Dust Motes using Float for localized movement */}
      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[0, 1.5, 0]}>
          {Array.from({ length: 15 }).map((_, i) => (
            <mesh key={i} position={[
              (Math.random() - 0.5) * 8,
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 8
            ]}>
              <sphereGeometry args={[0.015, 4, 4]} />
              <meshBasicMaterial color="#fff" transparent opacity={0.4} />
            </mesh>
          ))}
        </group>
      </Float>

    </group>
  );
}
