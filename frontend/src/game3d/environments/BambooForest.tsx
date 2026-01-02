import React, { useMemo, useRef } from 'react';
import { useFrame, extend, ReactThreeFiber } from '@react-three/fiber';
import * as THREE from 'three';
import { makeForestFloorTexture } from '../core/AssetLoader';
import { shaderMaterial } from '@react-three/drei';

// -- 1. Custom Fog Shader --
const HeightFogMaterial = shaderMaterial(
  {
    color: new THREE.Color('#1a3c2f'),
    density: 0.15,
    cameraPosition: new THREE.Vector3(),
    time: 0,
  },
  // Vertex Shader
  `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  // Fragment Shader
  `
    uniform vec3 color;
    uniform float density;
    uniform float time;
    uniform vec3 cameraPosition;
    varying vec3 vWorldPosition;

    void main() {
      // Height fog calculation
      float heightFactor = 0.05;
      float fogStart = -1.0;
      float fogEnd = 4.0;
      
      float dist = distance(cameraPosition, vWorldPosition);
      
      // Thicker near bottom (vWorldPosition.y)
      float hFog = smoothstep(fogEnd, fogStart, vWorldPosition.y);
      
      // Distance fog base
      float dFog = 1.0 - exp(-dist * density * 0.5);
      
      // Combine: Height has priority, but distance fades everything out eventually
      float alpha = clamp((hFog * 0.8 + dFog * 0.5), 0.0, 0.95); // Cap opacity so we can see through slightly
      
      // Add subtle drift
      float drift = sin(vWorldPosition.x * 0.5 + time * 0.2) * 0.05;
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

// -- 2. Bamboo Component --
function BambooStalk({ position, height = 6, thickness = 0.08, variant = 0, tilt = 0 }: { position: [number, number, number]; height?: number; thickness?: number; variant?: number; tilt?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  // Random phase for wind
  const phase = useMemo(() => Math.random() * 100, []);

  // Colors: 4 variations of bamboo green/brown
  const colors = useMemo(() => [
    { stem: '#3e5c41', joint: '#2f4930' }, // Dark Green (Old)
    { stem: '#5c8a61', joint: '#4a724d' }, // Fresh Green
    { stem: '#4e6b50', joint: '#3d543e' }, // Muted
    { stem: '#6b8c42', joint: '#5a7837' }, // Yellowish
  ], []);

  const c = colors[variant % colors.length];

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Gentle sway, stronger at top
    // Base sway + Gusts
    const sway = Math.sin(t * 0.5 + phase) * 0.02 + Math.sin(t * 1.5 + phase * 0.5) * 0.005;
    groupRef.current.rotation.z = tilt + sway;
    groupRef.current.rotation.x = sway * 0.5;
  });

  // Segments
  const segments = 6;
  const segmentH = height / segments;

  return (
    <group ref={groupRef} position={position} rotation={[0, Math.random() * Math.PI, 0]}>
      {/* Main Stalk */}
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[thickness * 0.8, thickness, height, 8]} />
        <meshStandardMaterial color={c.stem} roughness={0.4} metalness={0.1} />
      </mesh>

      {/* Joints */}
      {Array.from({ length: segments }).map((_, i) => (
        <mesh key={i} position={[0, i * segmentH + 0.2, 0]} castShadow>
          <cylinderGeometry args={[thickness * 1.1, thickness * 1.15, 0.04, 8]} />
          <meshStandardMaterial color={c.joint} roughness={0.6} metalness={0} />
        </mesh>
      ))}

      {/* Leaves Cluster - Simplified for performance but layered */}
      <group position={[0, height * 0.6, 0]}>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`l1-${i}`} position={[0, i * 0.8, 0]} rotation={[0.5, i * (Math.PI * 2 / 5), 0]}>
            <planeGeometry args={[0.8, 0.8]} />
            <meshStandardMaterial color="#4a7a50" side={THREE.DoubleSide} transparent alphaTest={0.5} opacity={0.9} />
            {/* Note: Ideally we'd use a leaf texture here with alpha map for shape, keeping it simple geometric for now or proceed with texture gen if requested */}
          </mesh>
        ))}
      </group>
    </group>
  );
}

// -- 3. Forest Environment --
export function BambooForest() {
  const floorTex = useMemo(() => {
    const t = makeForestFloorTexture();
    t.repeat.set(8, 8);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    return t;
  }, []);

  // Generate Forest Layout
  const stalks = useMemo(() => {
    const items = [];
    // Dense Background
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 5 + Math.random() * 12; // Radius 5-17
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r - 4; // Shift back a bit
      items.push({
        pos: [x, 0, z] as [number, number, number],
        h: 5 + Math.random() * 4,
        thick: 0.06 + Math.random() * 0.08,
        var: Math.floor(Math.random() * 4),
        tilt: (Math.random() - 0.5) * 0.1
      });
    }
    // Midground Framing (Avoid center play area: approx +/- 2 x, 0-2 z)
    for (let i = 0; i < 15; i++) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = (2.5 + Math.random() * 3) * side;
      const z = (Math.random() - 0.5) * 4;
      items.push({
        pos: [x, 0, z] as [number, number, number],
        h: 4 + Math.random() * 3,
        thick: 0.05 + Math.random() * 0.06,
        var: Math.floor(Math.random() * 4),
        tilt: (Math.random() - 0.5) * 0.15
      });
    }
    return items;
  }, []);

  const fogRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock, camera }) => {
    if (fogRef.current) {
      fogRef.current.uniforms.time.value = clock.getElapsedTime();
      fogRef.current.uniforms.cameraPosition.value = camera.position;
    }
  });

  return (
    <group>
      {/* Ground Plane - Dark, Damp */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60, 64, 64]} />
        <meshStandardMaterial
          map={floorTex}
          color="#5c6e5c" // Desaturated green-grey
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Water Pool - Reflective patch */}
      <mesh position={[2, 0.02, 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.8, 32]} />
        <meshStandardMaterial
          color="#0f2b23"
          roughness={0.15}
          metalness={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Scattered Rocks / Moss */}
      <mesh position={[-2, 0.2, 2]} castShadow>
        <dodecahedronGeometry args={[0.4]} />
        <meshStandardMaterial color="#4a5c4a" roughness={0.9} />
      </mesh>
      <mesh position={[2.5, 0.15, -0.5]} castShadow rotation={[0.4, 0.6, 0]}>
        <dodecahedronGeometry args={[0.3]} />
        <meshStandardMaterial color="#3d4f3d" roughness={0.9} />
      </mesh>

      {/* Bamboo Stalks */}
      {stalks.map((s, i) => (
        <BambooStalk
          key={i}
          position={s.pos}
          height={s.h}
          thickness={s.thick}
          variant={s.var}
          tilt={s.tilt}
        />
      ))}

      {/* Foreground Blurred Elements for Depth */}
      <group position={[0, 0, 4.5]}>
        <BambooStalk position={[-1.5, 0, 0]} height={4} thickness={0.1} variant={1} tilt={0.1} />
        <BambooStalk position={[2.2, 0, 0.5]} height={5} thickness={0.09} variant={0} tilt={-0.1} />
      </group>

      {/* Volumetric Height Fog Box */}
      <mesh position={[0, 3, 0]}>
        <boxGeometry args={[40, 8, 40]} />
        {/* @ts-ignore */}
        <heightFogMaterial ref={fogRef} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
