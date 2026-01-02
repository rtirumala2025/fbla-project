import React, { useMemo, useRef } from 'react';
import { Sky, Cloud, Float } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeGrassTexture, makeWoodTexture, createCanvasTexture } from '../core/AssetLoader';

// --- Assets & Helpers ---

function makeGravelTexture() {
  return createCanvasTexture({
    size: 512,
    paint: (ctx, size) => {
      ctx.fillStyle = '#5d4037'; // Dark Brown Base (Mud/Dark Gravel)
      ctx.fillRect(0, 0, size, size);

      // Variable Noise for Roughness
      for (let i = 0; i < 15000; i++) {
        const shade = Math.random() > 0.5 ? 60 : 120; // Very dark specs
        ctx.fillStyle = `rgba(${shade},${shade},${shade},0.3)`;
        const s = 1 + Math.random() * 2;
        ctx.fillRect(Math.random() * size, Math.random() * size, s, s);
      }
    }
  });
}

// Math helper for exclusion zones
function distToSegment(p: { x: number, z: number }, v: { x: number, z: number }, w: { x: number, z: number }) {
  const l2 = (w.x - v.x) ** 2 + (w.z - v.z) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.z - v.z);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.z - v.z) * (w.z - v.z)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.z - (v.z + t * (w.z - v.z)));
}

function Tree({ position, scale = 1, rotation = 0, lean = [0, 0] }: { position: [number, number, number]; scale?: number; rotation?: number, lean?: [number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  // Subtle wind sway
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Trees sway slightly differently based on position
    const sway = Math.sin(t * 0.8 + position[0]) * 0.015;
    groupRef.current.rotation.z = lean[0] + sway;
    groupRef.current.rotation.x = lean[1] + Math.cos(t * 0.6 + position[2]) * 0.01;
  });

  const foliageColors = useMemo(() => [
    '#3a5e2a', // Deep shadow
    '#5d9646', // Mid
    '#85bf66', // High
    '#b0e090', // Tips
  ], []);

  return (
    <group ref={groupRef} position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Trunk */}
      <mesh position={[0, 0.8 * scale, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15 * scale, 0.25 * scale, 1.6 * scale, 8]} />
        <meshStandardMaterial color="#5e5044" roughness={0.9} />
      </mesh>

      {/* Foliage */}
      <mesh position={[0, 2.2 * scale, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.9 * scale, 0]} />
        <meshStandardMaterial color={foliageColors[1]} roughness={0.8} />
      </mesh>
      <mesh position={[0.6 * scale, 1.8 * scale, 0.2 * scale]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.6 * scale, 0]} />
        <meshStandardMaterial color={foliageColors[2]} roughness={0.8} />
      </mesh>
      <mesh position={[-0.5 * scale, 1.9 * scale, 0.4 * scale]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.55 * scale, 0]} />
        <meshStandardMaterial color={foliageColors[0]} roughness={0.8} />
      </mesh>
      <mesh position={[-0.2 * scale, 2.6 * scale, -0.3 * scale]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.5 * scale, 0]} />
        <meshStandardMaterial color={foliageColors[3]} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Bush({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#3a5e2a" roughness={0.9} />
      </mesh>
      <mesh position={[0.35, 0.3, 0.2]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial color="#5d9646" roughness={0.9} />
      </mesh>
      <mesh position={[-0.3, 0.25, -0.2]} castShadow receiveShadow>
        <dodecahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#3a5e2a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Rock({ position, scale = 1, rotation = 0 }: { position: [number, number, number]; scale?: number; rotation?: number }) {
  return (
    <mesh position={position} scale={scale} rotation={[Math.random() * 0.5, rotation, Math.random() * 0.5]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.4, 1]} />
      <meshStandardMaterial color="#7a7a7a" roughness={0.9} />
    </mesh>
  );
}

function Fence({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const woodTex = useMemo(() => makeWoodTexture(), []);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Post */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial map={woodTex} color="#8a6e56" roughness={0.9} />
      </mesh>
      {/* Rails */}
      <mesh position={[1.2, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.08, 0.05]} />
        <meshStandardMaterial map={woodTex} color="#8a6e56" roughness={0.9} />
      </mesh>
      <mesh position={[1.2, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.08, 0.05]} />
        <meshStandardMaterial map={woodTex} color="#8a6e56" roughness={0.9} />
      </mesh>
    </group>
  );
}

function FenceCorner({ position }: { position: [number, number, number] }) {
  const woodTex = useMemo(() => makeWoodTexture(), []);
  return (
    <mesh position={[position[0], 0.6, position[2]]} castShadow receiveShadow>
      <boxGeometry args={[0.2, 1.3, 0.2]} />
      <meshStandardMaterial map={woodTex} color="#8a6e56" roughness={0.9} />
    </mesh>
  );
}

function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const woodTex = useMemo(() => makeWoodTexture(), []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Legs */}
      <mesh position={[-0.8, 0.2, 0.2]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.8, 0.2, 0.2]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.8, 0.2, -0.2]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.8, 0.2, -0.2]} castShadow>
        <boxGeometry args={[0.1, 0.4, 0.1]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Seat */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.05, 0.6]} />
        <meshStandardMaterial map={woodTex} color="#a07e5e" roughness={0.6} />
      </mesh>

      {/* Backrest */}
      <mesh position={[0, 0.85, -0.28]} rotation={[0.2, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.6, 0.05]} />
        <meshStandardMaterial map={woodTex} color="#a07e5e" roughness={0.6} />
      </mesh>
    </group>
  );
}

function LampPost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 4, 8]} />
        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 4.2, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#fffdba" emissive="#fffdba" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 4.2, 0]} intensity={1.5} distance={10} color="#fffdba" castShadow />
    </group>
  );
}

// Trail Definitions - Structured "Gate Paths"
const forestTrails = [
  // North Gate Path (Aligned with Z axis at top)
  { start: { x: 0, z: -12 }, end: { x: 0, z: -25 }, width: 3 },
  // East Gate Path (Aligned with X axis at right)
  { start: { x: 12, z: 0 }, end: { x: 25, z: 0 }, width: 3 },
  // West Gate Path (Aligned with X axis at left)
  { start: { x: -12, z: 0 }, end: { x: -25, z: 0 }, width: 3 }
];


export function DogPark() {
  const grassTex = useMemo(() => {
    const t = makeGrassTexture();
    t.repeat.set(24, 24);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  const gravelTex = useMemo(() => {
    const t = makeGravelTexture();
    t.repeat.set(8, 8);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  // Procedural Generation - Rectangular Layout
  const scenery = useMemo(() => {
    const trees = [];
    const bushes = [];
    const rocks = [];
    const fenceSegments = [];
    const fenceCorners = [];

    // Fence Bounds
    const fenceW = 12; // X extent (+/- 12)
    const fenceD = 15; // Z extent (+/- 15)

    // 1. Forest Zone (Outside Fence)
    for (let i = 0; i < 90; i++) {
      // Random pos
      const angle = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 20;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Ensure not inside fence box (with buffer)
      if (Math.abs(x) < fenceW + 3 && Math.abs(z) < fenceD + 3) continue;

      // Entrance clearing (Z > 12)
      if (z > 12 && Math.abs(x) < 5) continue;

      // Check against trails
      let onTrail = false;
      for (const trail of forestTrails) {
        const d = distToSegment({ x, z }, trail.start, trail.end);
        if (d < trail.width / 2 + 1.5) { // Trail width + tree radius buffer
          onTrail = true;
          break;
        }
      }
      if (onTrail) continue;

      trees.push({
        pos: [x, 0, z] as [number, number, number],
        scale: 0.8 + Math.random() * 0.8,
        rot: Math.random() * Math.PI,
        lean: [(Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2] as [number, number]
      });

      if (Math.random() > 0.4) {
        bushes.push({
          pos: [x + (Math.random() - 0.5) * 2, 0, z + (Math.random() - 0.5) * 2] as [number, number, number],
          scale: 0.6 + Math.random() * 0.6,
          rot: Math.random() * Math.PI
        });
      }
    }

    // 2. Rectangular Fence Segments
    // Top (-Z) - Split for North Gate
    for (let x = -fenceW; x < fenceW; x += 2.45) {
      if (Math.abs(x) < 2.0 && x > -2.0) continue; // North Gate Gap
      fenceSegments.push({ pos: [x, 0, -fenceD] as [number, number, number], rot: 0 });
    }
    // Bottom (+Z) - Leave Gap for Main Gate
    for (let x = -fenceW; x < fenceW; x += 2.45) {
      if (Math.abs(x) < 3.5) continue; // Wider Gate gap
      fenceSegments.push({ pos: [x, 0, fenceD] as [number, number, number], rot: 0 });
    }
    // Left (-X) - Split for West Gate
    for (let z = -fenceD; z < fenceD; z += 2.45) {
      if (Math.abs(z) < 2.0) continue; // West Gate Gap
      fenceSegments.push({ pos: [-fenceW, 0, z] as [number, number, number], rot: Math.PI / 2 });
    }
    // Right (+X) - Split for East Gate
    for (let z = -fenceD; z < fenceD; z += 2.45) {
      if (Math.abs(z) < 2.0) continue; // East Gate Gap
      fenceSegments.push({ pos: [fenceW, 0, z] as [number, number, number], rot: Math.PI / 2 });
    }

    // 3. Fence Corners (Explicit Posts)
    fenceCorners.push(
      [-fenceW, 0, -fenceD], // TL
      [fenceW, 0, -fenceD],  // TR
      [-fenceW, 0, fenceD],  // BL
      [fenceW, 0, fenceD]    // BR
    );
    // Gate Posts
    fenceCorners.push([-3.5, 0, fenceD], [3.5, 0, fenceD]); // Main South Gate
    fenceCorners.push([-1.5, 0, -fenceD], [1.5, 0, -fenceD]); // North Gate
    fenceCorners.push([-fenceW, 0, -1.5], [-fenceW, 0, 1.5]); // West Gate
    fenceCorners.push([fenceW, 0, -1.5], [fenceW, 0, 1.5]); // East Gate


    // 4. Rocks
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 18 + Math.random() * 10;
      rocks.push({
        pos: [Math.cos(angle) * r, 0, Math.sin(angle) * r] as [number, number, number],
        scale: 0.5 + Math.random(),
        rot: Math.random() * Math.PI
      });
    }

    return { trees, bushes, rocks, fenceSegments, fenceCorners };
  }, []);

  return (
    <>
      {/* --- ATMOSPHERE --- */}
      {/* Replaced physical Sky with stylized solid color to ensure vibrant blue */}
      {/* Real Sky Blue: #87CEEB (Standard SkyBlue) for a natural, airy look */}
      <color attach="background" args={['#87CEEB']} />

      {/* Matching Fog - Pushed back to ensure Clouds are visible */}
      <fog attach="fog" args={['#87CEEB', 45, 120]} />

      <group position={[0, 30, -10]}>
        {/* Layer 1: Dense, fluffy Cumulus clouds (Lower & Denser) */}
        <Cloud
          opacity={1.0}
          speed={0.08}
          segments={60} // More particles
          bounds={[50, 6, 50]}
          volume={25} // Very fluffy
          color="#ffffff"
        />

        {/* Layer 2: High, wispy clouds (Higher) */}
        <Cloud
          position={[0, 20, 0]}
          opacity={0.5}
          speed={0.04}
          segments={20}
          bounds={[70, 4, 70]}
          volume={10}
          color="#e8f4ff" // Slightly blue-tinted
        />
      </group>

      {/* --- TERRAIN --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80, 128, 128]} />
        <meshStandardMaterial
          map={grassTex}
          roughness={1.0}
          roughnessMap={grassTex}
          color="#98c48a"
        />
      </mesh>

      {/* --- PATHS (Distinct Gravel) --- */}
      {/* Rectangular Loop Path:  Inner bounds ~ -8,8 / -11,11  Width ~2m */}

      {/* Top Strip */}
      <mesh position={[0, 0.02, -12.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 3]} />
        <meshStandardMaterial map={gravelTex} roughness={1} />
      </mesh>
      {/* Bottom Strip */}
      <mesh position={[0, 0.02, 12.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 3]} />
        <meshStandardMaterial map={gravelTex} roughness={1} />
      </mesh>
      {/* Left Strip */}
      <mesh position={[-9.5, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 28]} />
        <meshStandardMaterial map={gravelTex} roughness={1} />
      </mesh>
      {/* Right Strip */}
      <mesh position={[9.5, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3, 28]} />
        <meshStandardMaterial map={gravelTex} roughness={1} />
      </mesh>

      {/* Center Cross / Hub Paths */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.5, 22]} />
        <meshStandardMaterial map={gravelTex} roughness={1} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 2.5]} />
        <meshStandardMaterial map={gravelTex} roughness={1} />
      </mesh>
      <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[4, 32]} />
        <meshStandardMaterial map={gravelTex} roughness={1} />
      </mesh>

      {/* Entrance Path Extension */}
      <mesh position={[0, 0.025, 16]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 6]} />
        <meshStandardMaterial map={gravelTex} roughness={1} />
      </mesh>


      {/* --- NATURE TRAILS (Forest Extension) --- */}
      {forestTrails.map((trail, i) => {
        // Calculate center and length/rotation for plane
        const dx = trail.end.x - trail.start.x;
        const dz = trail.end.z - trail.start.z;
        const len = Math.hypot(dx, dz);
        const angle = Math.atan2(dz, dx);
        const cx = (trail.start.x + trail.end.x) / 2;
        const cz = (trail.start.z + trail.end.z) / 2;

        return (
          <mesh key={`trail-${i}`} position={[cx, 0.015, cz]} rotation={[-Math.PI / 2, 0, -angle]} receiveShadow>
            <planeGeometry args={[len, trail.width]} />
            <meshStandardMaterial map={gravelTex} roughness={1} />
          </mesh>
        );
      })}

      {/* --- SCENERY --- */}
      {scenery.trees.map((t, i) => (
        <Tree key={`tree-${i}`} position={t.pos} scale={t.scale} rotation={t.rot} lean={t.lean} />
      ))}

      {scenery.bushes.map((b, i) => (
        <Bush key={`bush-${i}`} position={b.pos} scale={b.scale} rotation={b.rot} />
      ))}

      {scenery.rocks.map((r, i) => (
        <Rock key={`rock-${i}`} position={r.pos} scale={r.scale} rotation={r.rot} />
      ))}

      {scenery.fenceSegments.map((f, i) => (
        <Fence key={`fence-${i}`} position={f.pos} rotation={f.rot} />
      ))}

      {scenery.fenceCorners.map((pos, i) => (
        <FenceCorner key={`corner-${i}`} position={pos as [number, number, number]} />
      ))}

      {/* --- PROPS --- */}

      {/* Benches in the Corners of the Paths */}
      <group position={[-7, 0, -10]} rotation={[0, Math.PI / 4, 0]}>
        <Bench position={[0, 0, 0]} />
        <LampPost position={[1.5, 0, 0]} />
      </group>

      <group position={[7, 0, -10]} rotation={[0, -Math.PI / 4, 0]}>
        <Bench position={[0, 0, 0]} />
        <LampPost position={[1.5, 0, 0]} />
      </group>

      <group position={[-7, 0, 10]} rotation={[0, 3 * Math.PI / 4, 0]}>
        <Bench position={[0, 0, 0]} />
        <LampPost position={[1.5, 0, 0]} />
      </group>

      <group position={[7, 0, 10]} rotation={[0, -3 * Math.PI / 4, 0]}>
        <Bench position={[0, 0, 0]} />
        <LampPost position={[1.5, 0, 0]} />
      </group>

      {/* --- PLAY AREA CONTENTS --- */}

      {/* Water Bowl Central Hub */}
      <group position={[1.5, 0, 1.5]}>
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.35, 0.2, 32]} />
          <meshStandardMaterial color="#b0b0b0" roughness={0.25} metalness={0.85} />
        </mesh>
        <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.33, 32]} />
          <meshStandardMaterial color="#306090" roughness={0.05} metalness={0.4} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Toys */}
      <mesh position={[-2, 0.06, -2]} rotation={[0.5, 2, 0.8]} castShadow receiveShadow>
        <torusKnotGeometry args={[0.12, 0.04, 64, 8, 2, 3]} />
        <meshStandardMaterial color="#ff5555" roughness={0.4} metalness={0.05} emissive="#ff0000" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[2, 0.1, -2]} rotation={[0, 1, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ffdd00" roughness={0.2} />
      </mesh>

      {/* Leash Post near Entrance (Outside on path) */}
      <group position={[3.5, 0, 13]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.9, 12]} />
          <meshStandardMaterial color="#5d4037" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.82, 0.06]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <torusGeometry args={[0.07, 0.015, 12, 12]} />
          <meshStandardMaterial color="#888" roughness={0.4} metalness={0.9} />
        </mesh>
      </group>

      {/* Particles */}
      <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
        <group position={[0, 2, 0]}>
          {Array.from({ length: 40 }).map((_, i) => (
            <mesh key={i} position={[(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 20]}>
              <sphereGeometry args={[0.02, 4, 4]} />
              <meshBasicMaterial color="#fff" transparent opacity={0.3} />
            </mesh>
          ))}
        </group>
      </Float>

    </>
  );
}
