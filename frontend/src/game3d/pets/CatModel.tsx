import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PetGame2State } from '../core/SceneManager';
import { breathe, subtleNod } from '../animations/idle';
import { pop } from '../animations/interact';
import { ContactShadow } from '../core/ContactShadow';
import { EmotionalPose, EMOTIONAL_POSES, getEmotionalPose, perlinNoise1D, EquippedAccessory } from '../core/BehaviourSystem';
import { useKeyboardControls } from '../core/useKeyboardControls';
import { getValidPosition, clampToBounds } from '../core/CollisionSystem';

// Weight shift state
interface WeightShiftState {
  nextShiftTime: number;
  targetX: number;
  targetZ: number;
  currentX: number;
  currentZ: number;
  isShifting: boolean;
  shiftStartTime: number;
  shiftDuration: number;
}

// Ear twitch state
interface EarTwitchState {
  left: { nextTime: number; amplitude: number; duration: number; progress: number };
  right: { nextTime: number; amplitude: number; duration: number; progress: number };
}

export function CatModel({ state, onPetTap, setPetPosition, stats, targetRef, isMovingRef, rotationRef, accessories = [] }: {
  state: PetGame2State;
  onPetTap: () => void;
  setPetPosition?: (pos: [number, number, number]) => void;
  stats?: any;
  targetRef?: React.MutableRefObject<THREE.Vector3>;
  isMovingRef?: React.MutableRefObject<boolean>;
  rotationRef?: React.MutableRefObject<THREE.Quaternion>;
  accessories?: EquippedAccessory[];
}) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Mesh>(null);
  const earR = useRef<THREE.Mesh>(null);
  const tail = useRef<THREE.Group>(null);
  const legFL = useRef<THREE.Mesh>(null);
  const legFR = useRef<THREE.Mesh>(null);
  const legBL = useRef<THREE.Mesh>(null);
  const legBR = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Keyboard Controls
  const keys = useKeyboardControls();

  // AAA Idle Motion State
  const weightShiftState = useRef<WeightShiftState>({
    nextShiftTime: 0,
    targetX: 0,
    targetZ: 0,
    currentX: 0,
    currentZ: 0,
    isShifting: false,
    shiftStartTime: 0,
    shiftDuration: 1200,
  });

  const earTwitchState = useRef<EarTwitchState>({
    left: { nextTime: 0, amplitude: 0, duration: 0, progress: 1 },
    right: { nextTime: 0, amplitude: 0, duration: 0, progress: 1 },
  });

  const blinkState = useRef({ nextBlink: 0, progress: 1 });

  // Optimize: Reuse vectors
  const forward = useMemo(() => new THREE.Vector3(), []);
  const lastPosUpdate = useRef(0);

  // Scale factor to match large environment (Cats smaller than dogs)
  const SCALE = 2.4;

  // EMOTIONAL STATE SYSTEM
  const emotionalPose = useMemo(() => getEmotionalPose(stats), [stats]);

  // AAA Color Variation
  const fur = useMemo(() => new THREE.Color('#d1c8ba'), []);
  const furVariant1 = useMemo(() => new THREE.Color('#dcd4c6'), []);
  const stripe = useMemo(() => new THREE.Color('#8a7f70'), []);
  const stripeVariant = useMemo(() => new THREE.Color('#7e7366'), []);
  const eyeColor = useMemo(() => new THREE.Color('#0e0e0e'), []);
  const noseColor = useMemo(() => new THREE.Color('#c77d77'), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const breathRate = 1.7 * emotionalPose.breathing_rate; // Cats breathe faster

    if (root.current) {
      // Breathing
      const b = Math.sin(t * breathRate) * 0.04 * emotionalPose.chest_expansion;
      root.current.position.y = 0.02 + b;
      root.current.scale.y = SCALE * (1.0 + b * 0.4);
      root.current.scale.x = SCALE;
      root.current.scale.z = SCALE;

      // Spine curve
      root.current.rotation.z = emotionalPose.spine_curve * 1.5; // More flexible spine
    }

    if (head.current) {
      // Perlin drift
      const driftPitch = (perlinNoise1D(t * 0.5, 1) * 2 - 1) * 0.05 * emotionalPose.micro_movement_scale;
      const driftYaw = (perlinNoise1D(t * 0.3, 2) * 2 - 1) * 0.08 * emotionalPose.micro_movement_scale;

      const nod = subtleNod(t, 1.25) * 0.06;

      head.current.rotation.x = emotionalPose.head_pitch + nod + driftPitch;
      head.current.rotation.y = driftYaw + emotionalPose.head_roll;
    }

    if (tail.current) {
      // Cat tail is very expressive
      const wagSpeed = emotionalPose.tail_wag_speed * 0.5; // Cats wag slower/sinuous
      tail.current.rotation.y = Math.sin(t * 2.2 + wagSpeed) * 0.25 * (emotionalPose.tail_wag_amp + 0.5) + emotionalPose.tail_offset;
      tail.current.rotation.x = Math.sin(t * 1.6) * 0.08;
    }

    // Ear Twitch
    const now = performance.now();
    const et = earTwitchState.current;
    // ... (Simple random twitch logic similar to dog but adapted)
    if (now >= et.left.nextTime) {
      et.left.nextTime = now + 4000 + Math.random() * 6000;
      et.left.progress = 0;
    }
    if (et.left.progress < 1) {
      et.left.progress += 0.05;
      if (earL.current) earL.current.rotation.z = 0.25 + Math.sin(et.left.progress * Math.PI) * 0.3;
    }

    if (now >= et.right.nextTime) {
      et.right.nextTime = now + 4000 + Math.random() * 6000;
      et.right.progress = 0;
    }
    if (et.right.progress < 1) {
      et.right.progress += 0.05;
      if (earR.current) earR.current.rotation.z = -0.25 - Math.sin(et.right.progress * Math.PI) * 0.3;
    }

    // MOVEMENT & NAVIGATION
    if (state.interaction.kind === 'navigating' && state.navigationState.target && root.current) {
      const { startPosition, endPosition, progress } = state.navigationState;
      const x = startPosition[0] + (endPosition[0] - startPosition[0]) * progress;
      const y = startPosition[1] + (endPosition[1] - startPosition[1]) * progress;
      const z = startPosition[2] + (endPosition[2] - startPosition[2]) * progress;

      root.current.position.set(x, y, z);
      const dx = endPosition[0] - startPosition[0];
      const dz = endPosition[2] - startPosition[2];
      root.current.rotation.y = Math.atan2(dx, dz);

      const walkCycle = Math.sin(progress * Math.PI * 16) * 0.1;
      root.current.position.y = y + Math.abs(walkCycle);

      setPetPosition?.([x, y, z]);
    } else if (state.interaction.kind === 'atActivity' && state.navigationState.endPosition && root.current) {
      // Snap to activity
      const [x, y, z] = state.navigationState.endPosition;
      root.current.position.set(x, y, z);
    } else if (root.current) {
      // Manual Movement
      const isMovingManually = keys.forward || keys.backward || keys.left || keys.right;

      if (state.currentPosition && !isMovingManually) {
        const [cx, cy, cz] = state.currentPosition;
        root.current.position.set(cx, cy, cz);
      }

      if (isMovingManually) {
        const delta = 0.016;
        const moveSpeed = 10.0 * delta; // Fast cat
        const rotateSpeed = 3.5 * delta;

        // COLLISION
        const prevX = root.current.position.x;
        const prevZ = root.current.position.z;

        forward.set(0, 0, 1).applyQuaternion(root.current.quaternion);

        if (keys.left) root.current.rotation.y += rotateSpeed;
        if (keys.right) root.current.rotation.y -= rotateSpeed;

        if (keys.forward) root.current.position.addScaledVector(forward, moveSpeed);
        if (keys.backward) root.current.position.addScaledVector(forward, -moveSpeed * 0.5);

        const [validX, validZ] = getValidPosition(prevX, prevZ, root.current.position.x, root.current.position.z);
        root.current.position.x = validX;
        root.current.position.z = validZ;

        const [clampedX, clampedZ] = clampToBounds(root.current.position.x, root.current.position.z, 28); // Smaller room bounds
        root.current.position.x = clampedX;
        root.current.position.z = clampedZ;

        // Sync
        const now = performance.now();
        if (now - lastPosUpdate.current > 100) {
          setPetPosition?.([root.current.position.x, root.current.position.y, root.current.position.z]);
          lastPosUpdate.current = now;
        }

        // Sync Refs
        if (targetRef) targetRef.current.copy(root.current.position);
        if (rotationRef) rotationRef.current.copy(root.current.quaternion);
        if (isMovingRef) isMovingRef.current = true;

        // Walk Cycle
        const walkTime = t * 16;
        const legAmplitude = 0.55;
        if (legFL.current) legFL.current.rotation.x = Math.sin(walkTime) * legAmplitude;
        if (legBR.current) legBR.current.rotation.x = Math.sin(walkTime) * legAmplitude;
        if (legFR.current) legFR.current.rotation.x = Math.sin(walkTime + Math.PI) * legAmplitude;
        if (legBL.current) legBL.current.rotation.x = Math.sin(walkTime + Math.PI) * legAmplitude;

        // Banking
        let targetBank = 0;
        if (keys.left) targetBank = 0.2;
        if (keys.right) targetBank = -0.2;
        root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, targetBank, 0.15);
      } else {
        if (isMovingRef) isMovingRef.current = false;
        // Reset
        if (legFL.current) legFL.current.rotation.x = THREE.MathUtils.lerp(legFL.current.rotation.x, 0, 0.1);
        if (legFR.current) legFR.current.rotation.x = THREE.MathUtils.lerp(legFR.current.rotation.x, 0, 0.1);
        if (legBL.current) legBL.current.rotation.x = THREE.MathUtils.lerp(legBL.current.rotation.x, 0, 0.1);
        if (legBR.current) legBR.current.rotation.x = THREE.MathUtils.lerp(legBR.current.rotation.x, 0, 0.1);
        if (root.current) root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, emotionalPose.spine_curve * 1.5, 0.1);
      }
    }

    // Interactions Pop
    if (state.interaction.kind !== 'idle' && root.current && state.interaction.kind !== 'navigating' && state.interaction.kind !== 'atActivity') {
      const startedAt = state.interaction.startedAt;
      const localT = Math.min(1, (performance.now() - startedAt) / 420);
      const s = SCALE * (1 + pop(localT) * 0.05);
      root.current.scale.setScalar(s);
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
      {/* Body - Cat fur softer than dog but still needs subtle sheen */}
      <mesh position={[0, 0.33, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.5, 8, 16]} />
        <meshStandardMaterial
          color={fur}
          roughness={0.62}
          metalness={0.03}
        />
      </mesh>

      {/* Stripe - Guard hairs have more directionality, slightly glossier */}
      <mesh position={[0, 0.38, 0.02]} castShadow>
        <boxGeometry args={[0.22, 0.12, 0.65]} />
        <meshStandardMaterial
          color={stripe}
          roughness={0.76}
          metalness={0.02}
        />
      </mesh>

      <group ref={head} position={[0, 0.78, 0.2]}>
        {/* Head - Rounded surfaces catch more light */}
        <mesh castShadow>
          <sphereGeometry args={[0.23, 18, 18]} />
          <meshStandardMaterial
            color={furVariant1}
            roughness={0.60}
            metalness={0.04}
          />
        </mesh>
        {/* Ears - Cat ears have thin fur, transmit some light */}
        <mesh ref={earL} position={[0.16, 0.2, 0]} rotation={[0, 0, 0.25]} castShadow>
          <coneGeometry args={[0.08, 0.16, 10]} />
          <meshStandardMaterial color={stripe} roughness={0.66} metalness={0.04} />
        </mesh>
        <mesh ref={earR} position={[-0.16, 0.2, 0]} rotation={[0, 0, -0.25]} castShadow>
          <coneGeometry args={[0.08, 0.16, 10]} />
          <meshStandardMaterial color={stripeVariant} roughness={0.66} metalness={0.04} />
        </mesh>
        {/* Eyes - Wet gloss for feline gaze */}
        <mesh position={[0.11, 0.05, 0.14]} castShadow>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color={eyeColor} roughness={0.10} metalness={0.08} />
        </mesh>
        <mesh position={[-0.11, 0.05, 0.14]} castShadow>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color={eyeColor} roughness={0.10} metalness={0.08} />
        </mesh>
        {/* Nose - Pink leather with subtle moisture */}
        <mesh position={[0, -0.06, 0.17]} castShadow>
          <coneGeometry args={[0.04, 0.07, 10]} />
          <meshStandardMaterial color={noseColor} roughness={0.42} metalness={0.02} />
        </mesh>
      </group>

      {/* Legs - Refactored for Animation */}
      <mesh ref={legFL} position={[0.16, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.055, 0.18, 6, 12]} />
        <meshStandardMaterial color={stripe} roughness={0.68} metalness={0.03} />
      </mesh>
      <mesh ref={legFR} position={[-0.16, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.055, 0.18, 6, 12]} />
        <meshStandardMaterial color={stripeVariant} roughness={0.68} metalness={0.03} />
      </mesh>
      <mesh ref={legBL} position={[0.16, 0.1, -0.16]} castShadow>
        <capsuleGeometry args={[0.055, 0.18, 6, 12]} />
        <meshStandardMaterial color={stripe} roughness={0.68} metalness={0.03} />
      </mesh>
      <mesh ref={legBR} position={[-0.16, 0.1, -0.16]} castShadow>
        <capsuleGeometry args={[0.055, 0.18, 6, 12]} />
        <meshStandardMaterial color={stripeVariant} roughness={0.68} metalness={0.03} />
      </mesh>

      <group ref={tail} position={[0, 0.46, -0.32]}>
        <mesh rotation={[0.45, 0, 0]} castShadow>
          <capsuleGeometry args={[0.035, 0.4, 6, 12]} />
          <meshStandardMaterial color={stripe} roughness={0.70} metalness={0.03} />
        </mesh>
      </group>

      {/* AAA Ground Contact */}
      <ContactShadow
        position={[0, 0.01, 0]}
        scale={1.3}
        opacity={0.42}
        blur={0.55}
        far={1.1}
      />
    </group>
  );
}
