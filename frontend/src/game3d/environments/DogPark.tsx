import React, { useMemo } from 'react';
import { Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { makeGrassTexture, makeGravelTexture } from '../core/AssetLoader';
import { AgilityFacility } from '../props/AgilityFacility';
import { VetClinic } from '../props/VetClinic';
import { PlayPavilion } from '../props/PlayPavilion';
import { RestShelter } from '../props/RestShelter';
import { ParkHubBuilding } from '../props/ParkHubBuilding';
import { GiftShop } from '../props/GiftShop';
import { Supermarket } from '../props/Supermarket';
import { PetHouse } from '../props/PetHouse';
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

  // Tree types for variety
  type TreeType = 'oak' | 'maple' | 'birch' | 'pine';
  const TREE_TYPES: TreeType[] = ['oak', 'maple', 'birch', 'pine'];

  // Generate Vegetation Data ONCE - Lush natural park
  const scenery = useMemo(() => {
    const trees: { pos: [number, number, number]; scale: number; rotation: number; lean: [number, number]; type: TreeType }[] = [];
    const bushes: { pos: [number, number, number]; scale: number; rotation: number; hasFlowers?: boolean; flowerColor?: string }[] = [];
    const groundScatter: { pos: [number, number, number]; scale: number; rotation: number; type: 'leaf' | 'rock' | 'flower'; color?: string }[] = [];

    // Seeded random for consistent generation
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    let seed = 42;
    const rand = () => seededRandom(seed++);

    const isNearPath = (x: number, z: number) => {
      // Central plaza
      if (Math.hypot(x, z) < 14) return true;

      // Building Exclusion Zones
      for (const bPos of Object.values(ACTIVITY_POSITIONS)) {
        if (Math.hypot(x - bPos[0], z - bPos[2]) < 12) return true;
      }

      // View Corridors from center to each building
      for (const bPos of Object.values(ACTIVITY_POSITIONS)) {
        const bx = bPos[0], bz = bPos[2];
        const buildingDist = Math.hypot(bx, bz);
        const lineDist = Math.abs(z * bx - x * bz) / buildingDist;
        const dotProduct = (x * bx + z * bz);
        if (lineDist < 5 && dotProduct > 0 && dotProduct < buildingDist * buildingDist) {
          return true;
        }
      }

      // Cardinal Spokes (Cross pathways)
      if (Math.abs(x) < 3.5 || Math.abs(z) < 3.5) return true;

      // Diagonal Spokes (X-shape pathways)
      if (Math.abs(x - z) / 1.414 < 3.5) return true;
      if (Math.abs(x + z) / 1.414 < 3.5) return true;

      return false;
    };

    // Generate diverse trees (~70 total)
    const treeCount = 72;
    const range = 46;
    let attempts = 0;
    while (trees.length < treeCount && attempts < 2000) {
      attempts++;
      const x = (rand() - 0.5) * range * 2;
      const z = (rand() - 0.5) * range * 2;
      if (isNearPath(x, z)) continue;

      // Assign tree type based on location for natural clustering
      const distFromCenter = Math.hypot(x, z);
      let type: TreeType;
      if (distFromCenter > 38) {
        type = rand() > 0.6 ? 'pine' : 'birch'; // Outer ring: pines and birches
      } else if (distFromCenter > 25) {
        type = rand() > 0.5 ? 'oak' : 'maple'; // Middle: oaks and maples
      } else {
        type = TREE_TYPES[Math.floor(rand() * 4)]; // Inner: mixed
      }

      trees.push({
        pos: [x, 0, z],
        scale: 0.9 + rand() * 1.2,
        rotation: rand() * Math.PI * 2,
        lean: [(rand() - 0.5) * 0.12, (rand() - 0.5) * 0.12],
        type
      });

      // Add fallen leaves near trees
      const leafCount = 3 + Math.floor(rand() * 5);
      for (let l = 0; l < leafCount; l++) {
        groundScatter.push({
          pos: [x + (rand() - 0.5) * 3, 0, z + (rand() - 0.5) * 3],
          scale: 0.8 + rand() * 0.6,
          rotation: rand() * Math.PI * 2,
          type: 'leaf'
        });
      }
    }

    // Generate bushes and shrubs (~100 total)
    const flowerColors = ['red', 'yellow', 'purple', 'white'];
    for (let i = 0; i < 110; i++) {
      attempts = 0;
      while (attempts < 50) {
        attempts++;
        const x = (rand() - 0.5) * range * 2;
        const z = (rand() - 0.5) * range * 2;
        if (isNearPath(x, z)) continue;

        const hasFlowers = rand() > 0.6;
        bushes.push({
          pos: [x, 0, z],
          scale: 0.5 + rand() * 0.7,
          rotation: rand() * Math.PI * 2,
          hasFlowers,
          flowerColor: hasFlowers ? flowerColors[Math.floor(rand() * 4)] : undefined
        });
        break;
      }
    }

    // Generate wildflowers in grass (~200)
    for (let i = 0; i < 200; i++) {
      const x = (rand() - 0.5) * range * 2;
      const z = (rand() - 0.5) * range * 2;
      if (isNearPath(x, z)) continue;

      groundScatter.push({
        pos: [x, 0, z],
        scale: 0.8 + rand() * 0.5,
        rotation: rand() * Math.PI * 2,
        type: 'flower',
        color: flowerColors[Math.floor(rand() * 4)]
      });
    }

    // Generate rocks/pebbles (~80)
    for (let i = 0; i < 80; i++) {
      const x = (rand() - 0.5) * range * 2;
      const z = (rand() - 0.5) * range * 2;
      if (isNearPath(x, z) && Math.hypot(x, z) < 12) continue; // Allow some near paths edge

      groundScatter.push({
        pos: [x, 0, z],
        scale: 0.6 + rand() * 1.0,
        rotation: rand() * Math.PI * 2,
        type: 'rock'
      });
    }

    return { trees, bushes, groundScatter };
  }, []);

  const { scene } = useThree();

  useEffect(() => {
    if (scene && process.env.NODE_ENV === 'development') {
      const analyzeScene = () => {
        let triangles = 0;
        let meshes = 0;
        let lights = 0;
        let materials = 0;

        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            meshes++;
            if (object.geometry) {
              const geo = object.geometry as THREE.BufferGeometry;
              if (geo.index) {
                triangles += geo.index.count / 3;
              } else if (geo.attributes.position) {
                triangles += geo.attributes.position.count / 3;
              }
            }
            if (object.material) {
              materials++;
            }
          }
          if (object instanceof THREE.Light) {
            lights++;
          }
        });

        console.group('Scene Complexity Analysis');
        console.log(`Triangles: ${Math.round(triangles).toLocaleString()}`);
        console.log(`Meshes: ${meshes}`);
        console.log(`Lights: ${lights}`);
        console.log(`Materials: ${materials}`);
        console.groupEnd();
      };

      // Delay slightly to ensure everything is mounted
      const timeout = setTimeout(analyzeScene, 2000);
      return () => clearTimeout(timeout);
    }
  }, [scene]);

  return (
    <>
      <color attach="background" args={['#cce0ff']} />

      {/* Static Atmosphere - Cloud removed for performance */}

      {/* Main Ground - Expanded for spread-out buildings */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow userData={{ cameraCollide: true }}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial map={grassTex} color="#75a868" roughness={1} />
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

      {/* Gift Shop - Front Right */}
      <group position={[25, 0, 25]} rotation={[0, -3 * Math.PI / 4, 0]}>
        <GiftShop onSignClick={() => onSignClick('shop')} />
      </group>

      {/* Supermarket - Front pathway (toward camera) */}
      <group position={[0, 0, 35]} rotation={[0, Math.PI, 0]}>
        <Supermarket onSignClick={() => onSignClick('market')} />
      </group>

      {/* Pet House - Far Back Center */}
      <group position={[0, 0, -35]} rotation={[0, 0, 0]}>
        <PetHouse onSignClick={() => onSignClick('home')} petName="Zeus" />
      </group>

      {/* INSTANCED NATURE */}
      <InstancedNature trees={scenery.trees} bushes={scenery.bushes} groundScatter={scenery.groundScatter} />

      {/* Decorative Lamps - Positioned along SIDES of pathways */}
      {[
        // North path (both sides, offset from center)
        [-2.5, -12], [2.5, -12], [-2.5, -22], [2.5, -22],
        // South path (both sides)
        [-2.5, 12], [2.5, 12], [-2.5, 22], [2.5, 22],
        // West path (both sides)
        [-12, -2.5], [-12, 2.5], [-22, -2.5], [-22, 2.5],
        // East path (both sides)
        [12, -2.5], [12, 2.5], [22, -2.5], [22, 2.5],
        // Diagonal NW path (offset perpendicular)
        [-9, -7], [-7, -9],
        // Diagonal NE path
        [9, -7], [7, -9],
        // Diagonal SW path
        [-9, 7], [-7, 9],
        // Diagonal SE path
        [9, 7], [7, 9],
      ].map((pos, i) => (
        <group key={`lamp-${i}`} position={[pos[0] as number, 0, pos[1] as number]}>
          <Cylinder args={[0.08, 0.12, 3.2, 6]} position={[0, 1.6, 0]}>
            <meshStandardMaterial color="#2a2a2a" />
          </Cylinder>
          <Sphere args={[0.22, 8, 8]} position={[0, 3.3, 0]}>
            <meshStandardMaterial color="#fffae6" emissive="#ffdd88" emissiveIntensity={0.8} />
          </Sphere>
          {/* Warm glow effect */}
        </group>
      ))}

      {/* Floating Particles removed for performance */}
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
  market: Math.PI,  // Facing center from front pathway
  home: 0,
};


// --- MAIN DYNAMIC COMPONENT ---
export function DogPark({
  state,
  triggerNavigation,
  currentPetPosition,
  onEnterBuilding,
  onPurchase,
}: {
  state: PetGame2State;
  triggerNavigation: (zone: ActivityZone) => void;
  currentPetPosition: [number, number, number];
  onEnterBuilding?: (zone: ActivityZone) => void;
  onPurchase?: (item: any) => void;
}) {

  // Memoize the handle function so DogParkStatic props don't change
  const handleSignClick = useMemo(() => triggerNavigation, [triggerNavigation]);

  // Handle building entry: Open door -> Walk in
  const handleEnter = useCallback((zone: ActivityZone) => {
    // 1. Open the physical entrance (disables collision)
    setEntranceOpen(zone);

    // 2. Open floating window instead of walking into building
    if (onEnterBuilding) {
      onEnterBuilding(zone);
    } else {
      // Fallback: navigate to building
      triggerNavigation(zone);
    }
  }, [triggerNavigation, onEnterBuilding]);

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

        // RENDER ENTRANCE IN LOCAL SPACE OF BUILDING
        return (
          <group key={zone} position={buildingPos} rotation={[0, rotation, 0]}>
            <BuildingEntrance
              buildingId={zone}

              // Position is now RELATIVE to building (Local Space)
              // We pass it as 'buildingPosition' prop but treating it as 0,0,0 parent
              buildingPosition={[0, 0, 0]}

              // Door Local Offset
              doorLocalPosition={entranceConfig.doorLocalPosition}

              // Rotation is handled by parent group
              doorRotation={0}

              onEnter={handleEnter}
              petPosition={currentPetPosition}
              doorWidth={entranceConfig.doorWidth}
              doorHeight={entranceConfig.doorHeight}
              variant={entranceConfig.variant}
              doorColor={entranceConfig.doorColor}
              frameColor={entranceConfig.frameColor}
              requireStairs={entranceConfig.requireStairs}
              stairCount={entranceConfig.stairCount}
              label={`ENTER ${zone.toUpperCase()}`}
            />
          </group>
        );
      })}

      {/* Interior Views - Now handled by floating windows in PetGame2Screen */}
      {/* Enter Button UI - Now rendered in PetHUD (pure React) instead of drei Html */}
    </>
  );
}


