import React, { useMemo } from 'react';
import { Cloud, Float, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { makeGrassTexture, makeGravelTexture } from '../core/AssetLoader';
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
import { InstancedNature } from './InstancedNature';

// --- DATA & TYPES ---

// Pre-define positions to allow "static" nature generation outside the render loop if possible,
// or at least memoize deeply.

// --- STATIC COMPONENT (Heavy Geometry) ---
// This component should NOT receive rapid updates like 'currentPetPosition'.

interface DogParkStaticProps {
  onSignClick: (zone: ActivityZone) => void;
}

const DogParkStatic = React.memo(({ onSignClick }: DogParkStaticProps) => {
  const grassTex = useMemo(() => {
    const t = makeGrassTexture();
    t.repeat.set(64, 64);
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

  const paths = useMemo(() => {
    const size = 30; // Reduced from 60
    const radius = 8; // Reduced from 15
    const highwayCurves = [
      new THREE.LineCurve3(new THREE.Vector3(-size + radius, 0, -size), new THREE.Vector3(size - radius, 0, -size)),
      new THREE.QuadraticBezierCurve3(new THREE.Vector3(size - radius, 0, -size), new THREE.Vector3(size, 0, -size), new THREE.Vector3(size, 0, -size + radius)),
      new THREE.LineCurve3(new THREE.Vector3(size, 0, -size + radius), new THREE.Vector3(size, 0, size - radius)),
      new THREE.QuadraticBezierCurve3(new THREE.Vector3(size, 0, size - radius), new THREE.Vector3(size, 0, size), new THREE.Vector3(size - radius, 0, size)),
      new THREE.LineCurve3(new THREE.Vector3(size - radius, 0, size), new THREE.Vector3(-size + radius, 0, size)),
      new THREE.QuadraticBezierCurve3(new THREE.Vector3(-size + radius, 0, size), new THREE.Vector3(-size, 0, size), new THREE.Vector3(-size, 0, size - radius)),
      new THREE.LineCurve3(new THREE.Vector3(-size, 0, size - radius), new THREE.Vector3(-size, 0, -size + radius)),
      new THREE.QuadraticBezierCurve3(new THREE.Vector3(-size, 0, -size + radius), new THREE.Vector3(-size, 0, -size), new THREE.Vector3(-size + radius, 0, -size)),
    ];
    return { highwayCurves };
  }, []);

  // Generate Vegetation Data ONCE
  const scenery = useMemo(() => {
    const trees: { pos: [number, number, number]; scale: number; rotation: number; lean: [number, number] }[] = [];
    const bushes: { pos: [number, number, number]; scale: number; rotation: number }[] = [];

    const isNearPath = (x: number, z: number, threshold = 4) => {
      const p = new THREE.Vector3(x, 0, z);
      // Simplify check: just box check central plaza and buildings first
      if (Math.hypot(x, z) < 12) return true;
      for (const bPos of Object.values(ACTIVITY_POSITIONS)) {
        if (Math.hypot(x - bPos[0], z - bPos[2]) < 8) return true;
      }
      // Highway check - at +/- 30 size now
      if ((Math.abs(x) > 26 && Math.abs(x) < 34) || (Math.abs(z) > 26 && Math.abs(z) < 34)) return true;

      // Center spokes
      if (Math.abs(x) < 3 || Math.abs(z) < 3) return true;

      return false;
    };

    const treeCount = 35; // Reduced from 150 for performance
    const range = 38; // Reduced from 95
    let attempts = 0;
    while (trees.length < treeCount && attempts < 1000) {
      attempts++;
      const x = (Math.random() - 0.5) * range * 2;
      const z = (Math.random() - 0.5) * range * 2;
      if (isNearPath(x, z)) continue;

      trees.push({
        pos: [x, 0, z],
        scale: 0.8 + Math.random() * 1.5,
        rotation: Math.random() * Math.PI,
        lean: [(Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.15]
      });

      if (Math.random() > 0.4) {
        bushes.push({
          pos: [x + (Math.random() - 0.5) * 4, 0, z + (Math.random() - 0.5) * 4],
          scale: 0.6 + Math.random() * 0.6,
          rotation: Math.random() * Math.PI
        });
      }
    }
    return { trees, bushes };
  }, [paths]);

  return (
    <>
      <color attach="background" args={['#cce0ff']} />

      {/* Static Atmosphere */}
      <group position={[0, 40, -30]}>
        <Cloud opacity={0.4} speed={0.1} segments={20} bounds={[100, 10, 100]} volume={12} color="#ffffff" />
      </group>

      {/* Main Ground - Reduced size */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ cameraCollide: true }}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial map={grassTex} color="#8fb97e" roughness={1} />
      </mesh>

      {/* Paths */}
      {paths.highwayCurves.map((curve, i) => (
        <mesh key={`loop-${i}`} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <tubeGeometry args={[curve as any, 20, 2.5, 8, false]} />
          <meshStandardMaterial map={gravelTex} color="#ffffff" roughness={0.9} />
        </mesh>
      ))}
      {/* Spokes - Reduced size */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 60]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 3]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" roughness={0.9} />
      </mesh>

      {/* Central Plaza - Smaller */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" transparent opacity={0.95} roughness={0.9} />
      </mesh>

      {/* Buildings - Moved closer to center */}
      <group position={[-12, 0, -10]} rotation={[0, 0.8, 0]}>
        <AgilityFacility onSignClick={() => onSignClick('agility')} />
      </group>
      <group position={[-14, 0, 8]} rotation={[0, -0.3, 0]}>
        <VetClinic onSignClick={() => onSignClick('vet')} />
      </group>
      <group position={[10, 0, -14]} rotation={[0, -2.4, 0]}>
        <PlayPavilion onSignClick={() => onSignClick('play')} />
      </group>
      <group position={[12, 0, 10]} rotation={[0, 3.8, 0]}>
        <RestShelter onSignClick={() => onSignClick('rest')} />
      </group>
      <ParkHubBuilding position={[0, 0, -8]} rotation={[0, 0, 0]} onSignClick={() => onSignClick('center')} />

      {/* INSTANCED NATURE */}
      <InstancedNature trees={scenery.trees} bushes={scenery.bushes} />

      {/* Decorative Lamps - Fewer, closer */}
      {[
        [-8, -6], [8, -6], [-8, 6], [8, 6],
        [-25, -25], [25, -25], [25, 25], [-25, 25]
      ].map((pos, i) => (
        <group key={`lamp-${i}`} position={[pos[0] as number, 0, pos[1] as number]}>
          <Cylinder args={[0.1, 0.15, 3.5, 8]} position={[0, 1.75, 0]} castShadow>
            <meshStandardMaterial color="#333" />
          </Cylinder>
          <Sphere args={[0.25]} position={[0, 3.5, 0]}>
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1} />
          </Sphere>
          <pointLight position={[0, 3.5, 0]} intensity={1.5} distance={12} color="#fff1d0" />
        </group>
      ))}

      {/* Ambient Floating Particles - Fewer for performance */}
      <Float speed={1.5} floatIntensity={0.3}>
        <group position={[0, 3, 0]}>
          {Array.from({ length: 20 }).map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 50]}>
              <sphereGeometry args={[0.03, 4, 4]} />
              <meshBasicMaterial color="#fff" transparent opacity={0.25} />
            </mesh>
          ))}
        </group>
      </Float>
    </>
  );
});

// --- MAIN DYNAMIC COMPONENT ---
export function DogPark({
  state,
  triggerNavigation,
  currentPetPosition
}: {
  state: PetGame2State;
  triggerNavigation: (zone: ActivityZone) => void;
  currentPetPosition: [number, number, number];
}) {

  // Memoize the handle function so DogParkStatic props don't change
  const handleSignClick = useMemo(() => triggerNavigation, [triggerNavigation]);

  return (
    <>
      {/* Render Static Environment - Only updates if handleSignClick changes (rare) */}
      <DogParkStatic onSignClick={handleSignClick} />

      {/* Dynamic Navigation Guide */}
      <NavigationGuide navigationState={state.navigationState} currentPosition={currentPetPosition} />

      {/* Interior Views (Dynamic based on state.indoorLocation) - Updated positions */}
      {state.indoorLocation === 'agility' && <group position={[-12, 0.6, -10]}><AgilityInterior /></group>}
      {state.indoorLocation === 'vet' && <group position={[-14, 0.6, 8]}><VetInterior /></group>}
      {state.indoorLocation === 'play' && <group position={[10, 0.6, -14]}><PlayInterior /></group>}
      {state.indoorLocation === 'rest' && <group position={[12, 0.6, 10]}><RestInterior /></group>}
      {state.indoorLocation === 'center' && <group position={[0, 0.6, -8]}><ParkHubInterior /></group>}
    </>
  );
}
