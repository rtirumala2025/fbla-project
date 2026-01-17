import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { PetGame2State, PetBreed } from '../core/SceneManager';
import { breathe, subtleNod } from '../animations/idle';
import { pop } from '../animations/interact';
import { ContactShadow } from '../core/ContactShadow';

// --- AAA PARAMETRIC SYSTEM ---
export interface DogDNA {
  headScale: [number, number, number];
  snout: {
    length: number;
    width: number;
    shape: 'box' | 'round'; // box=bulky (lab), round=pointy (shepherd)
    position: [number, number, number];
  };
  ears: {
    type: 'floppy' | 'pointy' | 'button';
    scale: [number, number, number];
    position: [number, number, number];
    rotation: [number, number, number];
  };
  body: {
    length: number; // trunk length
    width: number;
    height: number;
  };
  tail: {
    length: number;
    curl: number; // 0 = straight, 1 = curly
    height: number; // carry height
  };
  legs: {
    height: number;
    thickness: number;
  };
  colors: {
    primary: string;
    secondary: string; // patches/muzzle
    accent: string;    // ears/paws
  };
  fur: {
    roughness: number;
    textureScale: number;
  };
}

const BREED_DNA: Record<PetBreed, DogDNA> = {
  labrador: {
    headScale: [1.02, 0.98, 1.05], // Slightly broader, rounder
    snout: { length: 0.16, width: 0.15, shape: 'box', position: [0, -0.04, 0.2] },
    ears: {
      type: 'floppy',
      scale: [0.09, 0.24, 0.04], // Longer, droopier
      position: [0.18, 0.14, -0.05],
      rotation: [0.25, 0, 0.45] // More droop
    },
    body: { length: 0.45, width: 0.26, height: 0.26 }, // Broader chest, solid build
    tail: { length: 0.38, curl: 0.08, height: 0 }, // Otter tail (thicker base)
    legs: { height: 0.26, thickness: 0.082 }, // Thicker, sturdy legs
    colors: { primary: '#e3cca5', secondary: '#ebdcb8', accent: '#d9b891' }, // Golden Lab
    fur: { roughness: 0.5, textureScale: 1 }
  },
  shepherd: {
    headScale: [0.92, 1.08, 1.08], // Narrower, taller, alert
    snout: { length: 0.24, width: 0.10, shape: 'round', position: [0, -0.05, 0.24] }, // Longer snout
    ears: {
      type: 'pointy',
      scale: [0.10, 0.24, 0.02], // Taller, thinner, more alert
      position: [0.13, 0.30, -0.02],
      rotation: [-0.3, 0.2, 0.05] // More upright/alert
    },
    body: { length: 0.50, width: 0.21, height: 0.26 }, // Longer, leaner, athletic
    tail: { length: 0.48, curl: 0.03, height: -0.25 }, // Bushy, lower carry
    legs: { height: 0.32, thickness: 0.060 }, // Taller, leaner legs
    colors: { primary: '#966844', secondary: '#1a1a1a', accent: '#1a1a1a' }, // Classic saddle
    fur: { roughness: 0.7, textureScale: 1.2 }
  },
  pug: {
    headScale: [1.28, 0.85, 1.12], // Much wider, flatter
    snout: { length: 0.03, width: 0.17, shape: 'box', position: [0, -0.09, 0.13] }, // Extremely flat
    ears: {
      type: 'button',
      scale: [0.07, 0.10, 0.04], // Smaller, rounder
      position: [0.22, 0.16, 0.06],
      rotation: [0.6, 0, 0.9] // Folded back
    },
    body: { length: 0.30, width: 0.30, height: 0.25 }, // Very compact, barrel-chested
    tail: { length: 0.12, curl: 3.2, height: 0.15 }, // Tight curl, carried high
    legs: { height: 0.14, thickness: 0.085 }, // Very short, stubby
    colors: { primary: '#d6c8b4', secondary: '#2b2622', accent: '#2b2622' }, // Fawn with black mask
    fur: { roughness: 0.4, textureScale: 0.8 }
  }
};

// AAA EMOTIONAL POSTURE SYSTEM
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

export function DogModel({ state, onPetTap, setPetPosition, stats, targetRef, isMovingRef, rotationRef, accessories = [] }: {
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
  const tail = useRef<THREE.Group>(null);
  const earLeft = useRef<THREE.Mesh>(null);
  const earRight = useRef<THREE.Mesh>(null);
  const legFL = useRef<THREE.Group>(null);
  const legFR = useRef<THREE.Group>(null);
  const legBL = useRef<THREE.Group>(null);
  const legBR = useRef<THREE.Group>(null);
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

  // Optimize: Reuse vectors for movement
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const lastPosUpdate = useRef(0);

  // GET DNA
  const dna = useMemo(() => {
    const resolved = BREED_DNA[state.breed] || BREED_DNA['labrador'];
    const isFound = !!BREED_DNA[state.breed];
    console.log(`🐶 DogModel: requestedBreed="${state.breed}" → DNA=${isFound ? 'FOUND' : 'FALLBACK_LABRADOR'} → colors=${JSON.stringify(resolved?.colors)}`);
    return resolved;
  }, [state.breed]);

  // Scale factor to match large environment - NORMALIZED for Pro Scale
  const SCALE = 1.2;

  // EMOTIONAL STATE SYSTEM
  const emotionalPose = useMemo(() => getEmotionalPose(stats), [stats]);

  // AAA MATERIAL SYSTEM - Multi-Zone Fur Response
  // Different body areas have different fur characteristics

  // Chest/Belly - Fluffy, diffuse
  const matChest = useMemo(() => new THREE.MeshStandardMaterial({
    color: dna.colors.primary,
    roughness: 0.72,
    metalness: 0.02,
  }), [dna]);

  // Back/Guard hairs - Sleeker, slight sheen
  const matBack = useMemo(() => new THREE.MeshStandardMaterial({
    color: dna.colors.primary,
    roughness: 0.58,
    metalness: 0.04,
  }), [dna]);

  // Face/Head - Short fur, more reflective
  const matFace = useMemo(() => new THREE.MeshStandardMaterial({
    color: dna.colors.secondary,
    roughness: 0.48,
    metalness: 0.05,
  }), [dna]);

  // Legs - Medium fur
  const matLegs = useMemo(() => new THREE.MeshStandardMaterial({
    color: dna.colors.accent,
    roughness: 0.62,
    metalness: 0.03,
  }), [dna]);

  // Paw pads - Leather-like, slight wetness
  const matPaws = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2a2a2a',
    roughness: 0.35,
    metalness: 0.08,
  }), []);

  // Ears (inner) - Thin skin, light transmission
  const matEarsInner = useMemo(() => new THREE.MeshStandardMaterial({
    color: dna.colors.accent,
    roughness: 0.28,
    metalness: 0.06,
  }), [dna]);

  // Nose leather - Most reflective, wet appearance
  const matNose = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 0.25,
    metalness: 0.12
  }), []);

  // Eyes - Sclera (White)
  const matEye = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.1,  // Glossy
    metalness: 0.1,  // Not metallic
  }), []);

  const matTongue = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ff6b8b',
    roughness: 0.4,
    metalness: 0.05,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // AAA Multi-Layer Breathing System (Emotion-Modulated)
    const breathRate = 1.6 * emotionalPose.breathing_rate;

    if (root.current) {
      // Primary breathing (chest) - Most pronounced
      const breathPrimary = Math.sin(t * breathRate) * 0.022 * emotionalPose.chest_expansion;

      // Secondary (shoulders lag 0.3s) - Subtle
      const breathShoulders = Math.sin((t - 0.3) * breathRate) * 0.015;

      // Tertiary (overall body expansion) - Minimal
      const breathBody = Math.sin((t - 0.1) * breathRate) * 0.008;

      // Apply layered breathing with emotion
      root.current.scale.x = SCALE * emotionalPose.shoulder_hunch * (1.0 + breathBody);
      root.current.scale.y = SCALE * (1.0 + breathPrimary);
      root.current.scale.z = SCALE * (1.0 + breathBody * 0.6);

      // Subtle shoulder lift (via position adjustment)
      root.current.position.y = (root.current.position.y || 0) * 0.9 + breathShoulders * 0.02;

      // Spine curve from emotional state
      root.current.rotation.z = emotionalPose.spine_curve;
    }

    if (head.current) {
      // AAA Perlin Noise Head Drift (replaces mechanical sin/cos)
      const driftPitch = (perlinNoise1D(t * 0.5, 1) * 2 - 1) * 0.04 * emotionalPose.micro_movement_scale;
      const driftYaw = (perlinNoise1D(t * 0.3, 2) * 2 - 1) * 0.06 * emotionalPose.micro_movement_scale;
      const driftRoll = (perlinNoise1D(t * 0.8, 3) * 2 - 1) * 0.015 * emotionalPose.micro_movement_scale;

      const nod = subtleNod(t, 1.2) * 0.08 * emotionalPose.micro_movement_scale;

      // Apply emotional head posture + organic drift
      head.current.rotation.x = emotionalPose.head_pitch + nod + driftPitch;
      head.current.rotation.y = driftYaw;
      head.current.rotation.z = emotionalPose.head_roll + driftRoll;

      // Breathing affects neck angle slightly
      const breathNeck = Math.sin((t - 0.5) * breathRate) * 0.006;
      head.current.rotation.x += breathNeck;
    }

    // AAA Stochastic Weight Shifts (6-12s intervals)
    const now = performance.now();
    const ws = weightShiftState.current;

    if (now >= ws.nextShiftTime && !ws.isShifting) {
      // Trigger new weight shift
      ws.isShifting = true;
      ws.shiftStartTime = now;
      ws.shiftDuration = 1200; // ms
      ws.targetX = (Math.random() - 0.5) * 0.036; // ±0.018 (lateral shift)
      ws.targetZ = (Math.random() - 0.5) * 0.04;  // ±0.02 (fore/aft)
      ws.nextShiftTime = now + 6000 + Math.random() * 6000; // 6-12s
    }

    if (ws.isShifting) {
      const elapsed = now - ws.shiftStartTime;
      const progress = Math.min(1, elapsed / ws.shiftDuration);

      // Ease-in-out cubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      ws.currentX = ws.currentX * (1 - eased) + ws.targetX * eased;
      ws.currentZ = ws.currentZ * (1 - eased) + ws.targetZ * eased;

      if (progress >= 1) {
        ws.isShifting = false;
      }

      // Apply weight shift to root
      if (root.current) {
        root.current.position.x += ws.currentX;
        root.current.position.z += ws.currentZ;
      }

      // Compensatory head turn toward weight
      if (head.current) {
        head.current.rotation.y += -ws.currentX * 0.3;
      }
    }

    // AAA Async Ear Twitches
    const et = earTwitchState.current;

    // Left ear
    if (now >= et.left.nextTime) {
      et.left.nextTime = now + 2500 + Math.random() * 5500; // 2.5-8s
      et.left.amplitude = 0.10 + Math.random() * 0.12; // 0.10-0.22 rad
      et.left.duration = 600; // ms (out + hold + return)
      et.left.progress = 0;
    }

    const lTwitchX = (et.left.progress < 1) ? (et.left.amplitude * (et.left.progress < 0.15 ? (et.left.progress / 0.15) : et.left.progress < 0.45 ? 1 : (1 - (et.left.progress - 0.45) / 0.55))) : 0;
    if (et.left.progress < 1) {
      et.left.progress = Math.min(1, et.left.progress + (1000 / 60) / et.left.duration);
    }
    if (earLeft.current) {
      earLeft.current.rotation.x = (dna.ears.rotation[0] - 0.052) + (1 - emotionalPose.ear_tension) * 0.35 + lTwitchX;
      earLeft.current.rotation.z = -dna.ears.rotation[2] + (1 - emotionalPose.ear_tension) * 0.15;
    }

    // Right ear (same logic, independent timing)
    if (now >= et.right.nextTime) {
      et.right.nextTime = now + 3000 + Math.random() * 5500; // 3-8.5s (offset from left)
      et.right.amplitude = 0.10 + Math.random() * 0.12;
      et.right.duration = 600;
      et.right.progress = 0;
    }

    const rTwitchX = (et.right.progress < 1) ? (et.right.amplitude * (et.right.progress < 0.15 ? (et.right.progress / 0.15) : et.right.progress < 0.45 ? 1 : (1 - (et.right.progress - 0.45) / 0.55))) : 0;
    if (et.right.progress < 1) {
      et.right.progress = Math.min(1, et.right.progress + (1000 / 60) / et.right.duration);
    }
    if (earRight.current) {
      earRight.current.rotation.x = dna.ears.rotation[0] + (1 - emotionalPose.ear_tension) * 0.35 + rTwitchX;
      earRight.current.rotation.z = dna.ears.rotation[2] - (1 - emotionalPose.ear_tension) * 0.15;
    }

    if (tail.current) {
      // Emotional tail motion - Complex layering
      if (emotionalPose.tail_wag_speed === 0) {
        // Subtle drift even when "still" (sad/sick)
        const drift = Math.sin(t * 0.4) * 0.03;
        tail.current.rotation.y = drift;
      } else {
        // Active wag with emotional variation
        const wagSpeed = emotionalPose.tail_wag_speed;
        const wagAmp = emotionalPose.tail_wag_amp;
        const wagVariation = Math.sin(t * 0.3) * 0.2; // Irregular rhythm
        tail.current.rotation.y = Math.sin(t * wagSpeed + wagVariation) * wagAmp + emotionalPose.tail_offset * 0.3;
      }
    }

    // Navigation logic (same as before)
    if (state.interaction.kind === 'navigating' && state.navigationState.target && root.current) {
      const { startPosition, endPosition, progress } = state.navigationState;
      const x = startPosition[0] + (endPosition[0] - startPosition[0]) * progress;
      const y = startPosition[1] + (endPosition[1] - startPosition[1]) * progress;
      const z = startPosition[2] + (endPosition[2] - startPosition[2]) * progress;

      root.current.position.set(x, y, z);
      const dx = endPosition[0] - startPosition[0];
      const dz = endPosition[2] - startPosition[2];
      root.current.rotation.y = Math.atan2(dx, dz);

      const walkCycle = Math.sin(progress * Math.PI * 16) * 0.1; // faster feet
      root.current.position.y = y + Math.abs(walkCycle);

      setPetPosition?.([x, y, z]);
    } else if (root.current && state.currentPosition) {
      // Snap to latest usually - BUT SKIP if user is manually moving
      const isMovingManually = keys.forward || keys.backward || keys.left || keys.right;
      if (state.interaction.kind !== 'navigating' && !isMovingManually) {
        const [cx, cy, cz] = state.currentPosition;
        root.current.position.set(cx, cy, cz);
      }
    }

    // Interaction Pop
    if (state.interaction.kind !== 'idle' && root.current) {
      const startedAt = state.interaction.startedAt;
      const localT = Math.min(1, (performance.now() - startedAt) / 450);
      const s = SCALE * (1 + pop(localT) * 0.06);
      root.current.scale.setScalar(s);
    }

    // KEYBOARD MOVEMENT
    if (root.current && (keys.forward || keys.backward || keys.left || keys.right)) {
      const delta = 0.016; // Fixed 60fps step
      const moveSpeed = 11.0 * delta;
      const rotateSpeed = 3.0 * delta;

      // COLLISION DETECTION: Save position BEFORE movement
      const prevX = root.current.position.x;
      const prevZ = root.current.position.z;

      // Calculate forward direction
      forward.set(0, 0, 1).applyQuaternion(root.current.quaternion);

      // Apply rotation (turning doesn't need collision check)
      if (keys.left) {
        root.current.rotation.y += rotateSpeed;
      }
      if (keys.right) {
        root.current.rotation.y -= rotateSpeed;
      }

      // Apply movement
      if (keys.forward) {
        root.current.position.addScaledVector(forward, moveSpeed);
      }
      if (keys.backward) {
        root.current.position.addScaledVector(forward, -moveSpeed * 0.6);
      }

      // Walk cycle
      const walkCycle = Math.sin(t * 12) * 0.15;
      root.current.position.y = (root.current.position.y || 0) * 0.9 + Math.abs(walkCycle) * 0.1;

      // COLLISION CHECK: Get valid position (slides along walls if collision detected)
      const [validX, validZ] = getValidPosition(
        prevX,
        prevZ,
        root.current.position.x,
        root.current.position.z
      );

      // Apply collision-corrected position
      root.current.position.x = validX;
      root.current.position.z = validZ;

      // Boundary Check (Clamp to +/- 58 units)
      const [clampedX, clampedZ] = clampToBounds(root.current.position.x, root.current.position.z, 58);
      root.current.position.x = clampedX;
      root.current.position.z = clampedZ;

      // Update Shared Target Ref for Camera (Smooth 60fps)
      if (targetRef) {
        targetRef.current.copy(root.current.position);
      }
      if (rotationRef) {
        rotationRef.current.copy(root.current.quaternion);
      }
      if (isMovingRef) isMovingRef.current = true;

      // THROTTLED STATE SYNC (Performance Critical)
      // Only update React state every 100ms to allow UI updates without killing FPS
      const now = performance.now();
      if (now - lastPosUpdate.current > 100) {
        setPetPosition?.([root.current.position.x, root.current.position.y, root.current.position.z]);
        lastPosUpdate.current = now;
      }

      // PROCEDURAL ANIMATION: Leg Movement & Body Banking
      const walkTime = t * 12; // Speed of legs
      const legAmplitude = 0.5; // Depth of swing

      // Front Left / Back Right (Diagonal Pair 1)
      if (legFL.current) legFL.current.rotation.x = Math.sin(walkTime) * legAmplitude;
      if (legBR.current) legBR.current.rotation.x = Math.sin(walkTime) * legAmplitude;

      // Front Right / Back Left (Diagonal Pair 2) - Offset by PI
      if (legFR.current) legFR.current.rotation.x = Math.sin(walkTime + Math.PI) * legAmplitude;
      if (legBL.current) legBL.current.rotation.x = Math.sin(walkTime + Math.PI) * legAmplitude;

      // Bank into turns
      let targetBank = 0;
      if (keys.left) targetBank = 0.15;
      if (keys.right) targetBank = -0.15;

      root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, targetBank, 0.1);
    } else {
      // Stopped - Snap one last time to ensure accuracy
      if (performance.now() - lastPosUpdate.current > 500 && Math.abs((root.current?.position.x || 0) - (state.currentPosition?.[0] || 0)) > 0.1) {
        setPetPosition?.([root.current?.position.x || 0, root.current?.position.y || 0, root.current?.position.z || 0]);
        lastPosUpdate.current = performance.now();
      }

      // Update Shared Target Ref when stopped too (to catch snap)
      if (targetRef && root.current) {
        targetRef.current.copy(root.current.position);
      }
      if (rotationRef && root.current) {
        rotationRef.current.copy(root.current.quaternion);
      }
      if (isMovingRef) isMovingRef.current = false;

      // Return to neutral when stopped
      if (legFL.current) legFL.current.rotation.x = THREE.MathUtils.lerp(legFL.current.rotation.x, 0, 0.1);
      if (legFR.current) legFR.current.rotation.x = THREE.MathUtils.lerp(legFR.current.rotation.x, 0, 0.1);
      if (legBL.current) legBL.current.rotation.x = THREE.MathUtils.lerp(legBL.current.rotation.x, 0, 0.1);
      if (legBR.current) legBR.current.rotation.x = THREE.MathUtils.lerp(legBR.current.rotation.x, 0, 0.1);

      if (root.current) root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, emotionalPose.spine_curve, 0.1);
    }
  });

  return (
    <group
      ref={root}
      position={[0, 0, 0]}
      onPointerEnter={(e) => { e.stopPropagation(); setIsHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerLeave={(e) => { e.stopPropagation(); setIsHovered(false); document.body.style.cursor = 'auto'; }}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (state.interaction.kind !== 'navigating') onPetTap();
      }}
    >
      {/* --- AAA PARAMETRIC BODY WITH REALISTIC FORM --- */}

      {/* Chest Section - Broader at sternum for realistic depth */}
      <mesh
        position={[0, dna.legs.height + dna.body.height / 2 - 0.05, dna.body.length / 4]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
        material={matChest}
      >
        <capsuleGeometry args={[dna.body.width / 1.8 * 1.15, dna.body.length / 2, 8, 16]} />
      </mesh>

      {/* Rear Section - Slightly lower for hip settling */}
      <mesh
        position={[0, (dna.legs.height + dna.body.height / 2 - 0.05) * 0.97, -dna.body.length / 4]}
        rotation={[Math.PI / 2, 0, 0.03]} // Slight spine curve
        castShadow
        receiveShadow
        material={matBack}
      >
        <capsuleGeometry args={[dna.body.width / 1.8, dna.body.length / 2, 8, 16]} />
      </mesh>

      {/* Neck & Head Anchor */}
      <group position={[0, dna.legs.height + dna.body.height - 0.05, dna.body.length / 2 - 0.05]}>
        {/* Neck - More pronounced */}
        <mesh rotation={[-0.4, 0, 0.026]} position={[0, 0.1, -0.05]} castShadow material={matFace}>
          <capsuleGeometry args={[dna.body.width * 0.6, 0.25, 4, 8]} />
        </mesh>

        {/* Head Group - Subtle asymmetry with 1.5° right tilt */}
        <group ref={head} position={[0, 0.3, 0.05]} rotation={[0, 0, 0.026]} scale={dna.headScale}>
          {/* Skull */}
          <mesh castShadow material={matFace}>
            <sphereGeometry args={[0.22, 20, 20]} />
          </mesh>

          {/* Snout */}
          <mesh position={dna.snout.position} rotation={[0.1, 0, 0]} castShadow material={matFace}>
            <capsuleGeometry args={[dna.snout.width / 2, dna.snout.length, 4, 12]} />
          </mesh>

          {/* Nose Leather - Improved material */}
          <mesh position={[dna.snout.position[0], dna.snout.position[1] - 0.02, dna.snout.position[2] + dna.snout.length / 2 + 0.04]} castShadow material={matNose}>
            <sphereGeometry args={[0.04, 8, 8]} />
          </mesh>

          {/* Eyes - Moved forward (z=0.18) and added pupils */}
          <group position={[0.085, 0.09, 0.18]}>
            {/* Eye Ball */}
            <mesh castShadow material={matEye}>
              <sphereGeometry args={[0.045, 12, 12]} />
            </mesh>
            {/* Pupil Detail */}
            <mesh position={[0, 0, 0.046]} material={new THREE.MeshBasicMaterial({ color: '#000000' })}>
              <circleGeometry args={[0.02, 12]} />
            </mesh>
            {/* Eyelid (Upper) */}
            <mesh
              position={[0, 0.033, 0.012]}
              scale={[1.15, 1 - (emotionalPose.eye_squint * 0.82 * (blinkState.current.progress < 0.15 || blinkState.current.progress > 0.85 ? 0 : 1)), 1.15]}
              material={matFace}
            >
              <sphereGeometry args={[0.046, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          </group>

          <group position={[-0.085, 0.09, 0.18]}>
            {/* Eye Ball */}
            <mesh castShadow material={matEye}>
              <sphereGeometry args={[0.045, 12, 12]} />
            </mesh>
            {/* Pupil Detail */}
            <mesh position={[0, 0, 0.046]} material={new THREE.MeshBasicMaterial({ color: '#000000' })}>
              <circleGeometry args={[0.02, 12]} />
            </mesh>
            {/* Eyelid (Upper) */}
            <mesh
              position={[0, 0.033, 0.012]}
              scale={[1.15, 1 - (emotionalPose.eye_squint * 0.82 * (blinkState.current.progress < 0.15 || blinkState.current.progress > 0.85 ? 0 : 1)), 1.15]}
              material={matFace}
            >
              <sphereGeometry args={[0.046, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          </group>

          {/* Tongue / Mouth - Panting logic */}
          {emotionalPose.mouth_open > 0 && (
            <group position={[0, dna.snout.position[1] - 0.05, dna.snout.position[2] + 0.05]}>
              <mesh rotation={[0.4, 0, 0]} material={matTongue} position={[0, -0.02, 0.05]}>
                <capsuleGeometry args={[0.04, 0.08 * emotionalPose.mouth_open, 4, 8]} />
              </mesh>
            </group>
          )}

          {/* Ears - Asymmetric positioning (left 3° more forward) */}
          <group>
            {/* Left Ear - More forward */}
            <mesh
              ref={earLeft}
              position={[-dna.ears.position[0], dna.ears.position[1] * 1.02, dna.ears.position[2]]}
              rotation={[dna.ears.rotation[0] - 0.052, -dna.ears.rotation[1], -dna.ears.rotation[2]]}
              castShadow material={matEarsInner}
            >
              <boxGeometry args={dna.ears.scale} />
            </mesh>
            {/* Right Ear */}
            <mesh
              ref={earRight}
              position={[dna.ears.position[0], dna.ears.position[1], dna.ears.position[2]]}
              rotation={[dna.ears.rotation[0], dna.ears.rotation[1], dna.ears.rotation[2]]}
              castShadow material={matEarsInner}
            >
              <boxGeometry args={dna.ears.scale} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Legs - Individual Groups with Refs for Animation */}

      {/* Front Left */}
      <group ref={legFL} position={[(dna.body.width / 2 - 0.02) * 1.01, dna.legs.height / 2 * 0.97, (dna.body.length / 2 - 0.1) * 1.04]} rotation={[-0.14, 0, 0.14]}>
        <mesh position={[0, dna.legs.height / 2 * 0.82, 0]} castShadow material={matLegs}>
          <sphereGeometry args={[dna.legs.thickness * 1.15, 8, 8]} />
        </mesh>
        <mesh castShadow material={matLegs}>
          <capsuleGeometry args={[dna.legs.thickness, dna.legs.height, 6, 10]} />
        </mesh>
        <mesh position={[0, -dna.legs.height / 2 - 0.01, 0.02]} rotation={[-Math.PI / 2, 0, 0]} material={matPaws}>
          <cylinderGeometry args={[dna.legs.thickness * 1.15, dna.legs.thickness * 0.95, 0.04, 12]} />
        </mesh>
      </group>

      {/* Front Right */}
      <group ref={legFR} position={[-(dna.body.width / 2 - 0.02) * 0.99, dna.legs.height / 2, (dna.body.length / 2 - 0.1) * 1.04]} rotation={[-0.14, 0, -0.087]}>
        <mesh position={[0, dna.legs.height / 2 * 0.82, 0]} castShadow material={matLegs}>
          <sphereGeometry args={[dna.legs.thickness * 1.15, 8, 8]} />
        </mesh>
        <mesh castShadow material={matLegs}>
          <capsuleGeometry args={[dna.legs.thickness, dna.legs.height, 6, 10]} />
        </mesh>
        <mesh position={[0, -dna.legs.height / 2 - 0.01, 0.02]} rotation={[-Math.PI / 2, 0, 0]} material={matPaws}>
          <cylinderGeometry args={[dna.legs.thickness * 1.15, dna.legs.thickness * 0.95, 0.04, 12]} />
        </mesh>
      </group>

      {/* Back Left */}
      <group ref={legBL} position={[(dna.body.width / 2 - 0.02) * 1.02, dna.legs.height / 2 * 0.98, (-dna.body.length / 2 + 0.1) * 0.92]} rotation={[0.09, 0, 0.087]}>
        <mesh castShadow material={matLegs}>
          <capsuleGeometry args={[dna.legs.thickness, dna.legs.height, 6, 10]} />
        </mesh>
        <mesh position={[0, -dna.legs.height / 2 - 0.01, 0.02]} rotation={[-Math.PI / 2, 0, 0]} material={matPaws}>
          <cylinderGeometry args={[dna.legs.thickness * 1.15, dna.legs.thickness * 0.95, 0.04, 12]} />
        </mesh>
      </group>

      {/* Back Right */}
      <group ref={legBR} position={[-(dna.body.width / 2 - 0.02) * 1.02, dna.legs.height / 2 * 0.98, (-dna.body.length / 2 + 0.1) * 0.92]} rotation={[0.09, 0, -0.087]}>
        <mesh castShadow material={matLegs}>
          <capsuleGeometry args={[dna.legs.thickness, dna.legs.height, 6, 10]} />
        </mesh>
        <mesh position={[0, -dna.legs.height / 2 - 0.01, 0.02]} rotation={[-Math.PI / 2, 0, 0]} material={matPaws}>
          <cylinderGeometry args={[dna.legs.thickness * 1.15, dna.legs.thickness * 0.95, 0.04, 12]} />
        </mesh>
      </group>

      {/* === EQUIPPED ACCESSORIES RENDERING === */}
      {accessories.map(acc => {
        const accMaterial = new THREE.MeshStandardMaterial({
          color: acc.color,
          roughness: 0.35,
          metalness: 0.15,
        });

        switch (acc.slot) {
          case 'collar':
            // Collar around neck - positioned at neck/body junction
            return (
              <group key={acc.id} position={[0, dna.legs.height + dna.body.height - 0.05, dna.body.length / 2 - 0.08]}>
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={accMaterial}>
                  <torusGeometry args={[dna.body.width * 0.45, 0.025, 8, 24]} />
                </mesh>
                {/* Collar tag/charm */}
                <mesh position={[0, -dna.body.width * 0.42, 0.02]} castShadow material={accMaterial}>
                  <sphereGeometry args={[0.035, 8, 8]} />
                </mesh>
              </group>
            );

          case 'bandana':
            // Bandana - triangle at neck, front-facing
            return (
              <group key={acc.id} position={[0, dna.legs.height + dna.body.height - 0.1, dna.body.length / 2 - 0.05]}>
                {/* Triangle fabric */}
                <mesh rotation={[0.3, 0, 0]} position={[0, -0.06, 0.08]} castShadow material={accMaterial}>
                  <coneGeometry args={[0.12, 0.15, 3]} />
                </mesh>
                {/* Neck band */}
                <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={accMaterial}>
                  <torusGeometry args={[dna.body.width * 0.42, 0.018, 6, 20]} />
                </mesh>
              </group>
            );

          case 'hat':
            // Hat on top of head - rendered in head group space
            return (
              <group key={acc.id} position={[0, dna.legs.height + dna.body.height + 0.35, dna.body.length / 2 + 0.03]}>
                {/* Crown */}
                <mesh position={[0, 0.08, 0]} castShadow material={accMaterial}>
                  <cylinderGeometry args={[0.08, 0.1, 0.1, 8]} />
                </mesh>
                {/* Brim */}
                <mesh rotation={[0, 0, 0]} castShadow material={accMaterial}>
                  <cylinderGeometry args={[0.16, 0.16, 0.02, 12]} />
                </mesh>
              </group>
            );

          case 'glasses':
            // Sunglasses on face
            return (
              <group key={acc.id} position={[0, dna.legs.height + dna.body.height + 0.2, dna.body.length / 2 + 0.25]}>
                {/* Left lens */}
                <mesh position={[0.065, 0, 0]} castShadow>
                  <sphereGeometry args={[0.045, 12, 12]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.3} />
                </mesh>
                {/* Right lens */}
                <mesh position={[-0.065, 0, 0]} castShadow>
                  <sphereGeometry args={[0.045, 12, 12]} />
                  <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.3} />
                </mesh>
                {/* Bridge */}
                <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={accMaterial}>
                  <capsuleGeometry args={[0.012, 0.06, 4, 6]} />
                </mesh>
                {/* Arms */}
                <mesh position={[0.11, 0, -0.04]} rotation={[0, 0.3, 0]} castShadow material={accMaterial}>
                  <boxGeometry args={[0.08, 0.015, 0.015]} />
                </mesh>
                <mesh position={[-0.11, 0, -0.04]} rotation={[0, -0.3, 0]} castShadow material={accMaterial}>
                  <boxGeometry args={[0.08, 0.015, 0.015]} />
                </mesh>
              </group>
            );

          case 'back':
            // Cape or wings on back
            return (
              <group key={acc.id} position={[0, dna.legs.height + dna.body.height - 0.02, -0.05]}>
                {/* Cape/wing base */}
                <mesh rotation={[-0.3, 0, 0]} position={[0, 0, -0.1]} castShadow material={accMaterial}>
                  <boxGeometry args={[dna.body.width * 1.2, 0.02, 0.25]} />
                </mesh>
                {/* Cape flowing down */}
                <mesh rotation={[-0.6, 0, 0]} position={[0, -0.08, -0.15]} castShadow material={accMaterial}>
                  <boxGeometry args={[dna.body.width * 1.1, 0.02, 0.2]} />
                </mesh>
              </group>
            );

          default:
            return null;
        }
      })}

      {/* Tail - Lowered attachment (5%) and offset left (5°) */}
      <group ref={tail} position={[0.02, (dna.legs.height + dna.body.height - 0.1) * 0.95, -dna.body.length / 2]}>
        <mesh
          position={[0, 0, -dna.tail.length / 2]}
          rotation={[dna.tail.height - 0.5, 0.087, 0]} // 5° left offset
          castShadow material={matBack}
        >
          <capsuleGeometry args={[0.04, dna.tail.length, 4, 8]} />
        </mesh>
      </group>

      {/* AAA SHADOW SYSTEM - 4-Point Contact + Body AO */}
      {/* Central Body AO (Soft) */}
      <ContactShadow
        position={[0, 0.01, 0]}
        scale={[dna.body.width * 2.8, dna.body.length * 2.2, 1]}
        opacity={0.45}
        blur={1.2}
      />

      {/* Individual Paw Contact Shadows (Sharper) */}
      {[
        // Front Left
        [(dna.body.width / 2 - 0.02) * 1.01, (dna.body.length / 2 - 0.1) * 1.04],
        // Front Right
        [-(dna.body.width / 2 - 0.02) * 0.99, (dna.body.length / 2 - 0.1) * 1.04],
        // Back Left
        [(dna.body.width / 2 - 0.02) * 1.02, (-dna.body.length / 2 + 0.1) * 0.92],
        // Back Right
        [-(dna.body.width / 2 - 0.02) * 1.02, (-dna.body.length / 2 + 0.1) * 0.92]
      ].map((pos, i) => (
        <ContactShadow
          key={`shadow-${i}`}
          position={[pos[0] as number, 0.01, pos[1] as number]}
          scale={0.12}
          opacity={0.75}
          blur={0.4}
          far={0.2}
        />
      ))}
    </group>
  );
}
