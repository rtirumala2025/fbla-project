import React, { useMemo } from 'react';
import { Hud, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { PetStats } from '@/types/pet';
import { ActionBar } from './ActionBar';
import type { PetGame2Action } from '../core/SceneManager';

function StatBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const w = 1.4;
  const h = 0.11;
  const fillW = (clamped / 100) * w;

  const bgMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a1f2e',
        transparent: true,
        opacity: 0.3,
        roughness: 0.6,
      }),
    []
  );
  const fillMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        emissive: color,
        emissiveIntensity: 0.2,
      }),
    [color]
  );

  return (
    <group>
      <Text position={[0, 0.08, 0.1]} fontSize={0.1} color="#ffffff" anchorX="left" anchorY="middle">
        {label}
      </Text>

      <RoundedBox args={[w, h, 0.06]} radius={0.05} smoothness={6} position={[w * 0.5, 0, 0]}>
        <primitive attach="material" object={bgMat} />
      </RoundedBox>

      <RoundedBox
        args={[Math.max(0.02, fillW), h * 0.88, 0.07]}
        radius={0.05}
        smoothness={6}
        position={[fillW * 0.5, 0, 0.01]}
      >
        <primitive attach="material" object={fillMat} />
      </RoundedBox>

      <Text position={[w + 0.15, 0, 0.1]} fontSize={0.09} color="#d1d5db" anchorX="left" anchorY="middle">
        {Math.round(clamped)}%
      </Text>
    </group>
  );
}

export function HUD({
  petName,
  stats,
  disabled,
  onAction,
}: {
  petName: string;
  stats: PetStats | null;
  disabled: boolean;
  onAction: (action: PetGame2Action) => void;
}) {
  // Glassmorphism panel material - semi-transparent with glow
  const panelMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0f172a',
        transparent: true,
        opacity: 0.25,
        roughness: 0.4,
        metalness: 0.1,
        emissive: '#1e293b',
        emissiveIntensity: 0.15,
      }),
    []
  );

  const hunger = stats?.hunger ?? 50;
  const happiness = stats?.happiness ?? 50;
  const energy = stats?.energy ?? 50;

  return (
    <Hud>
      {/* Position in top-left corner */}
      <group position={[-2.8, 2.2, 0]}>
        {/* Glassmorphic background panel */}
        <RoundedBox args={[2.6, 1.8, 0.08]} radius={0.15} smoothness={8} position={[1.3, -0.9, 0]}>
          <primitive attach="material" object={panelMat} />
        </RoundedBox>

        {/* Pet name with glow */}
        <Text
          position={[0.15, 0, 0.12]}
          fontSize={0.16}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {petName}
        </Text>

        {/* Stat bars - stacked vertically */}
        <group position={[0.15, -0.35, 0.1]}>
          <StatBar label="Hunger" value={hunger} color="#fbbf24" />
        </group>
        <group position={[0.15, -0.75, 0.1]}>
          <StatBar label="Happiness" value={happiness} color="#60a5fa" />
        </group>
        <group position={[0.15, -1.15, 0.1]}>
          <StatBar label="Energy" value={energy} color="#34d399" />
        </group>

        {/* Action bar positioned below stats */}
        <group position={[0, -1.65, 0]}>
          <ActionBar disabled={disabled} onAction={onAction} />
        </group>
      </group>
    </Hud>
  );
}
