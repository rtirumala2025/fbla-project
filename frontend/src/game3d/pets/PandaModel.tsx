import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PetGame2State } from '../core/SceneManager';
import { breathe } from '../animations/idle';
import { pop, wobble } from '../animations/interact';

export function PandaModel({ state, onPetTap }: { state: PetGame2State; onPetTap: () => void }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  const white = useMemo(() => new THREE.Color('#f2f2f2'), []);
  const black = useMemo(() => new THREE.Color('#1b1b1b'), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (root.current) {
      const b = breathe(t, 1.3);
      root.current.position.y = 0.02 + b * 0.05;
      root.current.rotation.y = Math.sin(t * 0.35) * 0.08;
    }

    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.3) * 0.18;
      head.current.rotation.x = Math.sin(t * 0.25) * 0.06;
    }

    if (state.interaction.kind !== 'idle') {
      const startedAt = state.interaction.startedAt;
      const localT = Math.min(1, (performance.now() - startedAt) / 520);
      const s = 1 + pop(localT) * 0.055;
      if (root.current) root.current.scale.setScalar(s);
      if (root.current) root.current.rotation.z = wobble(localT) * 0.05;
    } else {
      if (root.current) {
        // Hover state: slightly larger scale
        const targetScale = isHovered ? 1.03 : 1.0;
        root.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        root.current.rotation.z *= 0.85;
      }
    }
  });

  return (
    <group
      ref={root}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setIsHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setIsHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPetTap();
      }}
    >
      <mesh position={[0, 0.33, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.55, 8, 16]} />
        <meshStandardMaterial color={white} roughness={0.65} />
      </mesh>

      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={black} roughness={0.7} />
      </mesh>

      <group ref={head} position={[0, 0.82, 0.2]}>
        <mesh castShadow>
          <sphereGeometry args={[0.27, 18, 18]} />
          <meshStandardMaterial color={white} roughness={0.6} />
        </mesh>

        <mesh position={[0.14, 0.06, 0.14]} castShadow>
          <sphereGeometry args={[0.06, 14, 14]} />
          <meshStandardMaterial color={black} roughness={0.7} />
        </mesh>
        <mesh position={[-0.14, 0.06, 0.14]} castShadow>
          <sphereGeometry args={[0.06, 14, 14]} />
          <meshStandardMaterial color={black} roughness={0.7} />
        </mesh>

        <mesh position={[0.14, 0.08, 0.18]} castShadow>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#0d0d0d" roughness={0.3} />
        </mesh>
        <mesh position={[-0.14, 0.08, 0.18]} castShadow>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#0d0d0d" roughness={0.3} />
        </mesh>

        <mesh position={[0, -0.03, 0.2]} castShadow>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color={black} roughness={0.6} />
        </mesh>

        <mesh position={[0.16, 0.22, 0]} castShadow>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshStandardMaterial color={black} roughness={0.8} />
        </mesh>
        <mesh position={[-0.16, 0.22, 0]} castShadow>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshStandardMaterial color={black} roughness={0.8} />
        </mesh>
      </group>

      <mesh position={[0.2, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={black} roughness={0.8} />
      </mesh>
      <mesh position={[-0.2, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={black} roughness={0.8} />
      </mesh>
      <mesh position={[0.2, 0.1, -0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={black} roughness={0.8} />
      </mesh>
      <mesh position={[-0.2, 0.1, -0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={black} roughness={0.8} />
      </mesh>
    </group>
  );
}
