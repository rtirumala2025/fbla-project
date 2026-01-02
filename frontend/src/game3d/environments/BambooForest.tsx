import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeForestFloorTexture } from '../core/AssetLoader';

function Bamboo({ position, variant = 0 }: { position: [number, number, number]; variant?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const phaseOffset = useMemo(() => Math.random() * Math.PI * 2, []);

  // Color variation based on variant
  const mainColor = useMemo(() => {
    const colors = ['#2d7a45', '#2a7342', '#307d48', '#2c7644'];
    return colors[variant % colors.length];
  }, [variant]);

  const jointColor = useMemo(() => {
    const colors = ['#236336', '#205e33', '#266639', '#245f35'];
    return colors[variant % colors.length];
  }, [variant]);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() * 0.001;
    const baseSway = Math.sin(t + position[0] * 0.6 + position[2] * 0.3 + phaseOffset) * 0.04;
    const windGust = Math.sin(t * 0.2 + phaseOffset) * 0.02;
    groupRef.current.rotation.z = baseSway + windGust;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Main bamboo stalk - Waxy surface with directional gloss */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.08, 0.1, 5.5, 12]} />
        <meshStandardMaterial
          color={mainColor}
          roughness={0.64}
          metalness={0.04}
        />
      </mesh>
      {/* Joint segments - More fibrous, matte finish */}
      <mesh position={[0.07, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 0.08, 0.25]} />
        <meshStandardMaterial color={jointColor} roughness={0.84} metalness={0.01} />
      </mesh>
      <mesh position={[-0.06, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 0.08, 0.25]} />
        <meshStandardMaterial color={jointColor} roughness={0.84} metalness={0.01} />
      </mesh>
      {/* Leaves - Soft matte finish */}
      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[0.3, 0.6, 8]} />
        <meshStandardMaterial
          color="#3f9c5a"
          roughness={0.82}
          metalness={0.01}
        />
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
    // Enhanced fog with better opacity control
    hazeRef.current.material.opacity = 0.15 + Math.sin(t) * 0.025;

    if (lightGlowRef.current) {
      lightGlowRef.current.intensity = 0.5 + Math.sin(t * 1.5) * 0.12;
    }
  });

  return (
    <group>
      {/* Floor - Brightened to avoid black void effect with texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial
          map={floorTex}
          color="#a8cba8"
          roughness={0.96}
          metalness={0}
        />
      </mesh>

      {/* Moss scatter patches - Lighter for visibility */}
      <mesh position={[-1.5, 0.01, 1.2]} rotation={[-Math.PI / 2, 0, 0.3]} receiveShadow>
        <circleGeometry args={[0.6, 16]} />
        <meshStandardMaterial color="#3a6040" roughness={0.96} metalness={0} />
      </mesh>
      <mesh position={[2.2, 0.01, 0.8]} rotation={[-Math.PI / 2, 0, -0.5]} receiveShadow>
        <circleGeometry args={[0.5, 16]} />
        <meshStandardMaterial color="#36603d" roughness={0.96} metalness={0} />
      </mesh>
      <mesh position={[0.8, 0.01, -1.5]} rotation={[-Math.PI / 2, 0, 0.8]} receiveShadow>
        <circleGeometry args={[0.7, 16]} />
        <meshStandardMaterial color="#3c6442" roughness={0.96} metalness={0} />
      </mesh>

      {/* AAA Atmospheric haze - Subtle green tint for depth */}
      <mesh ref={hazeRef} position={[0, 2.8, -7]}>
        <sphereGeometry args={[16, 20, 20]} />
        <meshStandardMaterial
          color="#b8e8c8"
          transparent
          opacity={0.12}
          roughness={1}
          metalness={0}
          depthWrite={false}
        />
      </mesh>

      {/* Bamboo forest - varied placement with color variation */}
      <Bamboo position={[3.5, 2.75, -3.5]} variant={0} />
      <Bamboo position={[-3.8, 2.75, -4.2]} variant={1} />
      <Bamboo position={[5.8, 2.75, -1.6]} variant={2} />
      <Bamboo position={[-6.0, 2.75, -1.3]} variant={3} />
      <Bamboo position={[1.5, 2.75, -6.2]} variant={0} />
      <Bamboo position={[-1.8, 2.75, -5.8]} variant={1} />
      <Bamboo position={[2.2, 2.75, -8.5]} variant={2} />
      <Bamboo position={[-2.5, 2.75, -8.0]} variant={3} />
      <Bamboo position={[7.2, 2.75, -4.0]} variant={1} />
      <Bamboo position={[-7.5, 2.75, -4.5]} variant={2} />

      {/* Foreground bamboo for depth (closer, larger) */}
      <group scale={1.3}>
        <Bamboo position={[4.5, 2.75, 2.5]} variant={0} />
        <Bamboo position={[-4.2, 2.75, 2.8]} variant={1} />
      </group>

      {/* Additional background bamboo */}
      <Bamboo position={[0.5, 2.75, -10.5]} variant={3} />
      <Bamboo position={[-0.8, 2.75, -11.0]} variant={2} />

      {/* Foreground accent rock - Grounding element */}
      <mesh position={[0, 0.25, 3.5]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.1, 0.5, 20]} />
        <meshStandardMaterial color="#3d5f42" roughness={0.90} metalness={0.01} />
      </mesh>

      {/* Atmospheric glow for dappled light effect */}
      <pointLight ref={lightGlowRef} position={[0, 3, -5]} intensity={0.5} color="#d4ffde" distance={12} decay={2} />

      {/* Background depth layer - Distant bamboo silhouettes */}
      <mesh position={[0, 3, -12]} scale={[1.5, 1.5, 1]}>
        <planeGeometry args={[25, 8]} />
        <meshStandardMaterial color="#1a3a2a" transparent opacity={0.28} depthWrite={false} />
      </mesh>
    </group>
  );
}
