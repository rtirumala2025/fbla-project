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
  x,
  y,
}: {
  label: string;
  value: number;
  color: string;
  x: number;
  y: number;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const w = 1.7;
  const h = 0.14;
  const fillW = (clamped / 100) * w;

  const bgMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0b1020', roughness: 0.8 }), []);
  const fillMat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.45 }), [color]);

  return (
    <group position={[x, y, 0]}>
      <Text position={[-0.95, 0.02, 0.1]} fontSize={0.13} color="#e5e7eb" anchorX="left" anchorY="middle">
        {label}
      </Text>

      <RoundedBox args={[w, h, 0.08]} radius={0.06} smoothness={6} position={[0, -0.12, 0]}>
        <primitive attach="material" object={bgMat} />
      </RoundedBox>

      <RoundedBox
        args={[Math.max(0.02, fillW), h * 0.92, 0.085]}
        radius={0.06}
        smoothness={6}
        position={[-(w - fillW) * 0.5, -0.12, 0.02]}
      >
        <primitive attach="material" object={fillMat} />
      </RoundedBox>
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
  const panelMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.65, metalness: 0.0 }), []);

  const hunger = stats?.hunger ?? 50;
  const happiness = stats?.happiness ?? 50;
  const energy = stats?.energy ?? 50;

  return (
    <Hud>
      <group position={[0, 0, 0]}>
        <RoundedBox args={[4.3, 1.35, 0.12]} radius={0.18} smoothness={8} position={[0, 1.55, 0]}>
          <primitive attach="material" object={panelMat} />
        </RoundedBox>

        <Text position={[-1.95, 1.95, 0.12]} fontSize={0.22} color="#ffffff" anchorX="left" anchorY="middle">
          {petName}
        </Text>

        <StatBar label="Hunger" value={hunger} color="#f6dfb8" x={-0.15} y={1.76} />
        <StatBar label="Happiness" value={happiness} color="#cfe0ff" x={-0.15} y={1.38} />
        <StatBar label="Energy" value={energy} color="#e2f6ea" x={-0.15} y={1.0} />

        <ActionBar disabled={disabled} onAction={onAction} />
      </group>
    </Hud>
  );
}
