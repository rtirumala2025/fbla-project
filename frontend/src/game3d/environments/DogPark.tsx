import React, { useMemo, useRef } from 'react';
import { Cloud, Float, Box, Cylinder, Sphere } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeGrassTexture, makeGravelTexture, createCanvasTexture } from '../core/AssetLoader';
import { AgilityFacility } from '../props/AgilityFacility';
import { VetClinic } from '../props/VetClinic';
import { PlayPavilion } from '../props/PlayPavilion';
import { RestShelter } from '../props/RestShelter';
import { ParkHubBuilding } from '../props/ParkHubBuilding';
import { ParkHubInterior } from '../props/ParkHubInterior';
import { AgilityInterior } from '../props/AgilityInterior';
import { VetInterior } from '../props/VetInterior';
import { PlayInterior } from '../props/PlayInterior';
import { RestInterior } from '../props/RestInterior';
import { NavigationGuide } from '../ui/NavigationGuide';
import type { PetGame2State, ActivityZone } from '../core/SceneManager';
import { ACTIVITY_POSITIONS } from '../core/SceneManager';

// --- Assets & Helpers ---

function Tree({ position, scale = 1, rotation = 0, lean = [0, 0] }: { position: [number, number, number]; scale?: number; rotation?: number, lean?: [number, number] }) {
  // Trees standard scale
  const baseScale = scale;

  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const sway = Math.sin(t * 0.8 + position[0]) * 0.015;
    groupRef.current.rotation.z = lean[0] + sway;
    groupRef.current.rotation.x = lean[1] + Math.cos(t * 0.6 + position[2]) * 0.01;
  });
  return (
    <group ref={groupRef} position={position} scale={baseScale} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.8 * baseScale, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15 * baseScale, 0.25 * baseScale, 1.6 * baseScale, 8]} />
        <meshStandardMaterial color="#4a3b2f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.2 * baseScale, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1 * baseScale, 0]} />
        <meshStandardMaterial color="#4d7e36" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Bush({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  const baseScale = scale;
  return (
    <group position={position} scale={baseScale} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#3a5e2a" roughness={0.9} />
      </mesh>
    </group>
  );
}

// --- SCENERY ---

export function DogPark({
  state,
  triggerNavigation,
  currentPetPosition
}: {
  state: PetGame2State;
  triggerNavigation: (zone: ActivityZone) => void;
  currentPetPosition: [number, number, number];
}) {
  const grassTex = useMemo(() => {
    const t = makeGrassTexture();
    t.repeat.set(64, 64); // Standard grid


    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  const gravelTex = useMemo(() => {
    const t = makeGravelTexture();
    t.repeat.set(20, 20);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  // Define Highway Path Curves
  const paths = useMemo(() => {
    // Outer highway loop (rounded square)
    const size = 60;
    const radius = 15;

    const highwayCurves = [
      // Top edge
      new THREE.LineCurve3(new THREE.Vector3(-size + radius, 0, -size), new THREE.Vector3(size - radius, 0, -size)),
      // Top-right corner
      new THREE.QuadraticBezierCurve3(new THREE.Vector3(size - radius, 0, -size), new THREE.Vector3(size, 0, -size), new THREE.Vector3(size, 0, -size + radius)),
      // Right edge
      new THREE.LineCurve3(new THREE.Vector3(size, 0, -size + radius), new THREE.Vector3(size, 0, size - radius)),
      // Bottom-right corner
      new THREE.QuadraticBezierCurve3(new THREE.Vector3(size, 0, size - radius), new THREE.Vector3(size, 0, size), new THREE.Vector3(size - radius, 0, size)),
      // Bottom edge
      new THREE.LineCurve3(new THREE.Vector3(size - radius, 0, size), new THREE.Vector3(-size + radius, 0, size)),
      // Bottom-left corner
      new THREE.QuadraticBezierCurve3(new THREE.Vector3(-size + radius, 0, size), new THREE.Vector3(-size, 0, size), new THREE.Vector3(-size, 0, size - radius)),
      // Left edge
      new THREE.LineCurve3(new THREE.Vector3(-size, 0, size - radius), new THREE.Vector3(-size, 0, -size + radius)),
      // Top-left corner
      new THREE.QuadraticBezierCurve3(new THREE.Vector3(-size, 0, -size + radius), new THREE.Vector3(-size, 0, -size), new THREE.Vector3(-size + radius, 0, -size)),
    ];

    // Spokes to connect to buildings/center
    const spokes = [
      new THREE.LineCurve3(new THREE.Vector3(0, 0, -size), new THREE.Vector3(0, 0, size)), // N-S Spoke
      new THREE.LineCurve3(new THREE.Vector3(-size, 0, 0), new THREE.Vector3(size, 0, 0)), // E-W Spoke
    ];

    return { highwayCurves, spokes };
  }, []);

  const scenery = useMemo(() => {
    const trees: { pos: [number, number, number]; scale: number; rot: number; lean: [number, number] }[] = [];
    const bushes: { pos: [number, number, number]; scale: number; rot: number }[] = [];

    const isNearPath = (x: number, z: number, threshold = 6) => {
      const p = new THREE.Vector3(x, 0, z);
      // Check distance to all curves
      for (const curve of [...paths.highwayCurves, ...paths.spokes]) {
        // Approximate distance to curve (cheap check)
        const segments = 10;
        for (let s = 0; s <= segments; s++) {
          const cp = curve.getPoint(s / segments);
          if (cp.distanceTo(p) < threshold) return true;
        }
      }
      // Keep clear area around central plaza
      if (Math.hypot(x, z) < 20) return true;
      // Keep clear area around buildings
      for (const bPos of Object.values(ACTIVITY_POSITIONS)) {
        if (Math.hypot(x - bPos[0], z - bPos[2]) < 12) return true;
      }
      return false;
    };

    // Global tree placement covering 200x200 grid
    const treeCount = 450;
    const range = 95;
    for (let i = 0; i < treeCount; i++) {
      const x = (Math.random() - 0.5) * range * 2;
      const z = (Math.random() - 0.5) * range * 2;

      if (isNearPath(x, z)) continue;

      trees.push({
        pos: [x, 0, z],
        scale: 0.8 + Math.random() * 1.5,
        rot: Math.random() * Math.PI,
        lean: [(Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15]
      });

      if (Math.random() > 0.4) {
        bushes.push({
          pos: [x + (Math.random() - 0.5) * 4, 0, z + (Math.random() - 0.5) * 4],
          scale: 0.6 + Math.random() * 0.6,
          rot: Math.random() * Math.PI
        });
      }
    }

    return { trees, bushes };
  }, [paths]);

  return (
    <>
      <color attach="background" args={['#cce0ff']} />
      <fog attach="fog" args={['#cce0ff', 50, 160]} />

      <group position={[0, 40, -30]}>
        <Cloud opacity={0.4} speed={0.1} segments={40} bounds={[100, 10, 100]} volume={25} color="#ffffff" />
      </group>

      {/* --- MAIN GROUND --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial map={grassTex} color="#8fb97e" roughness={1} />
      </mesh>

      {/* --- HIGHWAY SYSTEM MESHES --- */}
      {/* Outer Loop */}
      {paths.highwayCurves.map((curve, i) => (
        <mesh key={`loop-${i}`} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <tubeGeometry args={[curve as any, 20, 2.5, 8, false]} />
          <meshStandardMaterial map={gravelTex} color="#ffffff" roughness={0.9} />
        </mesh>
      ))}

      {/* Spokes - Flattened planes for better performance and alignment */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 120]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 5]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" roughness={0.9} />
      </mesh>

      {/* --- CENTRAL PLAZA --- */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[15, 64]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" transparent opacity={0.95} roughness={0.9} />
      </mesh>

      {/* --- BUILDINGS IN ORGANIC LAYOUT --- */}

      {/* Agility - Tucked in a corner with bushes */}
      <group position={[-16, 0, -14]} rotation={[0, 0.8, 0]}>
        <AgilityFacility onSignClick={() => triggerNavigation('agility')} />
      </group>

      {/* Vet Clinic - Street side feel */}
      <group position={[-18, 0, 10]} rotation={[0, -0.3, 0]}>
        <VetClinic onSignClick={() => triggerNavigation('vet')} />
      </group>

      {/* Play Pavilion - Open area */}
      <group position={[14, 0, -18]} rotation={[0, -2.4, 0]}>
        <PlayPavilion onSignClick={() => triggerNavigation('play')} />
      </group>

      {/* Rest Shelter - Shady spot under trees */}
      <group position={[16, 0, 14]} rotation={[0, 3.8, 0]}>
        <RestShelter onSignClick={() => triggerNavigation('rest')} />
      </group>

      {/* Central Hub - Facing the entrance plaza */}
      <ParkHubBuilding position={[0, 0, -10]} rotation={[0, 0, 0]} onSignClick={() => triggerNavigation('center')} />

      {/* --- DECORATIVE NATURE --- */}
      {!state.indoorLocation && scenery.trees.map((t, i) => <Tree key={`t-${i}`} position={t.pos} scale={t.scale} rotation={t.rot} lean={t.lean} />)}
      {!state.indoorLocation && scenery.bushes.map((b, i) => <Bush key={`b-${i}`} position={b.pos} scale={b.scale} rotation={b.rot} />)}

      <NavigationGuide navigationState={state.navigationState} currentPosition={currentPetPosition} />

      {/* --- INTERIOR VIEWS (Rendered at building locations) --- */}
      {state.indoorLocation === 'agility' && (
        <group position={[-16, 0.6, -14]}>
          <AgilityInterior />
        </group>
      )}
      {state.indoorLocation === 'vet' && (
        <group position={[-18, 0.6, 10]}>
          <VetInterior />
        </group>
      )}
      {state.indoorLocation === 'play' && (
        <group position={[14, 0.6, -18]}>
          <PlayInterior />
        </group>
      )}
      {state.indoorLocation === 'rest' && (
        <group position={[16, 0.6, 14]}>
          <RestInterior />
        </group>
      )}
      {state.indoorLocation === 'center' && (
        <group position={[0, 0.6, -10]}>
          <ParkHubInterior />
        </group>
      )}

      {/* Decorative Lamp Posts along the highway and plaza */}
      {[
        [-12, -8], [12, -8], [-12, 8], [12, 8],
        [-60, -60], [60, -60], [60, 60], [-60, 60],
        [0, -60], [60, 0], [0, 60], [-60, 0]
      ].map((pos, i) => (
        <group key={`lamp-${i}`} position={[pos[0], 0, pos[1]]}>
          <Cylinder args={[0.1, 0.15, 3.5, 8]} position={[0, 1.75, 0]} castShadow>
            <meshStandardMaterial color="#333" />
          </Cylinder>
          <Sphere args={[0.25]} position={[0, 3.5, 0]}>
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1} />
          </Sphere>
          <pointLight position={[0, 3.5, 0]} intensity={1.5} distance={12} color="#fff1d0" />
        </group>
      ))}

      {/* --- ATMOSPHERE --- */}
      <Float speed={1.5} floatIntensity={0.3}>
        <group position={[0, 3, 0]}>
          {Array.from({ length: 60 }).map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 100]}>
              <sphereGeometry args={[0.03, 4, 4]} />
              <meshBasicMaterial color="#fff" transparent opacity={0.25} />
            </mesh>
          ))}
        </group>
      </Float>
    </>
  );
}
