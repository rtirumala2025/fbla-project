import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeForestFloorTexture } from '../core/AssetLoader';

function Bamboo({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() * 0.001;
    const baseSway = Math.sin(t + position[0] * 0.6 + position[2] * 0.3 + phaseOffset) * 0.04;
    const windGust = Math.sin(t * 0.2 + phaseOffset) * 0.02;
    groupRef.current.rotation.z = baseSway + windGust;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.08, 0.1, 5.5, 12]} />
        <meshStandardMaterial color="#2d7a45" roughness={0.75} />
      </mesh>
      <mesh position={[0.07, 1.8, 0]} castShadow>
        <boxGeometry args={[0.25, 0.08, 0.25]} />
        <meshStandardMaterial color="#236336" roughness={0.85} />
      </mesh>
      <mesh position={[-0.06, 0.3, 0]} castShadow>
        <boxGeometry args={[0.25, 0.08, 0.25]} />
        <meshStandardMaterial color="#236336" roughness={0.85} />
      </mesh>
      {/* Leaves */}
      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[0.3, 0.6, 8]} />
        <meshStandardMaterial color="#3f9c5a" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function BambooForest() {
  const floorTex = useMemo(() => {
    const t = makeForestFloorTexture();
    t.repeat.set(4, 4);
    return t;
  }, []);

  const hazeRef = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>>(null);
  const lightGlowRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!hazeRef.current) return;
    const t = performance.now() * 0.0005;
    hazeRef.current.material.opacity = 0.12 + Math.sin(t) * 0.02;

    if (lightGlowRef.current) {
      lightGlowRef.current.intensity = 0.4 + Math.sin(t * 1.5) * 0.1;
    }
  });

  return (
    <group>
      {/* Enhanced floor with darker moss color */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial map={floorTex} color="#2a4a2e" roughness={0.95} />
      </mesh>

      {/* Atmospheric haze with green tint */}
      <mesh ref={hazeRef} position={[0, 2.8, -7]}>
        <sphereGeometry args={[16, 20, 20]} />
        <meshStandardMaterial color="#b8e6c9" transparent opacity={0.12} roughness={1} />
      </mesh>

      {/* Bamboo forest - more dramatic placement */}
      <Bamboo position={[3.5, 2.75, -3.5]} />
      <Bamboo position={[-3.8, 2.75, -4.2]} />
      <Bamboo position={[5.8, 2.75, -1.6]} />
      <Bamboo position={[-6.0, 2.75, -1.3]} />
      <Bamboo position={[1.5, 2.75, -6.2]} />
      <Bamboo position={[-1.8, 2.75, -5.8]} />
      <Bamboo position={[2.2, 2.75, -8.5]} />
      <Bamboo position={[-2.5, 2.75, -8.0]} />
      <Bamboo position={[7.2, 2.75, -4.0]} />
      <Bamboo position={[-7.5, 2.75, -4.5]} />

      {/* Foreground accent rock */}
      <mesh position={[0, 0.25, 3.5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.1, 0.5, 20]} />
        <meshStandardMaterial color="#3d5f42" roughness={0.92} />
      </mesh>

      {/* Subtle point light for depth */}
      <pointLight ref={lightGlowRef} position={[0, 3, -5]} intensity={0.4} color="#d4ffde" distance={12} />

      {/* Background depth layer - distant bamboo silhouettes */}
      <mesh position={[0, 3, -12]} scale={[1.5, 1.5, 1]}>
        <planeGeometry args={[25, 8]} />
        <meshStandardMaterial color="#1a3a2a" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
