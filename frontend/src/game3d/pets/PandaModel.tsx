import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { PetGame2State } from '../core/SceneManager';
import { breathe } from '../animations/idle';
import { pop, wobble } from '../animations/interact';
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

export function PandaModel({ state, onPetTap, setPetPosition, stats, targetRef, isMovingRef, rotationRef, accessories = [] }: {
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
  const legFL = useRef<THREE.Mesh>(null);
  const legFR = useRef<THREE.Mesh>(null);
  const legBL = useRef<THREE.Mesh>(null);
  const legBR = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const { camera } = useThree();

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

  const blinkState = useRef({ nextBlink: 0, progress: 1 });

  // Optimize: Reuse vectors
  const forward = useMemo(() => new THREE.Vector3(), []);
  const lastPosUpdate = useRef(0);

  // Scale factor (Pandas are bulky)
  const SCALE = 3.2;

  // EMOTIONAL STATE SYSTEM
  const emotionalPose = useMemo(() => getEmotionalPose(stats), [stats]);

  // AAA Two-Tone PBR
  const white = useMemo(() => new THREE.Color('#f8f6f4'), []);
  const whiteVariant = useMemo(() => new THREE.Color('#fdfbf9'), []);
  const whiteShadow = useMemo(() => new THREE.Color('#f0ede9'), []);
  const black = useMemo(() => new THREE.Color('#1a1a1a'), []);
  const blackVariant = useMemo(() => new THREE.Color('#242424'), []);
  const eyeColor = useMemo(() => new THREE.Color('#080808'), []);
  const noseColor = useMemo(() => new THREE.Color('#1c1c1c'), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const breathRate = 1.2 * emotionalPose.breathing_rate; // Slower, deeper breath

    if (root.current) {
      const b = Math.sin(t * breathRate) * 0.14 * emotionalPose.chest_expansion;
      root.current.position.y = 0.04 + b;
      // Heavy breathing expands width too
      root.current.scale.set(SCALE * (1 + b * 0.2), SCALE * (1 + b * 0.3), SCALE * (1 + b * 0.2));

      root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, emotionalPose.spine_curve, 0.1);
    }

    if (head.current) {
      // Camera/head tracking mixed with emotion
      const cameraDirection = new THREE.Vector3();
      camera.getWorldDirection(cameraDirection);
      const targetRotationY = Math.atan2(cameraDirection.x, cameraDirection.z) * 0.3;

      // Perlin drift
      const driftPitch = (perlinNoise1D(t * 0.4, 1) * 2 - 1) * 0.05;

      head.current.rotation.y = THREE.MathUtils.lerp(
        head.current.rotation.y,
        targetRotationY + emotionalPose.head_roll,
        0.05
      );
      head.current.rotation.x = Math.sin(t * 0.35) * 0.08 + emotionalPose.head_pitch + driftPitch;
    }

    // Pandas don't have tails visible enough to wag in this model, but ears twitch
    if (earL.current) earL.current.rotation.z = Math.sin(t * 5 + 1) * 0.05; // Gentle twitch
    if (earR.current) earR.current.rotation.z = Math.sin(t * 4) * 0.05;

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

      const walkCycle = Math.sin(progress * Math.PI * 6) * 0.08;
      root.current.position.y = y + Math.abs(walkCycle);

      setPetPosition?.([x, y, z]);
    } else if (state.interaction.kind === 'atActivity' && state.navigationState.endPosition && root.current) {
      // Snap to activity
      const [x, y, z] = state.navigationState.endPosition;
      root.current.position.set(x, y, z);
    } else if (state.interaction.kind !== 'idle') {
      const startedAt = state.interaction.startedAt;
      const localT = Math.min(1, (performance.now() - startedAt) / 600);

      // Panda Bouncy Reaction
      const s = SCALE * (1 + pop(localT) * 0.15);
      if (root.current) {
        root.current.scale.setScalar(s);
        if (state.interaction.kind === 'action' && state.interaction.action === 'play') {
          root.current.rotation.y += Math.sin(localT * Math.PI) * 0.3; // Spin
        }
      }
    } else if (root.current) {
      // Manual Movement
      const isMovingManually = keys.forward || keys.backward || keys.left || keys.right;

      if (state.currentPosition && !isMovingManually) {
        const [cx, cy, cz] = state.currentPosition;
        root.current.position.set(cx, cy, cz);
      }

      if (isMovingManually) {
        const delta = 0.016;
        const moveSpeed = 6.0 * delta; // Slower Panda
        const rotateSpeed = 2.5 * delta;

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

        const [clampedX, clampedZ] = clampToBounds(root.current.position.x, root.current.position.z, 28);
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

        // Walk Cycle (Waddle)
        const walkTime = t * 10;
        const legAmplitude = 0.45;
        if (legFL.current) legFL.current.rotation.x = Math.sin(walkTime) * legAmplitude;
        if (legBR.current) legBR.current.rotation.x = Math.sin(walkTime) * legAmplitude;
        if (legFR.current) legFR.current.rotation.x = Math.sin(walkTime + Math.PI) * legAmplitude;
        if (legBL.current) legBL.current.rotation.x = Math.sin(walkTime + Math.PI) * legAmplitude;

        // Heavy Banking
        let targetBank = 0;
        if (keys.left) targetBank = 0.3;
        if (keys.right) targetBank = -0.3;
        root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, targetBank, 0.08); // Slow roll
      } else {
        if (isMovingRef) isMovingRef.current = false;
        // Reset
        if (legFL.current) legFL.current.rotation.x = THREE.MathUtils.lerp(legFL.current.rotation.x, 0, 0.1);
        if (legFR.current) legFR.current.rotation.x = THREE.MathUtils.lerp(legFR.current.rotation.x, 0, 0.1);
        if (legBL.current) legBL.current.rotation.x = THREE.MathUtils.lerp(legBL.current.rotation.x, 0, 0.1);
        if (legBR.current) legBR.current.rotation.x = THREE.MathUtils.lerp(legBR.current.rotation.x, 0, 0.1);
        if (root.current) root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, emotionalPose.spine_curve, 0.1);
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
        <mesh ref={earL} position={[0.16, 0.22, 0]} castShadow>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshStandardMaterial color={black} roughness={0.76} metalness={0.02} />
        </mesh>
        <mesh ref={earR} position={[-0.16, 0.22, 0]} castShadow>
          <sphereGeometry args={[0.09, 14, 14]} />
          <meshStandardMaterial color={blackVariant} roughness={0.76} metalness={0.02} />
        </mesh>
      </group>

      {/* Black legs - Refactored for Animation */}
      <mesh ref={legFL} position={[0.2, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={black} roughness={0.74} metalness={0.02} />
      </mesh>
      <mesh ref={legFR} position={[-0.2, 0.1, 0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={blackVariant} roughness={0.74} metalness={0.02} />
      </mesh>
      <mesh ref={legBL} position={[0.2, 0.1, -0.18]} castShadow>
        <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
        <meshStandardMaterial color={black} roughness={0.74} metalness={0.02} />
      </mesh>
      <mesh ref={legBR} position={[-0.2, 0.1, -0.18]} castShadow>
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
