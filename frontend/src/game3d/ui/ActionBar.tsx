import React, { useMemo, useState } from 'react';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { PetGame2Action } from '../core/SceneManager';

function ActionButton({
  label,
  action,
  disabled,
  onAction,
  x,
}: {
  label: string;
  action: PetGame2Action;
  disabled: boolean;
  onAction: (action: PetGame2Action) => void;
  x: number;
}) {
  const [hovered, setHovered] = useState(false);

  const colors = useMemo(() => {
    const base = action === 'feed' ? '#e7c58e' : action === 'play' ? '#a8c7ff' : '#cfead8';
    const top = action === 'feed' ? '#f6dfb8' : action === 'play' ? '#cfe0ff' : '#e2f6ea';
    return { base, top };
  }, [action]);

  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: colors.base, roughness: 0.55, metalness: 0.0 });
    return m;
  }, [colors.base]);

  const topMaterial = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: colors.top, roughness: 0.45, metalness: 0.0 });
    return m;
  }, [colors.top]);

  const y = -1.7;

  return (
    <group position={[x, y, 0]}>
      <RoundedBox
        args={[1.25, 0.46, 0.14]}
        radius={0.14}
        smoothness={8}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (disabled) return;
          onAction(action);
        }}
      >
        <primitive attach="material" object={material} />
      </RoundedBox>

      <RoundedBox args={[1.23, 0.22, 0.06]} radius={0.12} smoothness={8} position={[0, 0.08, 0.09]}>
        <primitive attach="material" object={topMaterial} />
      </RoundedBox>

      <Text
        position={[0, -0.02, 0.12]}
        fontSize={0.17}
        color={disabled ? '#6b7280' : '#0b1020'}
        outlineWidth={hovered && !disabled ? 0.004 : 0}
        outlineColor="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

export function ActionBar({
  disabled,
  onAction,
}: {
  disabled: boolean;
  onAction: (action: PetGame2Action) => void;
}) {
  return (
    <group>
      <ActionButton label="Feed" action="feed" disabled={disabled} onAction={onAction} x={-1.4} />
      <ActionButton label="Play" action="play" disabled={disabled} onAction={onAction} x={0} />
      <ActionButton label="Rest" action="rest" disabled={disabled} onAction={onAction} x={1.4} />
    </group>
  );
}
