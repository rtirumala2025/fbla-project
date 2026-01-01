import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PetGame2State } from '../core/SceneManager';
import { breathe, subtleNod } from '../animations/idle';
import { pop, wobble } from '../animations/interact';

export function DogModel({ state, onPetTap }: { state: PetGame2State; onPetTap: () => void }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Enhanced color variation for realistic fur
  const baseColor = useMemo(() => new THREE.Color('#c7a074'), []);
  const baseColorVariant1 = useMemo(() => new THREE.Color('#d4ab81'), []);
  const baseColorVariant2 = useMemo(() => new THREE.Color('#ba9568'), []);
  const dark = useMemo(() => new THREE.Color('#6a4b35'), []);
  const darkVariant = useMemo(() => new THREE.Color('#5d4230'), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (root.current) {
      // Enhanced breathing with more pronounced chest expansion
      const b = breathe(t, 1.8);
      root.current.position.y = 0.02 + b * 0.06;
      root.current.scale.y = 1.0 + b * 0.02;
    }

    if (head.current) {
      const n = subtleNod(t, 1.4);
      head.current.rotation.x = n * 0.08;
      head.current.rotation.y = Math.sin(t * 0.6) * 0.12;
    }

    if (tail.current) {
      const wag = Math.sin(t * 8.0) * 0.45;
      tail.current.rotation.y = wag;
    }

    if (state.interaction.kind !== 'idle') {
      const startedAt = state.interaction.startedAt;
      const localT = Math.min(1, (performance.now() - startedAt) / 450);
      const s = 1 + pop(localT) * 0.06;
      if (root.current) root.current.scale.setScalar(s);
      if (root.current) root.current.rotation.z = wobble(localT) * 0.07;
    } else {
      if (root.current) {
        const targetScale = isHovered ? 1.03 : 1.0;
        root.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        root.current.rotation.z *= 0.85;
      }
    }
  });

  return (
    <group
      ref={root}
      position={[0, 0, 0]}
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
      {/* Body with color variation */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.55, 8, 16]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.68}
          metalness={0.05}
        />
      </mesh>

      <group ref={head} position={[0, 0.78, 0.22]}>
        {/* Head with subtle specular highlights */}
        <mesh castShadow>
          <sphereGeometry args={[0.25, 18, 18]} />
          <meshStandardMaterial
            color={baseColorVariant1}
            roughness={0.62}
            metalness={0.06}
          />
        </mesh>
        {/* Eyes with gloss */}
        <mesh position={[0.14, 0.05, 0.12]} castShadow>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.1} />
        </mesh>
        <mesh position={[-0.14, 0.05, 0.12]} castShadow>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.1} />
        </mesh>
        <mesh position={[0, -0.05, 0.18]} castShadow>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color={dark} roughness={0.6} />
        </mesh>
        {/* Ears with variation */}
        <mesh position={[0.18, 0.12, 0]} rotation={[0, 0, 0.35]} castShadow>
          <capsuleGeometry args={[0.05, 0.16, 6, 12]} />
          <meshStandardMaterial color={dark} roughness={0.82} metalness={0.03} />
        </mesh>
        <mesh position={[-0.18, 0.12, 0]} rotation={[0, 0, -0.35]} castShadow>
          <capsuleGeometry args={[0.05, 0.16, 6, 12]} />
          <meshStandardMaterial color={darkVariant} roughness={0.82} metalness={0.03} />
        </mesh>
      </group>

      <mesh position={[0.18, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
        <meshStandardMaterial color={dark} roughness={0.85} />
      </mesh>
      <mesh position={[-0.18, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
        <meshStandardMaterial color={dark} roughness={0.85} />
      </mesh>
      <mesh position={[0.18, 0.1, -0.18]} castShadow>
        <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
        <meshStandardMaterial color={dark} roughness={0.85} />
      </mesh>
      <mesh position={[-0.18, 0.1, -0.18]} castShadow>
        <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
        <meshStandardMaterial color={dark} roughness={0.85} />
      </mesh>

      <group ref={tail} position={[0, 0.46, -0.34]}>
        <mesh rotation={[0.2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.32, 6, 12]} />
          <meshStandardMaterial color={dark} roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}
