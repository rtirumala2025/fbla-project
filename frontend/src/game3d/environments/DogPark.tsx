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

  // AAA Tree: Micro color variation per tree
  const trunkColor = useMemo(() => scale > 1.05 ? '#583526' : '#5b3b2b', [scale]);
  const foliageMain = useMemo(() => {
    const colors = ['#2c7d38', '#2f7d3a', '#2a7536', '#307e3c'];
    return colors[Math.floor(position[0] * 10) % colors.length];
  }, [position]);
  const foliageSecondary = useMemo(() => {
    const colors = ['#2a6b33', '#2c6e35', '#286934', '#2d7036'];
    return colors[Math.floor(position[2] * 10) % colors.length];
  }, [position]);

  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Trunk with bark roughness */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.2, 1.4, 10]} />
        <meshStandardMaterial color={trunkColor} roughness={0.96} metalness={0} />
      </mesh>
      {/* Main foliage cluster - AAA uses multiple spheres, not single blob */}
      <mesh ref={topRef} position={[0, 1.55, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.65, 18, 18]} />
        <meshStandardMaterial
          color={foliageMain}
          roughness={0.90}
          metalness={0}
        />
      </mesh>
      {/* Secondary foliage cluster */}
      <mesh position={[0.25, 1.35, -0.1]} castShadow receiveShadow>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial
          color={foliageSecondary}
          roughness={0.92}
          metalness={0}
        />
      </mesh>
      {/* Tertiary cluster for depth */}
      <mesh position={[-0.2, 1.45, 0.15]} castShadow receiveShadow>
        <sphereGeometry args={[0.35, 14, 14]} />
        <meshStandardMaterial
          color={foliageSecondary}
          roughness={0.94}
          metalness={0}
        />
      </mesh>
    </group>
  );
}

export function DogPark() {
  const grassTex = useMemo(() => makeGrassTexture(), []);

  return (
    <group>
      {/* AAA Sky: Precise atmospheric scattering */}
      <Sky
        sunPosition={[6, 9, 4]}
        turbidity={7}
        rayleigh={1.6}
        mieCoefficient={0.012}
        mieDirectionalG={0.82}
      />

      {/* Ground - Realistic grass color (desaturated green) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60, 1, 1]} />
        <meshStandardMaterial
          map={grassTex}
          roughness={0.94}
          metalness={0}
          color="#407a3c"
        />
      </mesh>

      {/* Path with worn texture variation */}
      <mesh position={[0, 0.01, -6]} receiveShadow>
        <boxGeometry args={[10, 0.25, 2]} />
        <meshStandardMaterial color="#c0a88f" roughness={0.92} metalness={0} />
      </mesh>

      {/* AAA Ground Detail: Dirt patches for realism */}
      <mesh position={[-2.5, 0.005, 1.5]} rotation={[-Math.PI / 2, 0, 0.3]} receiveShadow>
        <circleGeometry args={[0.8, 16]} />
        <meshStandardMaterial color="#6b5a42" roughness={0.88} metalness={0} />
      </mesh>
      <mesh position={[3.2, 0.005, 0.8]} rotation={[-Math.PI / 2, 0, -0.5]} receiveShadow>
        <circleGeometry args={[0.6, 16]} />
        <meshStandardMaterial color="#7a6650" roughness={0.88} metalness={0} />
      </mesh>
      <mesh position={[1.2, 0.005, -2.5]} rotation={[-Math.PI / 2, 0, 0.8]} receiveShadow>
        <circleGeometry args={[0.7, 16]} />
        <meshStandardMaterial color="#675540" roughness={0.88} metalness={0} />
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
