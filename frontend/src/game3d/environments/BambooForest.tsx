import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeForestFloorTexture } from '../core/AssetLoader';

function Bamboo({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() * 0.001;
    groupRef.current.rotation.z = Math.sin(t + position[0] * 0.6 + position[2] * 0.3) * 0.03;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.07, 0.09, 4.6, 10]} />
        <meshStandardMaterial color="#3c8a52" roughness={0.8} />
      </mesh>
      <mesh position={[0.06, 1.6, 0]} castShadow>
        <boxGeometry args={[0.22, 0.06, 0.22]} />
        <meshStandardMaterial color="#2f6f41" roughness={0.85} />
      </mesh>
      <mesh position={[-0.05, 0.2, 0]} castShadow>
        <boxGeometry args={[0.22, 0.06, 0.22]} />
        <meshStandardMaterial color="#2f6f41" roughness={0.85} />
      </mesh>
    </group>
  );
}

export function BambooForest() {
  const floorTex = useMemo(() => {
    const t = makeForestFloorTexture();
    t.repeat.set(3, 3);
    return t;
  }, []);

  const hazeRef = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>>(null);

  useFrame(() => {
    if (!hazeRef.current) return;
    const t = performance.now() * 0.0005;
    hazeRef.current.material.opacity = 0.08 + Math.sin(t) * 0.01;
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial map={floorTex} roughness={1} />
      </mesh>

      <mesh ref={hazeRef} position={[0, 2.2, -6]}>
        <sphereGeometry args={[14, 18, 18]} />
        <meshStandardMaterial color="#d7f3df" transparent opacity={0.08} roughness={1} />
      </mesh>

      <Bamboo position={[3.2, 2.3, -3.2]} />
      <Bamboo position={[-3.4, 2.3, -3.8]} />
      <Bamboo position={[5.5, 2.3, -1.4]} />
      <Bamboo position={[-5.6, 2.3, -1.1]} />
      <Bamboo position={[1.2, 2.3, -5.7]} />
      <Bamboo position={[-1.4, 2.3, -5.4]} />

      <mesh position={[0, 0.2, 3.2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 1.0, 0.4, 18]} />
        <meshStandardMaterial color="#3a5f3b" roughness={0.95} />
      </mesh>
    </group>
  );
}
