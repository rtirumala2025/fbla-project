import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PetGame2State } from '../core/SceneManager';
import { breathe, subtleNod } from '../animations/idle';
import { pop, wobble } from '../animations/interact';
import { ContactShadow } from '../core/ContactShadow';

export function DogModel({ state, onPetTap }: { state: PetGame2State; onPetTap: () => void }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // AAA Color Variation: No uniform surfaces, subtle hue/saturation shifts
  const baseColor = useMemo(() => new THREE.Color('#c7a074'), []); // Primary fur
  const baseColorVariant1 = useMemo(() => new THREE.Color('#d4b085'), []); // Lighter patches
  const baseColorVariant2 = useMemo(() => new THREE.Color('#bb9865'), []); // Darker patches
  const dark = useMemo(() => new THREE.Color('#5f4228'), []); // Paws/ears primary
  const darkVariant = useMemo(() => new THREE.Color('#6d4b30'), []); // Slight variation
  const eyeColor = useMemo(() => new THREE.Color('#0d0d0d'), []); // Deep black with slight warmth
  const noseColor = useMemo(() => new THREE.Color('#3d2618'), []); // Nose leather

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
      {/* Body - AAA PBR: Realistic fur has subtle sheen, not matte toy */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.55, 8, 16]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.58}
          metalness={0.04}
        />
      </mesh>

      <group ref={head} position={[0, 0.78, 0.22]}>
        {/* Head - Lighter fur variant with proper specular response */}
        <mesh castShadow>
          <sphereGeometry args={[0.25, 18, 18]} />
          <meshStandardMaterial
            color={baseColorVariant1}
            roughness={0.55}
            metalness={0.05}
          />
        </mesh>
        {/* Eyes - AAA wet gloss (roughness < 0.15 for believable moisture) */}
        <mesh position={[0.14, 0.05, 0.12]} castShadow>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color={eyeColor} roughness={0.12} metalness={0.08} />
        </mesh>
        <mesh position={[-0.14, 0.05, 0.12]} castShadow>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color={eyeColor} roughness={0.12} metalness={0.08} />
        </mesh>
        {/* Nose - Matte leather texture */}
        <mesh position={[0, -0.05, 0.18]} castShadow>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color={noseColor} roughness={0.35} metalness={0.02} />
        </mesh>
        {/* Ears - Thin fur, more directional light response */}
        <mesh position={[0.18, 0.12, 0]} rotation={[0, 0, 0.35]} castShadow>
          <capsuleGeometry args={[0.05, 0.16, 6, 12]} />
          <meshStandardMaterial color={dark} roughness={0.68} metalness={0.04} />
        </mesh>
        <mesh position={[-0.18, 0.12, 0]} rotation={[0, 0, -0.35]} castShadow>
          <capsuleGeometry args={[0.05, 0.16, 6, 12]} />
          <meshStandardMaterial color={darkVariant} roughness={0.68} metalness={0.04} />
        </mesh>
      </group>

      {/* Legs - Slightly glossier dark fur with micro-variation */}
      <mesh position={[0.18, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
        <meshStandardMaterial color={dark} roughness={0.65} metalness={0.03} />
      </mesh>
      <mesh position={[-0.18, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
        <meshStandardMaterial color={darkVariant} roughness={0.65} metalness={0.03} />
      </mesh>
      <mesh position={[0.18, 0.1, -0.18]} castShadow>
        <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
        <meshStandardMaterial color={dark} roughness={0.65} metalness={0.03} />
      </mesh>
      <mesh position={[-0.18, 0.1, -0.18]} castShadow>
        <capsuleGeometry args={[0.06, 0.2, 6, 12]} />
        <meshStandardMaterial color={darkVariant} roughness={0.65} metalness={0.03} />
      </mesh>

      <group ref={tail} position={[0, 0.46, -0.34]}>
        <mesh rotation={[0.2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.32, 6, 12]} />
          <meshStandardMaterial color={dark} roughness={0.68} metalness={0.03} />
        </mesh>
      </group>

      {/* AAA Ground Contact: Blob shadow for weight anchoring */}
      <ContactShadow
        position={[0, 0.01, 0]}
        scale={1.4}
        opacity={0.45}
        blur={0.6}
        far={1.2}
      />
    </group>
  );
}
