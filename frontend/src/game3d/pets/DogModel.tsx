import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PetGame2State } from '../core/SceneManager';
import { breathe, subtleNod } from '../animations/idle';
import { pop, wobble } from '../animations/interact';
import { ContactShadow } from '../core/ContactShadow';

export function DogModel({ state, onPetTap, setPetPosition }: {
  state: PetGame2State;
  onPetTap: () => void;
  setPetPosition?: (pos: [number, number, number]) => void;
}) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Scale factor to match large environment
  const SCALE = 2.0;

  // AAA Color Variation: No uniform surfaces, subtle hue/saturation shifts
  const baseColor = useMemo(() => new THREE.Color('#c7a074'), []); // Primary fur
  const baseColorVariant1 = useMemo(() => new THREE.Color('#d4b085'), []); // Lighter patches (Head/Snout)
  const baseColorVariant2 = useMemo(() => new THREE.Color('#bb9865'), []); // Darker patches
  const dark = useMemo(() => new THREE.Color('#5f4228'), []); // Paws/ears primary
  const darkVariant = useMemo(() => new THREE.Color('#6d4b30'), []); // Slight variation
  const eyeColor = useMemo(() => new THREE.Color('#0d0d0d'), []); // Deep black with slight warmth
  const noseColor = useMemo(() => new THREE.Color('#3d2618'), []); // Nose leather

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (root.current) {
      // Breathing effects the ribcage expansion (Horizontal)
      const b = breathe(t, 1.6);
      root.current.scale.x = SCALE * (1.0 + b * 0.015);
      root.current.scale.y = SCALE * (1.0 + b * 0.01);
      root.current.scale.z = SCALE * (1.0 + b * 0.01);

      // Adjust vertical position to keep feet on ground after scaling
      // Origin is at 0,0,0, but visuals are offset up.
      // Scaling from 0,0,0 pushes visuals up further.
      // Current Y pos is ~dynamic.
      // Let's just scale the offsets in the animation
      // root.current.position.y = 0.02 + b * 0.06;
    }

    if (head.current) {
      // Sniffing/Looking around
      const n = subtleNod(t, 1.2);
      head.current.rotation.x = -0.2 + n * 0.1; // Baseline tilt + nod
      head.current.rotation.y = Math.sin(t * 0.5) * 0.15;
    }

    if (tail.current) {
      const wag = Math.sin(t * 10.0) * 0.6;
      tail.current.rotation.y = wag;
      tail.current.rotation.z = Math.cos(t * 5.0) * 0.1;
    }

    // Navigation: Interpolate position based on progress
    if (state.interaction.kind === 'navigating' && state.navigationState.target) {
      const { startPosition, endPosition, progress } = state.navigationState;

      // Linear interpolation
      const x = startPosition[0] + (endPosition[0] - startPosition[0]) * progress;
      const y = startPosition[1] + (endPosition[1] - startPosition[1]) * progress;
      const z = startPosition[2] + (endPosition[2] - startPosition[2]) * progress;

      if (root.current) {
        root.current.position.set(x, y, z);

        // Rotate to face destination
        const dx = endPosition[0] - startPosition[0];
        const dz = endPosition[2] - startPosition[2];
        const targetRotation = Math.atan2(dx, dz);
        root.current.rotation.y = targetRotation;

        // Walking animation: bobbing motion
        const walkCycle = Math.sin(progress * Math.PI * 8) * 0.08;
        root.current.position.y = y + Math.abs(walkCycle);
      }

      // Update pet position in SceneManager
      setPetPosition?.([x, y, z]);
    }
    // At activity: stay at destination
    else if (state.interaction.kind === 'atActivity' && state.navigationState.endPosition) {
      const [x, y, z] = state.navigationState.endPosition;
      if (root.current) {
        root.current.position.set(x, y, z);
      }
      setPetPosition?.([x, y, z]);
    }
    // Normal interaction animations
    else if (state.interaction.kind !== 'idle') {
      const startedAt = state.interaction.startedAt;
      const localT = Math.min(1, (performance.now() - startedAt) / 450);
      const s = SCALE * (1 + pop(localT) * 0.06);
      if (root.current) root.current.scale.setScalar(s);
    } else {
      if (root.current) {
        const targetScale = isHovered ? SCALE * 1.03 : SCALE;
        root.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
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
        // Only allow pet tap when not navigating
        if (state.interaction.kind !== 'navigating') {
          onPetTap();
        }
      }}
    >
      {/* 1. MAIN BODY (HORIZONTAL SPINE) */}
      <mesh position={[0, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.22, 0.45, 8, 20]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.65}
          metalness={0.0}
        />
      </mesh>

      {/* 2. NECK AND HEAD */}
      <group position={[0, 0.45, 0.32]}>
        {/* Neck */}
        <mesh rotation={[-0.4, 0, 0]} position={[0, 0.1, 0.05]} castShadow>
          <capsuleGeometry args={[0.12, 0.18, 6, 12]} />
          <meshStandardMaterial color={baseColor} roughness={0.65} />
        </mesh>

        {/* Head Group */}
        <group ref={head} position={[0, 0.28, 0.12]}>
          {/* Main Skull */}
          <mesh castShadow>
            <sphereGeometry args={[0.22, 20, 20]} />
            <meshStandardMaterial color={baseColorVariant1} roughness={0.6} />
          </mesh>

          {/* SNOUT/MUZZLE (Crucial for Dog Identity) */}
          <mesh position={[0, -0.04, 0.18]} rotation={[0.1, 0, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.12, 6, 12]} />
            <meshStandardMaterial color={baseColorVariant1} roughness={0.6} />
          </mesh>

          {/* Mouth Line */}
          <mesh position={[0, -0.12, 0.22]} rotation={[0, 0, 0]} castShadow>
            <capsuleGeometry args={[0.02, 0.08, 4, 8]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color={noseColor} roughness={0.8} />
          </mesh>

          {/* Eyes */}
          <mesh position={[0.11, 0.08, 0.14]} castShadow>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshStandardMaterial color={eyeColor} roughness={0.1} metalness={0.1} />
          </mesh>
          <mesh position={[-0.11, 0.08, 0.14]} castShadow>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshStandardMaterial color={eyeColor} roughness={0.1} metalness={0.1} />
          </mesh>

          {/* Nose */}
          <mesh position={[0, -0.02, 0.3]} castShadow>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color={noseColor} roughness={0.3} />
          </mesh>

          {/* Ears (Top-Back) */}
          <mesh position={[0.16, 0.18, -0.05]} rotation={[0.4, 0, 0.5]} castShadow>
            <capsuleGeometry args={[0.045, 0.18, 6, 12]} />
            <meshStandardMaterial color={dark} roughness={0.7} />
          </mesh>
          <mesh position={[-0.16, 0.18, -0.05]} rotation={[0.4, 0, -0.5]} castShadow>
            <capsuleGeometry args={[0.045, 0.18, 6, 12]} />
            <meshStandardMaterial color={darkVariant} roughness={0.7} />
          </mesh>
        </group>
      </group>

      {/* 3. FOUR LEGS (QUADRUPED STANCE) */}
      {/* Front Left */}
      <group position={[0.16, 0.2, 0.22]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
          <meshStandardMaterial color={dark} roughness={0.7} />
        </mesh>
        {/* Paw Pad */}
        <mesh position={[0, -0.18, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.03, 16]} />
          <meshStandardMaterial color={noseColor} roughness={0.8} />
        </mesh>
      </group>

      {/* Front Right */}
      <group position={[-0.16, 0.2, 0.22]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
          <meshStandardMaterial color={darkVariant} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.18, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.03, 16]} />
          <meshStandardMaterial color={noseColor} roughness={0.8} />
        </mesh>
      </group>

      {/* Back Left */}
      <group position={[0.16, 0.2, -0.22]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
          <meshStandardMaterial color={dark} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.18, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.03, 16]} />
          <meshStandardMaterial color={noseColor} roughness={0.8} />
        </mesh>
      </group>

      {/* Back Right */}
      <group position={[-0.16, 0.2, -0.22]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
          <meshStandardMaterial color={darkVariant} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.18, 0.02]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.03, 16]} />
          <meshStandardMaterial color={noseColor} roughness={0.8} />
        </mesh>
      </group>

      {/* 4. TAIL */}
      <group ref={tail} position={[0, 0.42, -0.38]}>
        <mesh rotation={[1.1, 0, 0]} position={[0, 0.1, -0.08]} castShadow>
          <capsuleGeometry args={[0.045, 0.28, 6, 12]} />
          <meshStandardMaterial color={dark} roughness={0.7} />
        </mesh>
      </group>

      {/* GROUND CONTACT SHADOW */}
      <ContactShadow
        position={[0, 0.01, 0]}
        scale={[0.8 * SCALE, 1.2 * SCALE, 1]}
        opacity={0.5}
        blur={0.8}
        far={1}
      />
    </group>
  );
}
