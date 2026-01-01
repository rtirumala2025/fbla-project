import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { PetGame2State } from '../core/SceneManager';
import { breathe } from '../animations/idle';
import { pop, wobble } from '../animations/interact';

export function PandaModel({ state, onPetTap }: { state: PetGame2State; onPetTap: () => void }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { camera } = useThree();

  // Enhanced color variation with subtle warm/cool undertones
  const white = useMemo(() => new THREE.Color('#f5f5f5'), []);
  const whiteVariant = useMemo(() => new THREE.Color('#faf8f6'), []);
  const black = useMemo(() => new THREE.Color('#1b1b1b'), []);
  const blackVariant = useMemo(() => new THREE.Color('#252525'), []);

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

    // Species-specific reaction: Panda bounces and spins
    if (state.interaction.kind !== 'idle') {
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
        const targetScale = isHovered ? 1.05 : 1.0;
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
      {/* White fur body with subtle sheen */}
      <mesh position={[0, 0.33, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.55, 8, 16]} />
        <meshStandardMaterial
          color={white}
          roughness={0.58}
          metalness={0.08}
        />
      </mesh>

      {/* Black fur patch - more matte than white */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color={black}
          roughness={0.72}
          metalness={0.03}
        />
      </mesh>

      <group ref={head} position={[0, 0.82, 0.2]}>
        {/* White fur head with healthy sheen */}
        <mesh castShadow>
          <sphereGeometry args={[0.27, 18, 18]} />
          <meshStandardMaterial
            color={whiteVariant}
            roughness={0.56}
            metalness={0.09}
          />
        </mesh>

        {/* Black eye patches with slight variation */}
        <mesh position={[0.14, 0.06, 0.14]} castShadow>
          <sphereGeometry args={[0.06, 14, 14]} />
          <meshStandardMaterial color={black} roughness={0.68} metalness={0.04} />
        </mesh>
        <mesh position={[-0.14, 0.06, 0.14]} castShadow>
          <sphereGeometry args={[0.06, 14, 14]} />
          <meshStandardMaterial color={blackVariant} roughness={0.68} metalness={0.04} />
        </mesh>

        {/* Eyes with gloss */}
        <mesh position={[0.14, 0.08, 0.18]} castShadow>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#050505" roughness={0.15} metalness={0.12} />
        </mesh>
        <mesh position={[-0.14, 0.08, 0.18]} castShadow>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshStandardMaterial color="#050505" roughness={0.15} metalness={0.12} />
        </mesh>

        <mesh position={[0, -0.03, 0.2]} castShadow>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color={black} roughness={0.6} />
        </mesh>

        {/* Black ears with matte finish */}
        <mesh position={[0.16, 0.22, 0]} castShadow>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshStandardMaterial color={black} roughness={0.78} metalness={0.02} />
        </mesh>
        <mesh position={[-0.16, 0.22, 0]} castShadow>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshStandardMaterial color={blackVariant} roughness={0.78} metalness={0.02} />
        </mesh>
      </group>

      {/* Black legs with matte finish */}
      <mesh position={[0.2, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={black} roughness={0.76} metalness={0.03} />
      </mesh>
      <mesh position={[-0.2, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={blackVariant} roughness={0.76} metalness={0.03} />
      </mesh>
      <mesh position={[0.2, 0.1, -0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={black} roughness={0.76} metalness={0.03} />
      </mesh>
      <mesh position={[-0.2, 0.1, -0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={blackVariant} roughness={0.76} metalness={0.03} />
      </mesh>
    </group>
  );
}
