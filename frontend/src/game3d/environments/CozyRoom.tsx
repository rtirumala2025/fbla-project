import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeWoodTexture } from '../core/AssetLoader';

export function CozyRoom() {
  const woodTex = useMemo(() => {
    const t = makeWoodTexture();
    t.repeat.set(3.5, 3.5);
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial map={woodTex} roughness={0.8} />
      </mesh>

      <mesh position={[0, 2.5, -7]} receiveShadow>
        <boxGeometry args={[18, 6, 0.4]} />
        <meshStandardMaterial color="#efe5d8" roughness={0.95} />
      </mesh>

      <mesh position={[-8.8, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[14, 6, 0.4]} />
        <meshStandardMaterial color="#efe5d8" roughness={0.95} />
      </mesh>

      <mesh position={[0, 0.25, 3.5]} castShadow receiveShadow>
        <boxGeometry args={[6.5, 0.5, 2.2]} />
        <meshStandardMaterial color="#bda58b" roughness={0.8} />
      </mesh>

      <pointLight ref={lampRef} position={[2.5, 3.8, 1.5]} color="#ffd7a1" intensity={25} distance={12} />
      <mesh position={[2.5, 3.3, 1.5]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial emissive="#ffd7a1" emissiveIntensity={2.5} color="#fff1dd" />
      </mesh>

      <mesh position={[-3.8, 0.9, 2.6]} castShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.12, 18]} />
        <meshStandardMaterial color="#d6c2a8" roughness={0.75} />
      </mesh>
      <mesh position={[-3.8, 1.1, 2.6]} castShadow>
        <torusGeometry args={[0.28, 0.08, 12, 24]} />
        <meshStandardMaterial color="#caa27a" roughness={0.55} />
      </mesh>
    </group>
  );
}
