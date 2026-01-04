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

export function DogModel({ state, onPetTap, setPetPosition }: {
  state: PetGame2State;
  onPetTap: () => void;
  setPetPosition?: (pos: [number, number, number]) => void;
}) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  // GET DNA
  const dna = useMemo(() => BREED_DNA[state.breed], [state.breed]);

  // Scale factor to match large environment
  const SCALE = 3.2;

  // VISUAL STATE: SICKNESS / EMOTION (Placeholder logic)
  // In a real implementation, we'd check state.stats.health etc.
  // For now, assume healthy unless specific interactions happen
  const isSick = state.interaction.kind === 'idle' && Math.random() > 2; // always false for now, can be wired up

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

  // Eyes - Wet glass, high specular
  const matEye = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#0a0a0a',
    roughness: 0.08, // Wet cornea
    metalness: 0.20  // Specular highlight
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (root.current) {
      // AAA Multi-Layer Breathing System
      const breathRate = 1.6; // Base breathing cycle

      // Primary breathing (chest) - Most pronounced
      const breathPrimary = Math.sin(t * breathRate) * 0.022;

      // Secondary (shoulders lag 0.3s) - Subtle
      const breathShoulders = Math.sin((t - 0.3) * breathRate) * 0.015;

      // Tertiary (overall body expansion) - Minimal
      const breathBody = Math.sin((t - 0.1) * breathRate) * 0.008;

      // Apply layered breathing
      root.current.scale.x = SCALE * (1.0 + breathBody);
      root.current.scale.y = SCALE * (1.0 + breathPrimary);
      root.current.scale.z = SCALE * (1.0 + breathBody * 0.6);

      // Subtle shoulder lift (via position adjustment)
      root.current.position.y = (root.current.position.y || 0) * 0.9 + breathShoulders * 0.02;
    }

    if (head.current) {
      // AAA Reactive Head Movement - Perlin noise + micro-adjustments
      const baseNoise = Math.sin(t * 0.8) * Math.cos(t * 1.3) * 0.05; // Perlin-like
      const nod = subtleNod(t, 1.2) * 0.08;

      head.current.rotation.x = -0.1 + nod + baseNoise * 0.5;

      // Slower, more natural head turn
      head.current.rotation.y = Math.sin(t * 0.4) * 0.12 + baseNoise;

      // Breathing affects neck angle slightly
      const breathNeck = Math.sin((t - 0.5) * 1.6) * 0.006;
      head.current.rotation.x += breathNeck;
    }

    if (tail.current) {
      // More natural wag - not constant mechanical motion
      const wagSpeed = 8.0; // Slightly slower
      const wagAmp = 0.5; // Reduced amplitude
      const wagVariation = Math.sin(t * 0.3) * 0.2; // Irregular rhythm
      tail.current.rotation.y = Math.sin(t * wagSpeed + wagVariation) * wagAmp;
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
      // Snap to latest usually
      // logic from original...
      const [cx, cy, cz] = state.currentPosition;
      if (state.interaction.kind !== 'navigating') {
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

          {/* Eyes - Improved wetness and realism */}
          <mesh position={[0.09, 0.08, 0.12]} castShadow material={matEye}>
            <sphereGeometry args={[0.045, 12, 12]} />
          </mesh>
          <mesh position={[-0.09, 0.08, 0.12]} castShadow material={matEye}>
            <sphereGeometry args={[0.045, 12, 12]} />
          </mesh>

          {/* Ears - Asymmetric positioning (left 3° more forward) */}
          <group>
            {/* Left Ear - More forward */}
            <mesh
              position={[-dna.ears.position[0], dna.ears.position[1] * 1.02, dna.ears.position[2]]}
              rotation={[dna.ears.rotation[0] - 0.052, -dna.ears.rotation[1], -dna.ears.rotation[2]]}
              castShadow material={matEarsInner}
            >
              <boxGeometry args={dna.ears.scale} />
            </mesh>
            {/* Right Ear */}
            <mesh
              position={[dna.ears.position[0], dna.ears.position[1], dna.ears.position[2]]}
              rotation={[dna.ears.rotation[0], dna.ears.rotation[1], dna.ears.rotation[2]]}
              castShadow material={matEarsInner}
            >
              <boxGeometry args={dna.ears.scale} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Legs - Improved positioning with forward center of gravity */}
      {[
        // Front Left - Positioned 4% forward, 55% weight bias
        { pos: [(dna.body.width / 2 - 0.02) * 1.01, dna.legs.height / 2, (dna.body.length / 2 - 0.1) * 1.04] as [number, number, number], splay: 0.035 },
        // Front Right
        { pos: [-(dna.body.width / 2 - 0.02) * 0.99, dna.legs.height / 2, (dna.body.length / 2 - 0.1) * 1.04] as [number, number, number], splay: -0.035 },
        // Back Left - Wider stance (2% more)
        { pos: [(dna.body.width / 2 - 0.02) * 1.02, dna.legs.height / 2, (-dna.body.length / 2 + 0.1)] as [number, number, number], splay: 0.05 },
        // Back Right
        { pos: [-(dna.body.width / 2 - 0.02) * 1.02, dna.legs.height / 2, (-dna.body.length / 2 + 0.1)] as [number, number, number], splay: -0.05 },
      ].map((leg, i) => (
        <group key={i} position={leg.pos} rotation={[0, 0, leg.splay]}>
          <mesh castShadow material={matLegs}>
            <capsuleGeometry args={[dna.legs.thickness, dna.legs.height, 4, 8]} />
          </mesh>
          {/* Paw - Flattened for better ground contact */}
          <mesh position={[0, -dna.legs.height / 2 - 0.01, 0.02]} rotation={[-Math.PI / 2, 0, 0]} material={matPaws}>
            <cylinderGeometry args={[dna.legs.thickness * 1.1, dna.legs.thickness, 0.04, 12]} />
          </mesh>
        </group>
      ))}

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

      <ContactShadow
        position={[0, 0.01, 0]}
        scale={[dna.body.width * 4, dna.body.length * 3, 1]}
        opacity={0.6}
        blur={0.8}
      />
    </group>
  );
}
