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


      {/* --- ZONES (Scaled & Repositioned) --- */}

      {/* 1. LOUNGE (Center Interaction) */}
      <group position={[0, 0, 0]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('home'); }}>
        {/* Rug: 15u radius - LIFTED to prevent Z-fighting */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[15, 64]} />
          <meshStandardMaterial color="#b0b8c2" roughness={1} />
        </mesh>
        {/* Sofa: 2.5x larger */}
        <group position={[-6, 0.05, 6]}>
          <mesh position={[0, 1, 0]} castShadow receiveShadow>
            <boxGeometry args={[18, 2, 6]} />
            <meshStandardMaterial color="#3d4450" />
          </mesh>
          <mesh position={[6, 1, 6]} castShadow receiveShadow>
            <boxGeometry args={[6, 2, 18]} />
            <meshStandardMaterial color="#3d4450" />
          </mesh>
        </group>
        {/* Coffee Table */}
        <mesh position={[3, 0.82, 3]} castShadow>
          <cylinderGeometry args={[4, 3, 1.5, 8]} />
          <meshStandardMaterial color="#222" roughness={0.1} />
        </mesh>
      </group>

      {/* 2. TECH STATION (Left Wall) */}
      <group position={[-40, 0, -10]} rotation={[0, Math.PI / 4, 0]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('shop'); }}>
        {/* Desk */}
        <mesh position={[0, 3, 0]} castShadow>
          <boxGeometry args={[12, 0.5, 6]} />
          <meshStandardMaterial color="#111" roughness={0.2} />
        </mesh>
        {/* Legs */}
        <mesh position={[-5, 1.5, 0]}><cylinderGeometry args={[0.3, 0.3, 3]} /><meshStandardMaterial color="#888" /></mesh>
        <mesh position={[5, 1.5, 0]}><cylinderGeometry args={[0.3, 0.3, 3]} /><meshStandardMaterial color="#888" /></mesh>

        {/* Curved Monitor */}
        <mesh position={[0, 4.5, -2]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[8, 8, 3, 32, 1, true, Math.PI, Math.PI / 3]} />
          <meshStandardMaterial color="#000" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 4.5, -1.9]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[7.9, 7.9, 2.8, 32, 1, true, Math.PI, Math.PI / 3]} />
          <meshBasicMaterial color="#3498db" side={THREE.DoubleSide} /> {/* Screen */}
        </mesh>

        {/* Chair */}
        <group position={[0, 0, 4]} rotation={[0, -0.5, 0]}>
          <mesh position={[0, 2, 0]}><boxGeometry args={[3, 4, 0.5]} /><meshStandardMaterial color="#e74c3c" /></mesh>
          <mesh position={[0, 1, 1]}><boxGeometry args={[3, 0.5, 3]} /><meshStandardMaterial color="#333" /></mesh>
        </group>
      </group>

      {/* 3. AGILITY TOWER (Back Right) */}
      <group position={[35, 0, -30]} rotation={[0, -Math.PI / 4, 0]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('agility'); }}>
        <mesh position={[0, 15, 0]} castShadow>
          <cylinderGeometry args={[1, 1.2, 30]} />
          <meshStandardMaterial color="#d2b48c" />
        </mesh>
        {[5, 12, 20, 26].map((h, i) => (
          <mesh key={i} position={[Math.sin(i) * 3, h, Math.cos(i) * 3]} castShadow>
            <cylinderGeometry args={[5, 5, 0.5]} />
            <meshStandardMaterial color="#666" />
          </mesh>
        ))}
      </group>

      {/* 4. SPA (Front Left) */}
      <group position={[-35, 0, 30]} rotation={[0, Math.PI / 2, 0]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('vet'); }}>
        <mesh position={[0, 3, 0]} castShadow>
          <boxGeometry args={[10, 1, 5]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[-4, 1.5, 0]}><cylinderGeometry args={[0.5, 0.5, 3]} /><meshStandardMaterial color="#ccc" /></mesh>
        <mesh position={[4, 1.5, 0]}><cylinderGeometry args={[0.5, 0.5, 3]} /><meshStandardMaterial color="#ccc" /></mesh>
      </group>

      {/* 5. KITCHENETTE (Front Right) */}
      <group position={[35, 0, 30]} rotation={[0, -Math.PI / 2, 0]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('market'); }}>
        <mesh position={[0, 3.5, 0]} castShadow>
          <boxGeometry args={[12, 7, 5]} />
          <meshStandardMaterial color="#2c3e50" />
        </mesh>
        <mesh position={[0, 7.1, 0]}>
          <boxGeometry args={[12.5, 0.2, 5.5]} />
          <meshStandardMaterial color="#fff" roughness={0.1} />
        </mesh>
        {/* Bowl */}
        <mesh position={[-2, 7.5, 0]}>
          <cylinderGeometry args={[1.5, 1, 0.8]} />
          <meshStandardMaterial color="#eee" />
        </mesh>
      </group>

    </group>
  );
}
