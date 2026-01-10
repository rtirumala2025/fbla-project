import React, { useMemo } from 'react';
import * as THREE from 'three';
import { makeWoodTexture } from '../core/AssetLoader';

// --- SUB-COMPONENTS ---

function Cityscape() {
  // Simple building silhouettes outside the window to give depth
  // Positioned far back (-20 to -40 z)
  const buildings = useMemo(() => {
    const b = [];
    for (let i = 0; i < 25; i++) {
      const height = 15 + Math.random() * 25;
      const width = 4 + Math.random() * 8;
      const x = (Math.random() - 0.5) * 80;
      const z = -25 - Math.random() * 30;
      b.push({ pos: [x, height / 2 - 10, z] as [number, number, number], args: [width, height, width] as [number, number, number] });
    }
    return b;
  }, []);

  return (
    <group>
      {buildings.map((b, i) => (
        <mesh key={i} position={b.pos}>
          <boxGeometry args={b.args} />
          <meshBasicMaterial color="#1a2b4b" /> {/* Dark blueish silhouette */}
          {/* Simple lit windows */}
          {Math.random() > 0.4 && (
            <mesh position={[0, Math.random() * 5, b.args[2] / 2 + 0.1]}>
              <planeGeometry args={[b.args[0] * 0.5, b.args[1] * 0.6]} />
              <meshBasicMaterial color={Math.random() > 0.8 ? "#fcfcba" : "#fff"} transparent opacity={0.15} />
            </mesh>
          )}
        </mesh>
      ))}
      {/* Sky Gradient implied by background color in scene, but we can add moon/stars here if needed */}
    </group>
  );
}

export function CozyRoom({ triggerNavigation }: { triggerNavigation?: (zone: string) => void }) {
  const woodTex = useMemo(() => {
    const t = makeWoodTexture();
    t.repeat.set(6.0, 6.0);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.rotation = Math.PI / 4; // Herringbone-ish diagonal feel
    return t;
  }, []);

  // Wall Colors
  const wallColor = "#e6e1d8"; // Warm white
  const accentColor = "#2c3e50"; // Deep blue/slate accent wall

  return (
    <group>
      {/* --- LIGHTING (Interior) --- */}
      <ambientLight intensity={0.6} color="#ffdcb4" /> {/* Warm ambient */}
      {/* Sun/Moon coming through window */}
      <spotLight
        position={[10, 15, 10]}
        angle={0.5}
        penumbra={0.5}
        intensity={1.8}
        color="#fff0dd"
        castShadow
        shadow-bias={-0.0001}
      />
      {/* City glow from outside */}
      <pointLight position={[0, 8, -15]} intensity={2} color="#5e80a3" distance={40} />

      {/* Warm lamp lights */}
      <pointLight position={[12, 5, 10]} intensity={0.8} color="#ffaa00" distance={15} />
      <pointLight position={[-12, 5, 10]} intensity={0.8} color="#ffaa00" distance={15} />

      {/* --- ARCHITECTURE --- */}

      {/* Floor: Luxury hardwood */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          map={woodTex}
          roughness={0.5}
          metalness={0.1}
          color="#8c7059"
        />
      </mesh>

      {/* Ceiling (to catch bounce light, though often culled, adds containment) */}
      <mesh position={[0, 12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>

      {/* Back Wall - Huge Windows */}
      <group position={[0, 6, -15]}>
        {/* Wall Frame Top */}
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[40, 2, 1]} />
          <meshStandardMaterial color={wallColor} roughness={0.8} />
        </mesh>
        {/* Wall Frame Bottom */}
        <mesh position={[0, -5, 0]}>
          <boxGeometry args={[40, 2, 1]} />
          <meshStandardMaterial color={wallColor} roughness={0.8} />
        </mesh>
        {/* Wall Frame Left/Right */}
        <mesh position={[-19, 0, 0]}>
          <boxGeometry args={[2, 10, 1]} />
          <meshStandardMaterial color={wallColor} roughness={0.8} />
        </mesh>
        <mesh position={[19, 0, 0]}>
          <boxGeometry args={[2, 10, 1]} />
          <meshStandardMaterial color={wallColor} roughness={0.8} />
        </mesh>
        {/* Vertical Mullions - Black Steel */}
        <mesh position={[-6, 0, 0]}>
          <boxGeometry args={[0.3, 10, 0.3]} />
          <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[6, 0, 0]}>
          <boxGeometry args={[0.3, 10, 0.3]} />
          <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.3, 10, 0.3]} />
          <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Glass Panes */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[36, 10]} />
          <meshPhysicalMaterial
            color="#88ccff"
            roughness={0.0}
            metalness={0.1}
            transmission={0.8}
            transparent
            opacity={0.2}
          />
        </mesh>
      </group>

      {/* Cityscape Background */}
      <Cityscape />

      {/* Left Wall - Solid Accent */}
      <mesh position={[-19, 6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[30, 12, 1]} />
        <meshStandardMaterial color={accentColor} roughness={0.9} />
      </mesh>

      {/* Right Wall - Standard Paint */}
      <mesh position={[19, 6, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[30, 12, 1]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>

      {/* Baseboards */}
      <mesh position={[0, 0.5, -14.4]}>
        <boxGeometry args={[40, 1, 0.2]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[-18.4, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[30, 1, 0.2]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[18.4, 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[30, 1, 0.2]} />
        <meshStandardMaterial color="#fff" />
      </mesh>

      {/* --- ZONES --- */}

      {/* 1. LOUNGE (Center/Back) - Replaces "Home" building */}
      {/* Massive modern rug */}
      <group position={[0, 0.02, 2]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('home'); }}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[6, 64]} />
          <meshStandardMaterial color="#b0b8c2" roughness={1.0} metalness={0} /> {/* Plush soft grey */}
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          {/* Hitbox for home */}
          <circleGeometry args={[6, 32]} />
        </mesh>
        {/* L-Shaped Sectional Sofa */}
        <group position={[-2, 0, 2]}>
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[7, 0.8, 2.5]} />
            <meshStandardMaterial color="#3d4450" roughness={0.9} />
          </mesh>
          <mesh position={[2.25, 0.4, 2.25]} castShadow receiveShadow>
            <boxGeometry args={[2.5, 0.8, 7]} />
            <meshStandardMaterial color="#3d4450" roughness={0.9} />
          </mesh>
          {/* Pillows */}
          <mesh position={[-2, 0.9, 0.5]} rotation={[0.5, 0.5, 0]} castShadow>
            <boxGeometry args={[1, 0.8, 0.3]} />
            <meshStandardMaterial color="#e74c3c" />
          </mesh>
          <mesh position={[2, 0.9, 4]} rotation={[0.5, 0, 0.2]} castShadow>
            <boxGeometry args={[1, 0.8, 0.3]} />
            <meshStandardMaterial color="#f39c12" />
          </mesh>
        </group>
        {/* Modern Coffee Table */}
        <mesh position={[1, 0.3, 1]} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.2, 0.6, 6]} />
          <meshStandardMaterial color="#222" roughness={0.1} metalness={0.5} />
        </mesh>
        {/* Coffee Table Props */}
        <mesh position={[1, 0.65, 1]} castShadow>
          <boxGeometry args={[0.5, 0.1, 0.7]} />
          <meshStandardMaterial color="#fff" /> {/* Book */}
        </mesh>
      </group>


      {/* 2. TECH STATION (Left Wall) - Replaces "Shop" building */}
      <group position={[-14, 0, -2]} rotation={[0, Math.PI / 4, 0]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('shop'); }}>
        {/* Desk */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[5, 0.2, 2.5]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.2} />
        </mesh>
        <mesh position={[-2, 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 1.5]} />
          <meshStandardMaterial color="#888" metalness={0.8} />
        </mesh>
        <mesh position={[2, 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 1.5]} />
          <meshStandardMaterial color="#888" metalness={0.8} />
        </mesh>
        {/* Monitors */}
        <group position={[0, 1.6, -0.5]}>
          <mesh position={[-1.2, 1, 0]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[2.5, 1.5, 0.1]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[-1.2, 1, 0.06]} rotation={[0, 0.2, 0]}>
            <planeGeometry args={[2.3, 1.3]} />
            <meshStandardMaterial color="#000" emissive="#3498db" emissiveIntensity={0.6} /> {/* Glowing screen */}
          </mesh>

          <mesh position={[1.2, 1, 0]} rotation={[0, -0.2, 0]}>
            <boxGeometry args={[2.5, 1.5, 0.1]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[1.2, 1, 0.06]} rotation={[0, -0.2, 0]}>
            <planeGeometry args={[2.3, 1.3]} />
            <meshStandardMaterial color="#000" emissive="#9b59b6" emissiveIntensity={0.6} />
          </mesh>
        </group>
        {/* Gaming Chair */}
        <group position={[0, 0, 1.5]} rotation={[0, -0.5, 0]}>
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[1.5, 2, 0.2]} />
            <meshStandardMaterial color="#e74c3c" />
          </mesh>
          <mesh position={[0, 0.5, 0.6]} castShadow>
            <boxGeometry args={[1.5, 0.2, 1.5]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.5]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
        {/* PC Tower */}
        <mesh position={[2, 0.6, 0.5]} castShadow>
          <boxGeometry args={[0.5, 1.2, 1.2]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[2, 0.6, 1.11]}>
          <planeGeometry args={[0.5, 1.2]} />
          <meshStandardMaterial color="#000" emissive="#00ff00" emissiveIntensity={0.5} /> {/* RGB glass panel */}
        </mesh>
      </group>

      {/* 3. AGILITY ZONE (Right/Back Corner) - Replaces "Agility" */}
      {/* Massive Floor-to-Ceiling Cat Tree */}
      <group position={[14, 0, -10]} rotation={[0, -Math.PI / 4, 0]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('agility'); }}>
        <mesh visible={false}><cylinderGeometry args={[3, 3, 8]} /></mesh> {/* Hitbox */}
        {/* Main Pole */}
        <mesh position={[0, 6, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 12, 16]} />
          <meshStandardMaterial color="#d2b48c" roughness={1} /> {/* Sisal */}
        </mesh>
        {/* Platforms */}
        {[2, 5, 8, 10].map((h, i) => (
          <mesh key={i} position={[Math.sin(i * 2) * 1.5, h, Math.cos(i * 2) * 1.5]} rotation={[0, i, 0]} castShadow>
            <cylinderGeometry args={[2, 2, 0.2, 8]} />
            <meshStandardMaterial color="#555" roughness={0.8} /> {/* Carpet */}
          </mesh>
        ))}
        {/* Hanging Toy */}
        <mesh position={[1.5, 7.8, 1.5]}>
          <cylinderGeometry args={[0.02, 0.02, 2]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
        <mesh position={[1.5, 6.8, 1.5]} castShadow>
          <sphereGeometry args={[0.3]} />
          <meshStandardMaterial color="#ff0055" />
        </mesh>
      </group>

      {/* 4. WELLNESS SPA (Front Left) - Replaces "Vet" */}
      <group position={[-12, 0, 10]} rotation={[0, Math.PI / 2, 0]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('vet'); }}>
        {/* Massage Table / Grooming Station */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[4, 0.3, 2]} />
          <meshStandardMaterial color="#fff" roughness={0.2} />
        </mesh>
        <mesh position={[-1.5, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1.2]} />
          <meshStandardMaterial color="#ccc" metalness={0.8} />
        </mesh>
        <mesh position={[1.5, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 1.2]} />
          <meshStandardMaterial color="#ccc" metalness={0.8} />
        </mesh>
        {/* Shelves with bottles */}
        <group position={[0, 0, -1.2]}>
          <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[3, 0.1, 0.6]} />
            <meshStandardMaterial color="#e6e1d8" />
          </mesh>
          {/* Med bottles */}
          <mesh position={[-1, 2.3, 0]} castShadow><boxGeometry args={[0.3, 0.5, 0.3]} /><meshStandardMaterial color="red" /></mesh>
          <mesh position={[0, 2.3, 0]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.5]} /><meshStandardMaterial color="cyan" /></mesh>
          <mesh position={[1, 2.3, 0]} castShadow><boxGeometry args={[0.4, 0.4, 0.4]} /><meshStandardMaterial color="lime" /></mesh>
        </group>
        {/* Towel Stack */}
        <mesh position={[1.2, 1.4, 0.5]} rotation={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.8, 0.2, 0.8]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
      </group>

      {/* 5. KITCHENETTE (Front Right) - Replaces "Market" */}
      <group position={[12, 0, 10]} rotation={[0, -Math.PI / 2, 0]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('market'); }}>
        {/* Island Counter */}
        <mesh position={[0, 1.5, 0]} castShadow>
          <boxGeometry args={[5, 3, 2]} />
          <meshStandardMaterial color="#2c3e50" roughness={0.2} />
        </mesh>
        <mesh position={[0, 3.05, 0]} receiveShadow>
          <boxGeometry args={[5.2, 0.1, 2.2]} />
          <meshStandardMaterial color="#fff" roughness={0.1} metalness={0.1} /> {/* Marble */}
        </mesh>
        {/* Fancy Fountain Bowl */}
        <mesh position={[-1, 3.2, 0]} castShadow>
          <cylinderGeometry args={[0.6, 0.4, 0.3]} />
          <meshStandardMaterial color="#ecf0f1" />
        </mesh>
        <mesh position={[-1, 3.4, 0]} castShadow>
          <sphereGeometry args={[0.2]} />
          <meshStandardMaterial color="#3498db" metalness={0.8} roughness={0} /> {/* Water bubble */}
        </mesh>
        {/* Automatic Feeder */}
        <group position={[1, 3.2, 0]}>
          <mesh castShadow><boxGeometry args={[0.8, 0.8, 0.8]} /><meshStandardMaterial color="#bdc3c7" /></mesh>
          <mesh position={[0, 0.3, 0.3]} rotation={[0.5, 0, 0]}><planeGeometry args={[0.6, 0.4]} /><meshStandardMaterial color="#000" /></mesh> {/* Digital display */}
        </group>
      </group>

    </group>
  );
}
