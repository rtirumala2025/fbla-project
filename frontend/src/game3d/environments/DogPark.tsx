import React, { useMemo, useRef } from 'react';
import { Sky } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeGrassTexture } from '../core/AssetLoader';

function Tree({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  const topRef = useRef<THREE.Mesh>(null);

  useFrame((_, dt) => {
    if (!topRef.current) return;
    topRef.current.rotation.z = Math.sin(performance.now() * 0.001 + position[0]) * 0.06;
    topRef.current.rotation.x = Math.sin(performance.now() * 0.0008 + position[2]) * 0.04;
  });

  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Enhanced trunk with bark detail */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.2, 1.4, 10]} />
        <meshStandardMaterial color="#5b3b2b" roughness={0.95} />
      </mesh>
      {/* Main foliage with color variation */}
      <mesh ref={topRef} position={[0, 1.55, 0]} castShadow>
        <sphereGeometry args={[0.65, 18, 18]} />
        <meshStandardMaterial
          color={scale > 1.1 ? "#2c7d38" : "#2f7d3a"}
          roughness={0.88}
        />
      </mesh>
      {/* Secondary foliage cluster */}
      <mesh position={[0.25, 1.35, -0.1]} castShadow>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial
          color={scale < 0.9 ? "#2a6b33" : "#2c6e35"}
          roughness={0.92}
        />
      </mesh>
    </group>
  );
}

export function DogPark() {
  const grassTex = useMemo(() => makeGrassTexture(), []);

  return (
    <group>
      {/* Enhanced sky with atmospheric depth */}
      <Sky
        sunPosition={[6, 9, 4]}
        turbidity={8}
        rayleigh={2.0}
        mieCoefficient={0.015}
        mieDirectionalG={0.8}
      />

      {/* Ground with enhanced grass texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60, 1, 1]} />
        <meshStandardMaterial
          map={grassTex}
          roughness={0.98}
          metalness={0}
          color="#4a8845"
        />
      </mesh>

      {/* Path with blended edges */}
      <mesh position={[0, 0.01, -6]} receiveShadow>
        <boxGeometry args={[10, 0.25, 2]} />
        <meshStandardMaterial color="#c5af93" roughness={0.95} />
      </mesh>

      {/* Randomized trees with varied scales and rotations */}
      <Tree position={[3.5, 0, -4.5]} scale={1.1} rotation={0.3} />
      <Tree position={[-4.2, 0, -3.8]} scale={0.9} rotation={-0.5} />
      <Tree position={[5.8, 0, -1.2]} scale={1.25} rotation={1.2} />
      <Tree position={[-6.0, 0, -1.5]} scale={0.85} rotation={-1.0} />
      <Tree position={[2.2, 0, -7.5]} scale={1.05} rotation={0.8} />
      <Tree position={[-3.0, 0, -6.8]} scale={0.95} rotation={-0.3} />
      <Tree position={[7.5, 0, -5.0]} scale={1.15} rotation={1.5} />
    </group>
  );
}
