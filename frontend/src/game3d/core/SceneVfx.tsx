import React, { useMemo } from 'react';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { PetGame2Vfx } from './SceneManager';

function VfxText({ text, color, y }: { text: string; color: string; y: number }) {
  const position = useMemo(() => new THREE.Vector3(0, y, 0), [y]);
  return (
    <Billboard position={position} follow>
      <Text
        fontSize={0.22}
        color={color}
        outlineWidth={0.006}
        outlineColor="#0b1020"
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </Billboard>
  );
}

export function SceneVfx({ vfx }: { vfx: PetGame2Vfx[] }) {
  const active = vfx.slice(-3);

  return (
    <group>
      {active.map((fx, i) => {
        const y = 1.55 + i * 0.18;
        if (fx.kind === 'sparkleBurst') return <VfxText key={fx.id} text="Nice" color="#ffffff" y={y} />;
        if (fx.kind === 'foodPuff') return <VfxText key={fx.id} text="Fed" color="#ffe3a8" y={y} />;
        if (fx.kind === 'toyBounce') return <VfxText key={fx.id} text="Play" color="#c0d7ff" y={y} />;
        return <VfxText key={fx.id} text="Rest" color="#cfead8" y={y} />;
      })}
    </group>
  );
}
