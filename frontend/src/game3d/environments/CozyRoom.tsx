import React, { useMemo } from 'react';
import * as THREE from 'three';
import { makeWoodTexture } from '../core/AssetLoader';
import { InstancedInterior } from './InstancedInterior';

// --- SUB-COMPONENTS ---

// CitySkybox removed per user request
// Cityscape removed per user request

function Cityscape() {
  // Enhanced Cityscape: Simulates distance city lights and buildings
  const buildings = useMemo(() => {
    const b = [];
    // Background layer (far, dense)
    for (let i = 0; i < 40; i++) {
      const height = 40 + Math.random() * 60;
      const width = 10 + Math.random() * 20;
      const x = (Math.random() - 0.5) * 200;
      const z = -60 - Math.random() * 50;
      b.push({ pos: [x, height / 2 - 20, z] as [number, number, number], args: [width, height, width] as [number, number, number], color: "#0d1a2f" });
    }
    return b;
  }, []);

  return (
    <group>
      {buildings.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <boxGeometry args={b.args} />
          <meshBasicMaterial color={b.color} transparent opacity={0.9} />
          {/* Random lit windows */}
          {Math.random() > 0.3 && (
            <mesh position={[0, 0, b.args[2] / 2 + 0.1]}>
              <planeGeometry args={[b.args[0] * 0.7, b.args[1] * 0.8]} />
              <meshBasicMaterial color={Math.random() > 0.5 ? "#fcfcba" : "#aaccff"} transparent opacity={0.1} />
            </mesh>
          )}
        </mesh>
      ))}
    </group>
  );
}

export function CozyRoom({ triggerNavigation }: { triggerNavigation?: (zone: string) => void }) {
  const woodTex = useMemo(() => {
    const t = makeWoodTexture();
    t.repeat.set(12.0, 12.0); // Increased repeat for larger floor
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.rotation = Math.PI / 4;
    return t;
  }, []);

  // SCALE FACTOR: 2.5x
  // Wall Colors
  const wallColor = "#e6e1d8";
  const accentColor = "#2c3e50";

  return (
    <group>
      {/* 1. ATMOSPHERE / VOID FIX - Removed */}
      <InstancedInterior />

      {/* 2. LIGHTING (Adjusted for scale) */}
      <ambientLight intensity={0.5} color="#ffdcb4" />
      <spotLight
        position={[30, 60, 30]}
        angle={0.5}
        penumbra={0.5}
        intensity={2.5}
        color="#fff0dd"
        castShadow
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={0.00005} // Positive bias for large flat planes
        shadow-mapSize={[2048, 2048]}
      />
      {/* Point lights for "zones" */}
      <pointLight position={[30, 20, 20]} intensity={1.5} color="#ffaa00" distance={40} />
      <pointLight position={[-30, 20, 20]} intensity={1.5} color="#ffaa00" distance={40} />

      {/* 3. ARCHITECTURE (Scaled up 2.5x) */}

      {/* Floor: 120x120 (Was 50x50) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial
          map={woodTex}
          roughness={0.8}
          metalness={0.02}
          color="#8c7059"
        />
      </mesh>

      {/* Background City - Removed */}

      {/* Back Wall (Window View) */}
      <group position={[0, 15, -45]}>
        {/* Top Frame */}
        <mesh position={[0, 15, 0]}>
          <boxGeometry args={[100, 5, 2]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        {/* Bottom Frame */}
        <mesh position={[0, -15, 0]}>
          <boxGeometry args={[100, 5, 2]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        {/* Side Frames */}
        <mesh position={[-48, 0, 0]}>
          <boxGeometry args={[4, 35, 2]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        <mesh position={[48, 0, 0]}>
          <boxGeometry args={[4, 35, 2]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        {/* Mullions */}
        {[-24, 0, 24].map(x => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[1, 30, 1]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}
        {/* Glass */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[100, 30]} />
          <meshPhysicalMaterial
            color="#88ccff"
            transmission={0.9}
            opacity={0.3}
            transparent
            roughness={0}
          />
        </mesh>
      </group>

      {/* Left Wall (Solid) - BackSide rendering to hide when behind */}
      <mesh position={[-50, 20, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[100, 40]} />
        <meshStandardMaterial color={accentColor} side={THREE.FrontSide} />
      </mesh>

      {/* Right Wall (Solid) */}
      <mesh position={[50, 20, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[100, 40]} />
        <meshStandardMaterial color={wallColor} side={THREE.FrontSide} />
      </mesh>


      {/* --- ZONES (Scaled & Repositioned for 120x120 Room) --- */}

      {/* 1. LOUNGE (Center Interaction) - Scaled 2.5x */}
      <group position={[0, 0, 5]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('home'); }}>
        {/* Massive Rug: 35u radius */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[25, 64]} />
          <meshStandardMaterial color="#b0b8c2" roughness={1} />
        </mesh>
        {/* Sectional Sofa - Massive */}
        <group position={[-10, 0.1, 10]} scale={[2.5, 2.5, 2.5]}>
          <mesh position={[0, 1, 0]} castShadow receiveShadow>
            <boxGeometry args={[7, 2, 2.5]} />
            <meshStandardMaterial color="#3d4450" />
          </mesh>
          <mesh position={[2.25, 1, 2.25]} castShadow receiveShadow>
            <boxGeometry args={[2.5, 2, 7]} />
            <meshStandardMaterial color="#3d4450" />
          </mesh>
        </group>
        {/* Coffee Table - Massive */}
        <mesh position={[5, 2, 5]} castShadow scale={[2.5, 2.5, 2.5]}>
          <cylinderGeometry args={[1.5, 1.2, 0.6, 16]} />
          <meshStandardMaterial color="#222" roughness={0.1} />
        </mesh>
      </group>

      {/* 2. TECH STATION (Left Wall) - Scaled 3x */}
      <group position={[-45, 0, -20]} rotation={[0, Math.PI / 4, 0]} scale={[3, 3, 3]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('shop'); }}>
        {/* Desk */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[5, 0.2, 2.5]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
        <mesh position={[-2, 0.75, 0]}><cylinderGeometry args={[0.1, 0.1, 1.5]} /><meshStandardMaterial color="#888" /></mesh>
        <mesh position={[2, 0.75, 0]}><cylinderGeometry args={[0.1, 0.1, 1.5]} /><meshStandardMaterial color="#888" /></mesh>
        {/* Monitors */}
        <group position={[0, 1.6, -0.5]}>
          <mesh position={[-1.2, 1, 0]} rotation={[0, 0.2, 0]}><boxGeometry args={[2.5, 1.5, 0.1]} /><meshStandardMaterial color="#111" /></mesh>
          <mesh position={[-1.2, 1, 0.06]} rotation={[0, 0.2, 0]}><planeGeometry args={[2.3, 1.3]} /><meshStandardMaterial color="#000" emissive="#3498db" emissiveIntensity={0.6} /></mesh>
          <mesh position={[1.2, 1, 0]} rotation={[0, -0.2, 0]}><boxGeometry args={[2.5, 1.5, 0.1]} /><meshStandardMaterial color="#111" /></mesh>
          <mesh position={[1.2, 1, 0.06]} rotation={[0, -0.2, 0]}><planeGeometry args={[2.3, 1.3]} /><meshStandardMaterial color="#000" emissive="#9b59b6" emissiveIntensity={0.6} /></mesh>
        </group>
        {/* Chair */}
        <group position={[0, 0, 1.5]} rotation={[0, -0.5, 0]}>
          <mesh position={[0, 1, 0]}><boxGeometry args={[1.5, 2, 0.2]} /><meshStandardMaterial color="#e74c3c" /></mesh>
          <mesh position={[0, 0.5, 0.6]}><boxGeometry args={[1.5, 0.2, 1.5]} /><meshStandardMaterial color="#333" /></mesh>
        </group>
      </group>

      {/* 3. AGILITY TOWER (Back Right) - Scaled 3x */}
      <group position={[40, 0, -40]} rotation={[0, -Math.PI / 4, 0]} scale={[3, 3, 3]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('agility'); }}>
        <mesh position={[0, 6, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 12, 16]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>
        {[2, 5, 8, 10].map((h, i) => (
          <mesh key={i} position={[Math.sin(i * 2) * 1.5, h, Math.cos(i * 2) * 1.5]} rotation={[0, i, 0]} castShadow>
            <cylinderGeometry args={[2, 2, 0.2, 8]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        ))}
      </group>

      {/* 4. SPA (Front Left) - Scaled 2.5x */}
      <group position={[-40, 0, 40]} rotation={[0, Math.PI / 2, 0]} scale={[2.5, 2.5, 2.5]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('vet'); }}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[4, 0.3, 2]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[-1.5, 0.6, 0]}><cylinderGeometry args={[0.2, 0.2, 1.2]} /><meshStandardMaterial color="#ccc" /></mesh>
        <mesh position={[1.5, 0.6, 0]}><cylinderGeometry args={[0.2, 0.2, 1.2]} /><meshStandardMaterial color="#ccc" /></mesh>
        {/* Shelf */}
        <group position={[0, 0, -1.2]}>
          <mesh position={[0, 2, 0]}><boxGeometry args={[3, 0.1, 0.6]} /><meshStandardMaterial color="#e6e1d8" /></mesh>
        </group>
      </group>

      {/* 5. KITCHENETTE (Front Right) - Scaled 2.5x */}
      <group position={[40, 0, 40]} rotation={[0, -Math.PI / 2, 0]} scale={[2.5, 2.5, 2.5]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('market'); }}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[5, 3, 2]} />
          <meshStandardMaterial color="#2c3e50" />
        </mesh>
        <mesh position={[0, 3.05, 0]}>
          <boxGeometry args={[5.2, 0.1, 2.2]} />
          <meshStandardMaterial color="#fff" roughness={0.1} />
        </mesh>
        {/* Bowl */}
        <mesh position={[-1, 3.2, 0]}><cylinderGeometry args={[0.6, 0.4, 0.3]} /><meshStandardMaterial color="#ecf0f1" /></mesh>
      </group>

    </group>
  );
}
