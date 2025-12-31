import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PetGame2State } from '../core/SceneManager';
import { breathe, subtleNod } from '../animations/idle';
import { pop, wobble } from '../animations/interact';

export function CatModel({ state, onPetTap }: { state: PetGame2State; onPetTap: () => void }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Mesh>(null);
  const earR = useRef<THREE.Mesh>(null);
  const tail = useRef<THREE.Group>(null);

  const fur = useMemo(() => new THREE.Color('#cfc6b8'), []);
  const stripe = useMemo(() => new THREE.Color('#8a7f70'), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (root.current) {
      const b = breathe(t, 1.7);
      root.current.position.y = 0.02 + b * 0.035;
    }

    if (head.current) {
      const n = subtleNod(t, 1.25);
      head.current.rotation.x = n * 0.06;
      head.current.rotation.y = Math.sin(t * 0.45) * 0.22;
    }

    if (tail.current) {
      tail.current.rotation.y = Math.sin(t * 2.2) * 0.25;
      tail.current.rotation.x = Math.sin(t * 1.6) * 0.08;
    }

    if (earL.current && earR.current) {
      const twitch = Math.max(0, Math.sin(t * 6.5) - 0.85) * 0.25;
      earL.current.rotation.z = 0.25 + twitch;
      earR.current.rotation.z = -0.25 - twitch;
    }

    if (state.interaction.kind !== 'idle') {
      const startedAt = state.interaction.startedAt;
      const localT = Math.min(1, (performance.now() - startedAt) / 420);
      const s = 1 + pop(localT) * 0.05;
      if (root.current) root.current.scale.setScalar(s);
      if (root.current) root.current.rotation.z = wobble(localT) * 0.06;
    } else {
      if (root.current) {
        root.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        root.current.rotation.z *= 0.85;
      }
    }
  });

  return (
    <group ref={root} onPointerDown={(e) => {
      e.stopPropagation();
      onPetTap();
    }}>
      <mesh position={[0, 0.33, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.5, 8, 16]} />
        <meshStandardMaterial color={fur} roughness={0.75} />
      </mesh>

      <mesh position={[0, 0.38, 0.02]} castShadow>
        <boxGeometry args={[0.22, 0.12, 0.65]} />
        <meshStandardMaterial color={stripe} roughness={0.85} />
      </mesh>

      <group ref={head} position={[0, 0.78, 0.2]}>
        <mesh castShadow>
          <sphereGeometry args={[0.23, 18, 18]} />
          <meshStandardMaterial color={fur} roughness={0.7} />
        </mesh>
        <mesh ref={earL} position={[0.16, 0.2, 0]} rotation={[0, 0, 0.25]} castShadow>
          <coneGeometry args={[0.08, 0.16, 10]} />
          <meshStandardMaterial color={stripe} roughness={0.85} />
        </mesh>
        <mesh ref={earR} position={[-0.16, 0.2, 0]} rotation={[0, 0, -0.25]} castShadow>
          <coneGeometry args={[0.08, 0.16, 10]} />
          <meshStandardMaterial color={stripe} roughness={0.85} />
        </mesh>
        <mesh position={[0.11, 0.05, 0.14]} castShadow>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#111111" roughness={0.3} />
        </mesh>
        <mesh position={[-0.11, 0.05, 0.14]} castShadow>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#111111" roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.06, 0.17]} castShadow>
          <coneGeometry args={[0.04, 0.07, 10]} />
          <meshStandardMaterial color="#b8736d" roughness={0.8} />
        </mesh>
      </group>

      <mesh position={[0.16, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.055, 0.18, 6, 12]} />
        <meshStandardMaterial color={stripe} roughness={0.85} />
      </mesh>
      <mesh position={[-0.16, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.055, 0.18, 6, 12]} />
        <meshStandardMaterial color={stripe} roughness={0.85} />
      </mesh>
      <mesh position={[0.16, 0.1, -0.16]} castShadow>
        <capsuleGeometry args={[0.055, 0.18, 6, 12]} />
        <meshStandardMaterial color={stripe} roughness={0.85} />
      </mesh>
      <mesh position={[-0.16, 0.1, -0.16]} castShadow>
        <capsuleGeometry args={[0.055, 0.18, 6, 12]} />
        <meshStandardMaterial color={stripe} roughness={0.85} />
      </mesh>

      <group ref={tail} position={[0, 0.46, -0.32]}>
        <mesh rotation={[0.45, 0, 0]} castShadow>
          <capsuleGeometry args={[0.035, 0.4, 6, 12]} />
          <meshStandardMaterial color={stripe} roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}
