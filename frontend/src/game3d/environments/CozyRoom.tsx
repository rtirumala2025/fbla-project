import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeWoodTexture } from '../core/AssetLoader';

export function CozyRoom() {
  const woodTex = useMemo(() => {
    const t = makeWoodTexture();
    t.repeat.set(8.0, 8.0); // AAA: Proper scale for wood planks
    return t;
  }, []);

  const lampRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!lampRef.current) return;
    const flicker = 1 + Math.sin(performance.now() * 0.0025) * 0.03 + Math.sin(performance.now() * 0.008) * 0.015;
    lampRef.current.intensity = 25 * flicker;
  });

  return (
    <group>
      {/* Floor - AAA wood with glossy varnish finish */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          map={woodTex}
          roughness={0.62}
          metalness={0.02}
          color="#8b7055"
        />
      </mesh>

      {/* Back wall - Subtle matte paint with light falloff */}
      <mesh position={[0, 2.5, -7]} receiveShadow>
        <boxGeometry args={[18, 6, 0.4]} />
        <meshStandardMaterial
          color="#f8f0e6"
          roughness={0.96}
          metalness={0}
        />
      </mesh>

      {/* Side wall - Slightly cooler tone for depth */}
      <mesh position={[-8.8, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[14, 6, 0.4]} />
        <meshStandardMaterial
          color="#f5ebe2"
          roughness={0.96}
          metalness={0}
        />
      </mesh>

      {/* Furniture - Sofa/bench with wood material */}
      <mesh position={[0, 0.25, 3.5]} castShadow receiveShadow>
        <boxGeometry args={[6.5, 0.5, 2.2]} />
        <meshStandardMaterial color="#bda58b" roughness={0.72} metalness={0.01} />
      </mesh>

      {/* Warm point light with realistic decay and flicker */}
      <pointLight ref={lampRef} position={[2.5, 3.8, 1.5]} color="#ffd199" intensity={25} distance={12} decay={2} castShadow />
      <mesh position={[2.5, 3.3, 1.5]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          emissive="#ffd199"
          emissiveIntensity={3.2}
          color="#fff5e8"
          roughness={0.15}
          metalness={0.05}
        />
      </mesh>

      {/* Window fill light simulation */}
      <pointLight position={[-3, 3.5, 2]} color="#e8f0ff" intensity={8} distance={10} decay={2} />

      {/* Rug - Soft fabric texture under pet */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.8, 32]} />
        <meshStandardMaterial
          color="#a67c52"
          roughness={0.94}
          metalness={0}
        />
      </mesh>

      {/* Side table/stool with cylindrical form */}
      <mesh position={[-3.8, 0.9, 2.6]} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.12, 18]} />
        <meshStandardMaterial color="#d1b89d" roughness={0.68} metalness={0.02} />
      </mesh>
      {/* Decorative vase-like object */}
      <mesh position={[-3.8, 1.1, 2.6]} castShadow>
        <torusGeometry args={[0.28, 0.08, 12, 24]} />
        <meshStandardMaterial color="#c59e77" roughness={0.48} metalness={0.04} />
      </mesh>

      {/* --- LIVED-IN OBJECTS --- */}

      {/* Ceramic Food Bowl - Worn, off-center */}
      <group position={[2.8, 0, -2.5]} rotation={[0, 0.5, 0]}>
        <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.25, 0.22, 0.12, 24]} />
          <meshStandardMaterial color="#f0efe9" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Bowl interior recess */}
        <mesh position={[0, 0.121, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.2, 24]} />
          <meshStandardMaterial color="#e6e4dc" roughness={0.35} metalness={0.05} />
        </mesh>
        {/* Few kibbles left */}
        <mesh position={[0.05, 0.125, -0.05]} castShadow>
          <dodecahedronGeometry args={[0.03]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
        </mesh>
        <mesh position={[-0.08, 0.125, 0.02]} castShadow>
          <dodecahedronGeometry args={[0.03]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.8} />
        </mesh>
      </group>

      {/* Stainless Steel Water Bowl - Imperfect */}
      <group position={[3.6, 0, -2.2]}>
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.26, 0.26, 0.1, 32]} />
          <meshStandardMaterial color="#c0c0c0" roughness={0.15} metalness={0.85} />
        </mesh>
        {/* Water surface */}
        <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.24, 32]} />
          <meshStandardMaterial color="#224466" roughness={0.05} metalness={0.2} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Scratching Post - Visual Anchor */}
      <group position={[-4.5, 0, -2.5]} rotation={[0, -0.2, 0]}>
        {/* Base */}
        <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.08, 1.2]} />
          <meshStandardMaterial color="#8d7662" roughness={0.9} />
        </mesh>
        {/* Post */}
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.12, 0.12, 1.2, 16]} />
          <meshStandardMaterial color="#d2b48c" roughness={1.0} />
        </mesh>
        {/* Top platform */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.5, 0.5, 0.08, 20]} />
          <meshStandardMaterial color="#d2b48c" roughness={1.0} />
        </mesh>
      </group>

      {/* Abandoned Cloth Toy - Matte, light absorbing */}
      <mesh position={[1.5, 0.08, -3.5]} rotation={[0.5, 0.5, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.12]} />
        <meshStandardMaterial color="#d65a5a" roughness={1.0} metalness={0} />
      </mesh>

    </group>
  );
}
