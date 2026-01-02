import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeWoodTexture } from '../core/AssetLoader';

export function CozyRoom() {
  const woodTex = useMemo(() => {
    const t = makeWoodTexture();
    t.repeat.set(4.0, 4.0); // Reduced repeat for larger planks
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  return (
    <group>
      {/* --- ARCHITECTURE --- */}

      {/* Floor - Varied tone wood, wear implied by texture + roughness map simulation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial
          map={woodTex}
          roughness={0.7}        // Wood is generally matte/satin
          roughnessMap={woodTex} // Reuse color map as roughness map for "wear" variation (darker = smoother)
          metalness={0.0}
          color="#a08060"        // Base tint
        />
      </mesh>

      {/* Back Wall - Matte, imperfect paint */}
      <mesh position={[0, 3, -7]} receiveShadow>
        <boxGeometry args={[20, 8, 0.5]} />
        <meshStandardMaterial
          color="#e8e6e1"        // Off-white/Cream
          roughness={0.9}        // Matte
          metalness={0}
        />
      </mesh>

      {/* Side Wall */}
      <mesh position={[-9, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[16, 8, 0.5]} />
        <meshStandardMaterial
          color="#eae5dd"
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* Baseboards (Molding) - Adds realism */}
      <mesh position={[0, 0.25, -6.7]} receiveShadow>
        <boxGeometry args={[20, 0.5, 0.1]} />
        <meshStandardMaterial color="#fcfcfc" roughness={0.5} />
      </mesh>
      <mesh position={[-8.7, 0.25, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[16, 0.5, 0.1]} />
        <meshStandardMaterial color="#fcfcfc" roughness={0.5} />
      </mesh>


      {/* --- FURNITURE --- */}

      {/* Modern Sofa - Low, fabric */}
      <group position={[1.5, 0, 3.5]} rotation={[0, -0.1, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[7, 0.7, 2.5]} />
          <meshStandardMaterial color="#5e666e" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.0, -0.9]} castShadow receiveShadow>
          <boxGeometry args={[7, 0.8, 0.6]} />
          <meshStandardMaterial color="#586068" roughness={0.9} />
        </mesh>
      </group>

      {/* Rug - Anchors the center */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.5, 64]} />
        <meshStandardMaterial
          color="#7c8a99"
          roughness={1.0}
          metalness={0}
        />
      </mesh>

      {/* --- PROPS --- */}

      {/* Ceramic Food Bowl - Worn, slightly rotated */}
      <group position={[2.5, 0, -2.5]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.25, 0.16, 32]} />
          <meshStandardMaterial color="#f2f0eb" roughness={0.4} /> {/* Ceramic */}
        </mesh>
        {/* Interior */}
        <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.25, 32]} />
          <meshStandardMaterial color="#e8e4dc" roughness={0.5} />
        </mesh>
        {/* Kibble */}
        <group position={[0, 0.12, 0]}>
          <mesh position={[0.05, 0, 0.05]} castShadow><dodecahedronGeometry args={[0.04]} /><meshStandardMaterial color="#8b5a2b" /></mesh>
          <mesh position={[-0.08, 0, 0.02]} castShadow><dodecahedronGeometry args={[0.04]} /><meshStandardMaterial color="#8b5a2b" /></mesh>
          <mesh position={[0.02, 0, -0.07]} castShadow><dodecahedronGeometry args={[0.04]} /><meshStandardMaterial color="#8b5a2b" /></mesh>
        </group>
      </group>

      {/* Stainless Steel Water Bowl - Specular highlights */}
      <group position={[3.5, 0, -2.2]} rotation={[0, 0.2, 0]}>
        <mesh position={[0, 0.07, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.32, 0.3, 0.14, 48]} />
          <meshStandardMaterial
            color="#d0d0d0"
            roughness={0.15}
            metalness={0.9} // High metalness for stainless steel
          />
        </mesh>
        {/* Water Surface - Micro distortion implied by bump or just high gloss */}
        <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.28, 32]} />
          <meshStandardMaterial
            color="#1a3b5c"
            roughness={0.02}
            metalness={0.2}
            opacity={0.8}
            transparent
          />
        </mesh>
      </group>

      {/* Scratching Post - Fiber breakup */}
      <group position={[-4.0, 0, -2.0]} rotation={[0, -0.3, 0]}>
        {/* Base */}
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.1, 1.4]} />
          <meshStandardMaterial color="#c2b280" roughness={1.0} /> {/* Carpet base */}
        </mesh>
        {/* Post */}
        <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.15, 0.15, 1.4, 24]} />
          <meshStandardMaterial
            color="#e0cda8" // Sisal rope color
            roughness={0.9}
          // In a real app we'd load a normal map, here we simulate with color/roughness
          />
        </mesh>
        {/* Worn area near base */}
        <mesh position={[0, 0.3, 0.16]} rotation={[0.2, 0, 0]}>
          {/* Simple visual fluff mesh */}
          <sphereGeometry args={[0.08, 6, 6]} />
          <meshStandardMaterial color="#e8dec0" roughness={1} />
        </mesh>
      </group>

      {/* Fabric Toy - Soft, casual placement */}
      <group position={[1.2, 0.08, -3.2]} rotation={[0.4, 0.6, 0.2]}>
        <mesh castShadow receiveShadow>
          <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
          <meshStandardMaterial color="#ff6b6b" roughness={1.0} />
        </mesh>
      </group>

      {/* Accent Lamp (Non-flickering, off in day or subtle warm glow)
          User said "illuminated by a low-angle warm sun", so maybe lamp is off or very dim.
          I'll leave a physical lamp object but minimal emission.
       */}
      <group position={[-5, 0, 2]}>
        <mesh position={[0, 2.5, 0]} castShadow>
          <coneGeometry args={[0.6, 1.5, 32, 1, true]} />
          <meshStandardMaterial color="#f0f0f0" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.06, 2.5]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
    </group>
  );
}
