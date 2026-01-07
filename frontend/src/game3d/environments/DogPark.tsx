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
    const size = 60;
    const radius = 15;
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

    const isNearPath = (x: number, z: number, threshold = 6) => {
      const p = new THREE.Vector3(x, 0, z);
      // Simplify check: just box check central plaza and buildings first
      if (Math.hypot(x, z) < 20) return true;
      for (const bPos of Object.values(ACTIVITY_POSITIONS)) {
        if (Math.hypot(x - bPos[0], z - bPos[2]) < 12) return true;
      }
      // Highway check
      // Approximation: Highway is at +/- 60 size.
      // If x is near -60 or 60, or z is near -60 or 60
      if ((Math.abs(x) > 54 && Math.abs(x) < 66) || (Math.abs(z) > 54 && Math.abs(z) < 66)) return true;

      // Center spokes
      if (Math.abs(x) < 4 || Math.abs(z) < 4) return true;

      return false;
    };

    const treeCount = 150;
    const range = 95;
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

      {/* Main Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ cameraCollide: true }}>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial map={grassTex} color="#8fb97e" roughness={1} />
      </mesh>

      {/* Paths */}
      {paths.highwayCurves.map((curve, i) => (
        <mesh key={`loop-${i}`} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <tubeGeometry args={[curve as any, 20, 2.5, 8, false]} />
          <meshStandardMaterial map={gravelTex} color="#ffffff" roughness={0.9} />
        </mesh>
      ))}
      {/* Spokes */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[5, 120]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 5]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" roughness={0.9} />
      </mesh>

      {/* Central Plaza */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[15, 64]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" transparent opacity={0.95} roughness={0.9} />
      </mesh>

      {/* Buildings */}
      <group position={[-16, 0, -14]} rotation={[0, 0.8, 0]}>
        <AgilityFacility onSignClick={() => onSignClick('agility')} />
      </group>
      <group position={[-18, 0, 10]} rotation={[0, -0.3, 0]}>
        <VetClinic onSignClick={() => onSignClick('vet')} />
      </group>
      <group position={[14, 0, -18]} rotation={[0, -2.4, 0]}>
        <PlayPavilion onSignClick={() => onSignClick('play')} />
      </group>
      <group position={[16, 0, 14]} rotation={[0, 3.8, 0]}>
        <RestShelter onSignClick={() => onSignClick('rest')} />
      </group>
      <ParkHubBuilding position={[0, 0, -10]} rotation={[0, 0, 0]} onSignClick={() => onSignClick('center')} />

      {/* INSTANCED NATURE */}
      <InstancedNature trees={scenery.trees} bushes={scenery.bushes} />

      {/* Decorative Lamps */}
      {[
        [-12, -8], [12, -8], [-12, 8], [12, 8],
        [-60, -60], [60, -60], [60, 60], [-60, 60],
        [0, -60], [60, 0], [0, 60], [-60, 0]
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

      {/* Ambient Floating Particles (Static within component, animated by GPU/Shader or internally if low cost) */}
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

      {/* Interior Views (Dynamic based on state.indoorLocation) */}
      {state.indoorLocation === 'agility' && <group position={[-16, 0.6, -14]}><AgilityInterior /></group>}
      {state.indoorLocation === 'vet' && <group position={[-18, 0.6, 10]}><VetInterior /></group>}
      {state.indoorLocation === 'play' && <group position={[14, 0.6, -18]}><PlayInterior /></group>}
      {state.indoorLocation === 'rest' && <group position={[16, 0.6, 14]}><RestInterior /></group>}
      {state.indoorLocation === 'center' && <group position={[0, 0.6, -10]}><ParkHubInterior /></group>}
    </>
  );
}
