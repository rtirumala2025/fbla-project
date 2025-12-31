import React, { useMemo, useRef } from 'react';
import { Sky } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeGrassTexture } from '../core/AssetLoader';

function Tree({ position }: { position: [number, number, number] }) {
  const topRef = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (!topRef.current) return;
    topRef.current.rotation.z = Math.sin(performance.now() * 0.001 + position[0]) * 0.06;
    topRef.current.rotation.x = Math.sin(performance.now() * 0.0008 + position[2]) * 0.04;
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 1.4, 10]} />
        <meshStandardMaterial color="#5b3b2b" roughness={0.9} />
      </mesh>
      <mesh ref={topRef} position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.65, 18, 18]} />
        <meshStandardMaterial color="#2f7d3a" roughness={0.85} />
      </mesh>
      <mesh position={[0.25, 1.35, -0.1]} castShadow>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial color="#2c6e35" roughness={0.9} />
      </mesh>
    </group>
  );
}

export function DogPark() {
  const grassTex = useMemo(() => makeGrassTexture(), []);

  return (
    <group>
      <Sky sunPosition={[6, 9, 4]} turbidity={6} rayleigh={1.6} mieCoefficient={0.015} mieDirectionalG={0.8} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60, 1, 1]} />
        <meshStandardMaterial map={grassTex} roughness={1} metalness={0} />
      </mesh>

      <mesh position={[0, 0.01, -6]} receiveShadow>
        <boxGeometry args={[10, 0.25, 2]} />
        <meshStandardMaterial color="#cbb7a0" roughness={0.9} />
      </mesh>

      <Tree position={[3.5, 0, -4.5]} />
      <Tree position={[-4.2, 0, -3.8]} />
      <Tree position={[5.8, 0, -1.2]} />
      <Tree position={[-6.0, 0, -1.5]} />
    </group>
  );
}
