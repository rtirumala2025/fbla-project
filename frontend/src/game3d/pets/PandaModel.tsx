import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { PetGame2State } from '../core/SceneManager';
import { breathe } from '../animations/idle';
import { pop, wobble } from '../animations/interact';
import { ContactShadow } from '../core/ContactShadow';

export function PandaModel({ state, onPetTap, setPetPosition }: {
  state: PetGame2State;
  onPetTap: () => void;
  setPetPosition?: (pos: [number, number, number]) => void;
}) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { camera } = useThree();

  // Scale factor to match large environment
  const SCALE = 3.2; // Pandas are bulky like dogs

  // AAA Two-Tone PBR: White fur (sheen) vs Black patches (deep absorption)
  // Critical: Avoid pure white/black - add subtle undertones
  const white = useMemo(() => new THREE.Color('#f8f6f4'), []); // Warm white (slight cream)
  const whiteVariant = useMemo(() => new THREE.Color('#fdfbf9'), []); // Lightest areas
  const whiteShadow = useMemo(() => new THREE.Color('#f0ede9'), []); // Shadow areas (still light)
  const black = useMemo(() => new THREE.Color('#1a1a1a'), []); // Primary black (subtle warmth)
  const blackVariant = useMemo(() => new THREE.Color('#242424'), []); // Lighter black patches
  const eyeColor = useMemo(() => new THREE.Color('#080808'), []); // Deep black
  const noseColor = useMemo(() => new THREE.Color('#1c1c1c'), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (root.current) {
      // Most pronounced breathing for rotund body
      const b = breathe(t, 1.2);
      root.current.position.y = 0.04 + b * 0.14;
      root.current.scale.y = 1.0 + b * 0.04;
      root.current.rotation.y = Math.sin(t * 0.4) * 0.12;
    }

    if (head.current) {
      // Camera/head tracking
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);

      // Track camera horizontally
      const targetRotationY = Math.atan2(cameraDirection.x, cameraDirection.z) * 0.3;
      head.current.rotation.y = THREE.MathUtils.lerp(
        head.current.rotation.y,
        targetRotationY + Math.sin(t * 0.4) * 0.15,
        0.05
      );

      // Slight vertical head movement
      head.current.rotation.x = Math.sin(t * 0.35) * 0.08;
    }

    // Navigation: Interpolate position
    if (state.interaction.kind === 'navigating' && state.navigationState.target) {
      const { startPosition, endPosition, progress } = state.navigationState;
      const x = startPosition[0] + (endPosition[0] - startPosition[0]) * progress;
      const y = startPosition[1] + (endPosition[1] - startPosition[1]) * progress;
      const z = startPosition[2] + (endPosition[2] - startPosition[2]) * progress;
      if (root.current) {
        root.current.position.set(x, y, z);
        const dx = endPosition[0] - startPosition[0];
        const dz = endPosition[2] - startPosition[2];
        root.current.rotation.y = Math.atan2(dx, dz);
        const walkCycle = Math.sin(progress * Math.PI * 6) * 0.08;
        root.current.position.y = y + Math.abs(walkCycle);
      }
      setPetPosition?.([x, y, z]);
    }
    else if (state.interaction.kind === 'atActivity' && state.navigationState.endPosition) {
      const [x, y, z] = state.navigationState.endPosition;
      if (root.current) root.current.position.set(x, y, z);
      setPetPosition?.([x, y, z]);
    }
    // Species-specific reaction: Panda bounces and spins
    else if (state.interaction.kind !== 'idle') {
      const startedAt = state.interaction.startedAt;
      const localT = Math.min(1, (performance.now() - startedAt) / 600);

      if (state.interaction.kind === 'petTap') {
        const s = 1 + pop(localT) * 0.08;
        if (root.current) root.current.scale.setScalar(s);
        if (root.current) root.current.rotation.z = wobble(localT) * 0.08;
      } else {
        // Action reactions - bigger bounce
        const s = 1 + pop(localT) * 0.15;
        if (root.current) {
          root.current.scale.setScalar(s);
          // Panda happy spin
          root.current.rotation.y += Math.sin(localT * Math.PI) * 0.3;
        }
      }
    } else {
      if (root.current) {
        const targetScale = isHovered ? SCALE * 1.05 : SCALE;
        root.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        root.current.rotation.z *= 0.85;
      }
    }
  });

  return (
    <group
      ref={root}
      scale={SCALE}
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
        if (state.interaction.kind !== 'navigating') {
          onPetTap();
        }
      }}
    >
      {/* White fur body - Healthy sheen, not matte plush */}
      <mesh position={[0, 0.33, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.55, 8, 16]} />
        <meshStandardMaterial
          color={white}
          roughness={0.56}
          metalness={0.05}
        />
      </mesh>

      {/* Black fur patch - More matte than white, deep light absorption */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color={black}
          roughness={0.72}
          metalness={0.02}
        />
      </mesh>

      <group ref={head} position={[0, 0.82, 0.2]}>
        {/* White fur head - Brightest white with healthy sheen */}
        <mesh castShadow>
          <sphereGeometry args={[0.27, 18, 18]} />
          <meshStandardMaterial
            color={whiteVariant}
            roughness={0.52}
            metalness={0.06}
          />
        </mesh>

        {/* Black eye patches - Slight sheen variation for oily guard hairs */}
        <mesh position={[0.14, 0.06, 0.14]} castShadow>
          <sphereGeometry args={[0.06, 14, 14]} />
          <meshStandardMaterial color={black} roughness={0.66} metalness={0.03} />
        </mesh>
        <mesh position={[-0.14, 0.06, 0.14]} castShadow>
          <sphereGeometry args={[0.06, 14, 14]} />
          <meshStandardMaterial color={blackVariant} roughness={0.66} metalness={0.03} />
        </mesh>

        {/* Eyes - AAA extreme wet gloss (most reflective surface on model) */}
        <mesh position={[0.14, 0.08, 0.18]} castShadow>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color={eyeColor} roughness={0.10} metalness={0.10} />
        </mesh>
        <mesh position={[-0.14, 0.08, 0.18]} castShadow>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color={eyeColor} roughness={0.10} metalness={0.10} />
        </mesh>

        {/* Nose - Black leather */}
        <mesh position={[0, -0.03, 0.2]} castShadow>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color={noseColor} roughness={0.38} metalness={0.02} />
        </mesh>

        {/* Black ears - Matte finish for contrast with head */}
        <mesh position={[0.16, 0.22, 0]} castShadow>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshStandardMaterial color={black} roughness={0.76} metalness={0.02} />
        </mesh>
        <mesh position={[-0.16, 0.22, 0]} castShadow>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshStandardMaterial color={blackVariant} roughness={0.76} metalness={0.02} />
        </mesh>
      </group>

      {/* Black legs - Consistent matte finish with micro-variation */}
      <mesh position={[0.2, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={black} roughness={0.74} metalness={0.02} />
      </mesh>
      <mesh position={[-0.2, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={blackVariant} roughness={0.74} metalness={0.02} />
      </mesh>
      <mesh position={[0.2, 0.1, -0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={black} roughness={0.74} metalness={0.02} />
      </mesh>
      <mesh position={[-0.2, 0.1, -0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={blackVariant} roughness={0.74} metalness={0.02} />
      </mesh>

      {/* AAA Ground Contact - Panda is heaviest, needs darkest shadow */}
      <ContactShadow
        position={[0, 0.01, 0]}
        scale={1.8}
        opacity={0.52}
        blur={0.7}
        far={1.3}
      />
    </group>
  );
}
