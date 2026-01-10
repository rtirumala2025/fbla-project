import React, { useMemo, useRef } from 'react';
import { useFrame, extend, ReactThreeFiber } from '@react-three/fiber';
import * as THREE from 'three';
import { makeForestFloorTexture } from '../core/AssetLoader';
import { shaderMaterial } from '@react-three/drei';

// -- 1. Custom Fog Shader --
const HeightFogMaterial = shaderMaterial(
  {
    color: new THREE.Color('#0a1a15'), // Darker, mystic green/black
    density: 0.12,
    cameraPosition: new THREE.Vector3(),
    time: 0,
  },
  `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  `
    uniform vec3 color;
    uniform float density;
    uniform float time;
    uniform vec3 cameraPosition;
    varying vec3 vWorldPosition;

    void main() {
      float fogStart = -2.0;
      float fogEnd = 6.0;
      float dist = distance(cameraPosition, vWorldPosition);
      
      float hFog = smoothstep(fogEnd, fogStart, vWorldPosition.y);
      float dFog = 1.0 - exp(-dist * density * 0.4);
      
      float alpha = clamp((hFog * 0.9 + dFog * 0.6), 0.0, 0.98);
      
      // Mystic drift
      float drift = sin(vWorldPosition.x * 0.3 + time * 0.15) * 0.05;
      alpha += drift;

      gl_FragColor = vec4(color, alpha);
    }
  `
);

extend({ HeightFogMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      heightFogMaterial: ReactThreeFiber.Object3DNode<THREE.ShaderMaterial, typeof HeightFogMaterial>;
    }
  }
}

// -- 2. Components --

function Fireflies({ count = 50 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const position = new THREE.Vector3();
  const dummy = new THREE.Object3D();

  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => ({
      t: Math.random() * 100,
      factor: 20 + Math.random() * 100,
      speed: 0.01 + Math.random() * 0.02,
      x: (Math.random() - 0.5) * 60,
      y: Math.random() * 10,
      z: (Math.random() - 0.5) * 60,
    }));
  }, [count]);

  useFrame(() => {
    if (!mesh.current) return;
    particles.forEach((p, i) => {
      let { t, factor, speed, x, y, z } = p;
      t = (t + speed) % 10000;
      const curY = y + Math.sin(t * 3) * 0.5;
      const curX = x + Math.cos(t) * 2;
      const curZ = z + Math.sin(t) * 2;

      dummy.position.set(curX, curY, curZ);
      const s = 0.5 + Math.sin(t * 10) * 0.5; // Blink
      dummy.scale.setScalar(s * 0.15);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#ccff00" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  );
}

function BambooStalk({ position, height = 6, thickness = 0.08, variant = 0, tilt = 0 }: any) {
  // ... (Same as before, simplified for brevity but re-included)
  const groupRef = useRef<THREE.Group>(null);
  const colors = useMemo(() => [
    { stem: '#3e5c41', joint: '#2f4930' },
    { stem: '#5c8a61', joint: '#4a724d' },
    { stem: '#1a2e1b', joint: '#111' }, // Dark variant
    { stem: '#6b8c42', joint: '#5a7837' },
  ], []);
  const c = colors[variant % colors.length];

  return (
    <group ref={groupRef} position={position} rotation={[tilt, Math.random() * Math.PI, tilt]}>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[thickness * 0.8, thickness, height, 6]} />
        <meshStandardMaterial color={c.stem} roughness={0.4} />
      </mesh>
      {/* Joints */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, (i + 1) * (height / 5) - 0.2, 0]}>
          <cylinderGeometry args={[thickness * 1.1, thickness * 1.15, 0.05, 6]} />
          <meshStandardMaterial color={c.joint} />
        </mesh>
      ))}
    </group>
  );
}

function ToriiGate() {
  return (
    <group>
      {/* Pillars */}
      <mesh position={[-2, 2.5, 0]} castShadow><cylinderGeometry args={[0.25, 0.3, 5]} /><meshStandardMaterial color="#b71c1c" /></mesh>
      <mesh position={[2, 2.5, 0]} castShadow><cylinderGeometry args={[0.25, 0.3, 5]} /><meshStandardMaterial color="#b71c1c" /></mesh>
      {/* Base stones */}
      <mesh position={[-2, 0.2, 0]}><cylinderGeometry args={[0.4, 0.5, 0.4]} /><meshStandardMaterial color="#555" /></mesh>
      <mesh position={[2, 0.2, 0]}><cylinderGeometry args={[0.4, 0.5, 0.4]} /><meshStandardMaterial color="#555" /></mesh>
      {/* Lintels */}
      <mesh position={[0, 4, 0]} castShadow><boxGeometry args={[6, 0.4, 0.5]} /><meshStandardMaterial color="#b71c1c" /></mesh>
      <mesh position={[0, 4.6, 0]} castShadow><boxGeometry args={[7, 0.5, 0.6]} /><meshStandardMaterial color="#212121" /></mesh> {/* Top roof */}

      {/* Sign plaque */}
      <mesh position={[0, 4.3, 0.1]}><boxGeometry args={[0.5, 0.6, 0.1]} /><meshStandardMaterial color="#111" /></mesh>
    </group>
  )
}

function Lantern({ position, color = "orange" }: { position: [number, number, number], color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      {/* Glow light */}
      <pointLight distance={8} intensity={1.5} color={color} decay={2} />
    </group>
  )
}

// -- 3. Forest Environment --
export function BambooForest({ triggerNavigation }: { triggerNavigation?: (zone: string) => void }) {
  const floorTex = useMemo(() => {
    const t = makeForestFloorTexture();
    t.repeat.set(12, 12);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  // Generate Bamboo Positions
  const stalks = useMemo(() => {
    const items = [];
    for (let i = 0; i < 150; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 10 + Math.random() * 40;
      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      items.push({ pos: [x, 0, z], h: 6 + Math.random() * 8, thick: 0.1 + Math.random() * 0.1, var: Math.floor(Math.random() * 4), tilt: (Math.random() - 0.5) * 0.2 });
    }
    return items;
  }, []);

  return (
    <group>
      {/* --- ATMOSPHERE --- */}
      <ambientLight intensity={0.1} color="#001133" /> {/* Night feel */}
      <directionalLight position={[-10, 20, -10]} intensity={1.5} color="#aaccff" castShadow /> {/* Moon */}
      <Fireflies count={80} />

      {/* --- TERRAIN --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100, 64, 64]} />
        <meshStandardMaterial
          map={floorTex}
          color="#3a4a3a"
          roughness={0.9}
        />
      </mesh>

      {/* Hills (Simplified mesh mounds) */}
      <mesh position={[-20, -1, -20]} scale={[20, 5, 20]}>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2d3a2d" />
      </mesh>
      <mesh position={[25, -2, 10]} scale={[15, 6, 15]}>
        <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2d3a2d" />
      </mesh>

      {/* River */}
      <mesh position={[0, 0.05, 15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 8]} />
        <meshStandardMaterial color="#001133" roughness={0.1} metalness={0.8} />
      </mesh>
      {/* Stone Bridge */}
      <group position={[0, 0.2, 15]}>
        <mesh position={[0, 0.5, 0]} receiveShadow><boxGeometry args={[4, 0.2, 10]} /><meshStandardMaterial color="#777" /></mesh>
        <mesh position={[-1.8, 0.8, 0]}><boxGeometry args={[0.2, 0.5, 10]} /><meshStandardMaterial color="#555" /></mesh>
        <mesh position={[1.8, 0.8, 0]}><boxGeometry args={[0.2, 0.5, 10]} /><meshStandardMaterial color="#555" /></mesh>
      </group>


      {/* --- ZONES --- */}

      {/* 1. PAVILION SHRINE (Center Back) - Replaces "Home" */}
      <group position={[0, 0, -15]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('home'); }}>
        <ToriiGate />
        {/* Main Shrine Building Behind */}
        <group position={[0, 1, -5]}>
          <mesh castShadow><boxGeometry args={[6, 4, 5]} /><meshStandardMaterial color="#fff" /></mesh>
          <mesh position={[0, 2.5, 0]} rotation={[0, 0, 0]} castShadow>
            <coneGeometry args={[5, 3, 4]} />
            <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[0, 0, 2.6]}>
            <boxGeometry args={[1.5, 2.5, 0.2]} />
            <meshStandardMaterial color="#3e2723" />
          </mesh>
        </group>
        {/* Lanterns */}
        <Lantern position={[-3, 1.5, 0]} />
        <Lantern position={[3, 1.5, 0]} />
      </group>


      {/* 2. MERCHANT CART (Left Path) - Replaces "Shop" */}
      <group position={[-15, 0, 0]} rotation={[0, Math.PI / 2, 0]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('shop'); }}>
        <mesh position={[0, 1, 0]} castShadow><boxGeometry args={[3, 1, 1.5]} /><meshStandardMaterial color="#5d4037" /></mesh>
        <mesh position={[0, 2.5, 0]} castShadow><cylinderGeometry args={[2, 2.2, 1]} /><meshStandardMaterial color="#e64a19" side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 1.8, 0]}><cylinderGeometry args={[0.1, 0.1, 1.2]} /><meshStandardMaterial color="#333" /></mesh>
        <Lantern position={[1.2, 2.4, 1.2]} color="#ffdd00" />
      </group>

      {/* 3. MARTIAL ARTS GROUNDS (Right Path) - Replaces "Agility" */}
      <group position={[15, 0, -5]} rotation={[0, -Math.PI / 4, 0]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('agility'); }}>
        <mesh position={[0, 0.05, 0]} receiveShadow><circleGeometry args={[6, 32]} /><meshStandardMaterial color="#d7ccc8" /></mesh> {/* Sand pit */}
        {/* Wooden Dummies */}
        <group position={[-2, 0, 0]}>
          <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.2, 0.2, 2.4]} /><meshStandardMaterial color="#8d6e63" /></mesh>
          <mesh position={[0, 1.6, 0.4]} rotation={[1, 0, 0]}><cylinderGeometry args={[0.08, 0.08, 0.8]} /><meshStandardMaterial color="#8d6e63" /></mesh>
          <mesh position={[-0.3, 1.4, 0]} rotation={[0, 0, 1]}><cylinderGeometry args={[0.08, 0.08, 0.6]} /><meshStandardMaterial color="#8d6e63" /></mesh>
        </group>
        {/* Balance Posts */}
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} position={[2, 0.5 + i * 0.2, i * 1.2 - 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.25, 1 + i * 0.4]} />
            <meshStandardMaterial color="#5d4037" />
          </mesh>
        ))}
      </group>

      {/* 4. HOT SPRING (Far Left) - Replaces "Vet" */}
      <group position={[-15, 0.1, 15]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('vet'); }}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3.5, 32]} />
          <meshStandardMaterial color="#4fc3f7" transparent opacity={0.6} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.5, 4.5, 32]} />
          <meshStandardMaterial color="#555" roughness={1} /> {/* Stones */}
        </mesh>
        {/* Steam effect simulated by overlap planes or particles (fireflies handles some drift) */}
      </group>

      {/* 5. SPIRIT BAMBOO (Center Foreground) - Replaces "Market" */}
      <group position={[0, 0, 5]} onClick={(e) => { e.stopPropagation(); triggerNavigation?.('market'); }}>
        <mesh position={[0, 2, 0]} rotation={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.2, 0.3, 4]} />
          <meshStandardMaterial color="#aaffaa" emissive="#00ff00" emissiveIntensity={0.2} />
        </mesh>
        <Lantern position={[0.5, 1.5, 0]} color="#00ffcc" />
      </group>


      {/* --- NATURE PROPS --- */}
      {stalks.map((s, i) => (
        <BambooStalk key={i} position={s.pos} height={s.h} thickness={s.thick} variant={s.var} tilt={s.tilt} />
      ))}

      {/* Height Fog */}
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[100, 12, 100]} />
        {/* @ts-ignore */}
        <heightFogMaterial ref={null} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

    </group>
  );
}
