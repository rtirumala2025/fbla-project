import React, { useMemo } from 'react';
import { Cloud, Float, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { makeGrassTexture, makeGravelTexture } from '../core/AssetLoader';
import { AgilityFacility } from '../props/AgilityFacility';
import { VetClinic } from '../props/VetClinic';
import { PlayPavilion } from '../props/PlayPavilion';
import { RestShelter } from '../props/RestShelter';
import { ParkHubBuilding } from '../props/ParkHubBuilding';
import { GiftShop } from '../props/GiftShop';
import { PetHouse } from '../props/PetHouse';
import { ParkHubInterior } from '../props/ParkHubInterior';
import { AgilityInterior } from '../props/AgilityInterior';
import { VetInterior } from '../props/VetInterior';
import { PlayInterior } from '../props/PlayInterior';
import { RestInterior } from '../props/RestInterior';
import { GiftShopInterior } from '../props/GiftShopInterior';
import { PetHouseInterior } from '../props/PetHouseInterior';
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
    const size = 40; // Expanded for spread-out buildings
    const radius = 10;
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
      // Box check central plaza (expanded slightly)
      if (Math.hypot(x, z) < 16) return true;

      // Building Exclusion Zones (wider radius to prevent view blocking)
      for (const bPos of Object.values(ACTIVITY_POSITIONS)) {
        if (Math.hypot(x - bPos[0], z - bPos[2]) < 15) return true;
      }

      // View Corridors from center to each building (prevent trees in sightlines)
      for (const bPos of Object.values(ACTIVITY_POSITIONS)) {
        const bx = bPos[0], bz = bPos[2];
        const buildingDist = Math.hypot(bx, bz);
        // Distance from point to line through origin to building
        const lineDist = Math.abs(z * bx - x * bz) / buildingDist;
        // Check if point is in corridor and between center and building
        const dotProduct = (x * bx + z * bz);
        if (lineDist < 6 && dotProduct > 0 && dotProduct < buildingDist * buildingDist) {
          return true;
        }
      }

      // Ring Path (Radius 36-44) - removed as visual ring is gone
      // const dist = Math.hypot(x, z);
      // if (dist > 34 && dist < 46) return true;

      // Cardinal Spokes (Cross)
      if (Math.abs(x) < 4 || Math.abs(z) < 4) return true;

      // Diagonal Spokes (X-shape)
      if (Math.abs(x - z) / 1.414 < 4) return true;
      if (Math.abs(x + z) / 1.414 < 4) return true;

      return false;
    };

    const treeCount = 28; // Reduced for cleaner look
    const range = 48; // Larger range for expanded grid
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

      {/* Main Ground - Expanded for spread-out buildings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ cameraCollide: true }}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial map={grassTex} color="#8fb97e" roughness={1} />
      </mesh>

      {/* Paths - Highway Curves Removed */}

      {/* Spokes - Extended for larger grid and diagonal paths */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 80]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 3]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" roughness={0.9} />
      </mesh>
      {/* Diagonal Spokes */}
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]} receiveShadow>
        <planeGeometry args={[3, 80]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]} receiveShadow>
        <planeGeometry args={[3, 80]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" roughness={0.9} />
      </mesh>

      {/* Central Plaza - Smaller */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial map={gravelTex} color="#ffffff" transparent opacity={0.95} roughness={0.9} />
      </mesh>

      {/* ========== 7 BUILDINGS - SPREAD AROUND GRID EDGES ========== */}

      {/* Agility Facility - Back Left */}
      <group position={[-25, 0, -25]} rotation={[0, Math.PI / 4, 0]}>
        <AgilityFacility onSignClick={() => onSignClick('agility')} />
      </group>

      {/* Vet Clinic - Left Side */}
      <group position={[-35, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <VetClinic onSignClick={() => onSignClick('vet')} />
      </group>

      {/* Play Pavilion - Back Right */}
      <group position={[25, 0, -25]} rotation={[0, -Math.PI / 4, 0]}>
        <PlayPavilion onSignClick={() => onSignClick('play')} />
      </group>

      {/* Rest Shelter - Right Side */}
      <group position={[35, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <RestShelter onSignClick={() => onSignClick('rest')} />
      </group>

      {/* Park Hub (Info Center) - Front Left */}
      <group position={[-25, 0, 25]} rotation={[0, 3 * Math.PI / 4, 0]}>
        <ParkHubBuilding onSignClick={() => onSignClick('center')} />
      </group>

      {/* Gift Shop (NEW) - Front Right */}
      <group position={[25, 0, 25]} rotation={[0, -3 * Math.PI / 4, 0]}>
        <GiftShop onSignClick={() => onSignClick('shop')} />
      </group>

      {/* Pet House (NEW) - Far Back Center */}
      <group position={[0, 0, -35]} rotation={[0, 0, 0]}>
        <PetHouse onSignClick={() => onSignClick('home')} petName="Zeus" />
      </group>

      {/* INSTANCED NATURE */}
      <InstancedNature trees={scenery.trees} bushes={scenery.bushes} />

      {/* Decorative Lamps - Positioned along pathways */}
      {[
        // Inner ring on cardinal directions
        [-15, 0], [15, 0], [0, -15], [0, 15],
        // Inner ring on diagonals
        [-11, -11], [11, -11], [-11, 11], [11, 11],
        // Outer ring on cardinal directions
        [-28, 0], [28, 0], [0, -28], [0, 28],
        // Outer ring on diagonals  
        [-20, -20], [20, -20], [-20, 20], [20, 20]
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

import { BuildingEntrance, BUILDING_ENTRANCES } from '../props/BuildingEntrance';
import { setEntranceOpen } from '../core/CollisionSystem';
import { useCallback } from 'react';

// Rotation map to match the static building rotations
const BUILDING_ROTATIONS: Record<ActivityZone, number> = {
  agility: Math.PI / 4,
  vet: Math.PI / 2,
  play: -Math.PI / 4,
  rest: -Math.PI / 2,
  center: 3 * Math.PI / 4,
  shop: -3 * Math.PI / 4,
  home: 0,
};

// --- MAIN DYNAMIC COMPONENT ---
export function DogPark({
  state,
  triggerNavigation,
  currentPetPosition,
  onEnterBuilding,
}: {
  state: PetGame2State;
  triggerNavigation: (zone: ActivityZone) => void;
  currentPetPosition: [number, number, number];
  onEnterBuilding?: (zone: ActivityZone) => void;
}) {

  // Memoize the handle function so DogParkStatic props don't change
  const handleSignClick = useMemo(() => triggerNavigation, [triggerNavigation]);

  // Handle building entry: Open door -> Walk in
  const handleEnter = useCallback((zone: ActivityZone) => {
    // 1. Open the physical entrance (disables collision)
    setEntranceOpen(zone);

    // 2. Trigger navigation to walk into the building
    // The SceneManager will detect arrival and switch scenes
    triggerNavigation(zone);
  }, [triggerNavigation]);

  return (
    <>
      {/* Render Static Environment - Only updates if handleSignClick changes (rare) */}
      <DogParkStatic onSignClick={handleSignClick} />

      {/* Dynamic Navigation Guide */}
      <NavigationGuide navigationState={state.navigationState} currentPosition={currentPetPosition} />

      {/* 3D Interactive Entrances (Replaces 2D UI) */}
      {!state.indoorLocation && (Object.keys(ACTIVITY_POSITIONS) as ActivityZone[]).map((zone) => {
        const buildingPos = ACTIVITY_POSITIONS[zone];
        const entranceConfig = BUILDING_ENTRANCES[zone];
        const rotation = BUILDING_ROTATIONS[zone];

        return (
          <BuildingEntrance
            key={zone}
            buildingId={zone}
            buildingPosition={buildingPos}
            doorLocalPosition={entranceConfig.doorLocalPosition}
            doorRotation={rotation}
            onEnter={handleEnter}
            petPosition={currentPetPosition}
            doorWidth={entranceConfig.doorWidth}
            doorHeight={entranceConfig.doorHeight}
            requireStairs={entranceConfig.requireStairs}
            stairCount={entranceConfig.stairCount}
            label={`ENTER ${zone.toUpperCase()}`}
          />
        );
      })}

      {/* Interior Views (Dynamic based on state.indoorLocation) - Updated positions */}
      {state.indoorLocation === 'agility' && <group position={[-25, 0.6, -25]}><AgilityInterior /></group>}
      {state.indoorLocation === 'vet' && <group position={[-35, 0.6, 0]}><VetInterior /></group>}
      {state.indoorLocation === 'play' && <group position={[25, 0.6, -25]}><PlayInterior /></group>}
      {state.indoorLocation === 'rest' && <group position={[35, 0.6, 0]}><RestInterior /></group>}
      {state.indoorLocation === 'center' && <group position={[-25, 0.6, 25]}><ParkHubInterior /></group>}
      {state.indoorLocation === 'shop' && <group position={[25, 0.6, 25]}><GiftShopInterior /></group>}
      {state.indoorLocation === 'home' && <group position={[0, 0.6, -35]}><PetHouseInterior /></group>}
    </>
  );
}


