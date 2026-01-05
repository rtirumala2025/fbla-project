import React from 'react';
import type { PetGame2Vfx } from './SceneManager';
import { ParticleSystem } from './ParticleSystem';

export function SceneVfx({ vfx }: { vfx: PetGame2Vfx[] }) {
  // Only show the most recent effects to avoid clutter
  const active = vfx.slice(-4);

  return (
    <group>
      {active.map((fx, i) => {
        // Stagger positions slightly so they don't perfectly overlap
        // Lifted higher (y=1.5) to account for Pro Scale (1.2)
        const position: [number, number, number] = [
          (Math.random() - 0.5) * 1.5,
          1.5 + (Math.random() * 1.0),
          (Math.random() - 0.5) * 1.0 + 1.0
        ];

        if (fx.kind === 'sparkleBurst') {
          return <ParticleSystem key={fx.id} type="star" count={12} color="#ffffff" position={position} duration={2.5} />;
        }
        if (fx.kind === 'foodPuff') {
          return <ParticleSystem key={fx.id} type="heart" count={8} color="#ffb700" position={position} duration={3} />;
        }
        if (fx.kind === 'toyBounce') {
          return <ParticleSystem key={fx.id} type="star" count={10} color="#60a5fa" position={position} duration={2} />;
        }
        // Rest / Default
        return <ParticleSystem key={fx.id} type="bubble" count={6} color="#86efac" position={position} duration={4} />;
      })}
    </group>
  );
}
