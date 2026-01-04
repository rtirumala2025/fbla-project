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
    headScale: [1, 1, 1],
    snout: { length: 0.16, width: 0.14, shape: 'box', position: [0, -0.04, 0.2] },
    ears: {
      type: 'floppy',
      scale: [0.08, 0.22, 0.04],
      position: [0.18, 0.15, -0.05],
      rotation: [0.2, 0, 0.4]
    },
    body: { length: 0.45, width: 0.24, height: 0.24 },
    tail: { length: 0.35, curl: 0.1, height: 0 },
    legs: { height: 0.26, thickness: 0.075 },
    colors: { primary: '#e3cca5', secondary: '#ebdcb8', accent: '#d9b891' }, // Golden Lab
    fur: { roughness: 0.5, textureScale: 1 }
  },
  shepherd: {
    headScale: [0.95, 1.05, 1.05], // Narrower, taller head
    snout: { length: 0.22, width: 0.11, shape: 'round', position: [0, -0.05, 0.22] },
    ears: {
      type: 'pointy',
      scale: [0.09, 0.20, 0.03],
      position: [0.14, 0.28, -0.02],
      rotation: [-0.2, 0.2, 0.1]
    },
    body: { length: 0.48, width: 0.22, height: 0.25 }, // Athletic
    tail: { length: 0.45, curl: 0.05, height: -0.2 }, // Bushy, low
    legs: { height: 0.30, thickness: 0.065 }, // Lean legs
    colors: { primary: '#966844', secondary: '#1a1a1a', accent: '#1a1a1a' }, // Classic saddle
    fur: { roughness: 0.7, textureScale: 1.2 }
  },
  pug: {
    headScale: [1.2, 0.9, 1.1], // Wide, flat head
    snout: { length: 0.04, width: 0.16, shape: 'box', position: [0, -0.08, 0.14] }, // Flat face
    ears: {
      type: 'button',
      scale: [0.06, 0.12, 0.04],
      position: [0.2, 0.18, 0.05],
      rotation: [0.5, 0, 0.8]
    },
    body: { length: 0.32, width: 0.28, height: 0.24 }, // Compact, chunky
    tail: { length: 0.15, curl: 2.5, height: 0.1 }, // Curly tail
    legs: { height: 0.16, thickness: 0.08 }, // Short legs
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

  // MATERIALS
  const matPrimary = useMemo(() => new THREE.MeshStandardMaterial({
    color: dna.colors.primary,
    roughness: dna.fur.roughness,
    map: null // Could add noise map here for fur texture
  }), [dna]);

  const matSecondary = useMemo(() => new THREE.MeshStandardMaterial({
    color: dna.colors.secondary,
    roughness: dna.fur.roughness
  }), [dna]);

  const matAccent = useMemo(() => new THREE.MeshStandardMaterial({
    color: dna.colors.accent,
    roughness: dna.fur.roughness
  }), [dna]);

  const matNose = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1a1a1a',
    roughness: 0.3,
    metalness: 0.1
  }), []);

  const matEye = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#000000',
    roughness: 0.0,
    metalness: 0.5
  }), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (root.current) {
      // Breathing
      const b = breathe(t, 1.6);
      root.current.scale.x = SCALE * (1.0 + b * 0.015);
      root.current.scale.y = SCALE * (1.0 + b * 0.01);
      root.current.scale.z = SCALE * (1.0 + b * 0.01);
    }

    if (head.current) {
      const n = subtleNod(t, 1.2);
      head.current.rotation.x = -0.1 + n * 0.1;
      head.current.rotation.y = Math.sin(t * 0.5) * 0.15;
    }

    if (tail.current) {
      // Wag based on happiness/idle
      const wagSpeed = 10.0;
      const wagAmp = 0.6;
      tail.current.rotation.y = Math.sin(t * wagSpeed) * wagAmp;
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
      {/* --- PARAMETRIC BODY --- */}
      {/* Torso */}
      <mesh position={[0, dna.legs.height + dna.body.height / 2 - 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow material={matPrimary}>
        <capsuleGeometry args={[dna.body.width / 1.8, dna.body.length, 8, 16]} />
      </mesh>

      {/* Neck & Head Anchor */}
      <group position={[0, dna.legs.height + dna.body.height - 0.05, dna.body.length / 2 - 0.05]}>
        {/* Neck */}
        <mesh rotation={[-0.4, 0, 0]} position={[0, 0.1, -0.05]} castShadow material={matSecondary}>
          <capsuleGeometry args={[dna.body.width * 0.6, 0.25, 4, 8]} />
        </mesh>

        {/* Head Group */}
        <group ref={head} position={[0, 0.3, 0.05]} scale={dna.headScale}>
          {/* Skull */}
          <mesh castShadow material={matSecondary}>
            <sphereGeometry args={[0.22, 20, 20]} />
          </mesh>

          {/* Snout */}
          <mesh position={dna.snout.position} rotation={[0.1, 0, 0]} castShadow material={matAccent}>
            {/* Box vs Round shape approx via scale/segments */}
            <capsuleGeometry args={[dna.snout.width / 2, dna.snout.length, 4, 12]} />
          </mesh>
          {/* Nose Leather */}
          <mesh position={[dna.snout.position[0], dna.snout.position[1] - 0.02, dna.snout.position[2] + dna.snout.length / 2 + 0.04]} castShadow material={matNose}>
            <sphereGeometry args={[0.04, 8, 8]} />
          </mesh>


          {/* Eyes */}
          <mesh position={[0.09, 0.08, 0.12]} castShadow material={matEye}>
            <sphereGeometry args={[0.045, 12, 12]} />
          </mesh>
          <mesh position={[-0.09, 0.08, 0.12]} castShadow material={matEye}>
            <sphereGeometry args={[0.045, 12, 12]} />
          </mesh>

          {/* Ears (Parametric) */}
          <group>
            {/* Left Ear */}
            <mesh
              position={[-dna.ears.position[0], dna.ears.position[1], dna.ears.position[2]]}
              rotation={[dna.ears.rotation[0], -dna.ears.rotation[1], -dna.ears.rotation[2]]}
              castShadow material={matAccent}
            >
              <boxGeometry args={dna.ears.scale} />
            </mesh>
            {/* Right Ear */}
            <mesh
              position={[dna.ears.position[0], dna.ears.position[1], dna.ears.position[2]]}
              rotation={[dna.ears.rotation[0], dna.ears.rotation[1], dna.ears.rotation[2]]}
              castShadow material={matAccent}
            >
              <boxGeometry args={dna.ears.scale} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Legs (Parametric) */}
      {[
        // Front Left
        { pos: [dna.body.width / 2 - 0.02, dna.legs.height / 2, dna.body.length / 2 - 0.1] as [number, number, number] },
        // Front Right
        { pos: [-dna.body.width / 2 + 0.02, dna.legs.height / 2, dna.body.length / 2 - 0.1] as [number, number, number] },
        // Back Left
        { pos: [dna.body.width / 2 - 0.02, dna.legs.height / 2, -dna.body.length / 2 + 0.1] as [number, number, number] },
        // Back Right
        { pos: [-dna.body.width / 2 + 0.02, dna.legs.height / 2, -dna.body.length / 2 + 0.1] as [number, number, number] },
      ].map((leg, i) => (
        <group key={i} position={leg.pos}>
          <mesh castShadow material={matAccent}>
            <capsuleGeometry args={[dna.legs.thickness, dna.legs.height, 4, 8]} />
          </mesh>
          {/* Paw */}
          <mesh position={[0, -dna.legs.height / 2, 0.02]} rotation={[-Math.PI / 2, 0, 0]} material={matNose}>
            <cylinderGeometry args={[dna.legs.thickness, dna.legs.thickness, 0.04, 12]} />
          </mesh>
        </group>
      ))}

      {/* Tail (Parametric) */}
      <group ref={tail} position={[0, dna.legs.height + dna.body.height - 0.1, -dna.body.length / 2]}>
        <mesh
          position={[0, 0, -dna.tail.length / 2]}
          rotation={[dna.tail.height - 0.5, 0, 0]} // base rotation
          castShadow material={matPrimary}
        >
          {/* Curve approx via rotation */}
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
