import React from 'react';
import type { PetGame2Vfx } from './SceneManager';
import { ParticleSystem } from './ParticleSystem';

export function SceneVfx({ vfx }: { vfx: PetGame2Vfx[] }) {
  // Only show the most recent effects to avoid clutter
  const active = vfx.slice(-5);

  return (
    <group>
      {active.map((fx) => {
        // Stagger positions slightly so they don't perfectly overlap
        // Lifted higher (y=1.5) to account for Pro Scale (1.2)
        const position: [number, number, number] = [
          (Math.random() - 0.5) * 1.2,
          1.5 + (Math.random() * 0.8),
          (Math.random() - 0.5) * 0.8 + 0.8
        ];

        // sparkleBurst - general tap interaction
        if (fx.kind === 'sparkleBurst') {
          return <ParticleSystem key={fx.id} type="star" count={8} color="#ffd700" position={position} duration={2} />;
        }

        // foodPuff - feed action: hearts (love/care)
        if (fx.kind === 'foodPuff') {
          return <ParticleSystem key={fx.id} type="heart" count={6} color="#ff6b6b" position={position} duration={2.5} />;
        }

        // toyBounce - play action: colorful stars
        if (fx.kind === 'toyBounce') {
          return <ParticleSystem key={fx.id} type="star" count={8} color="#a78bfa" position={position} duration={2} />;
        }

        // sleepZ - rest action: slow floating bubbles (like ZZZ)
        if (fx.kind === 'sleepZ') {
          return <ParticleSystem key={fx.id} type="bubble" count={5} color="#818cf8" position={[position[0], position[1] + 0.5, position[2]]} duration={4} />;
        }

        // bubbleBurst - bathe action: water bubbles
        if (fx.kind === 'bubbleBurst') {
          return <ParticleSystem key={fx.id} type="bubble" count={8} color="#67e8f9" position={position} duration={2.5} />;
        }

        // cleaning - bathe sparkle effect
        if (fx.kind === 'cleaning') {
          return <ParticleSystem key={fx.id} type="star" count={5} color="#34d399" position={[position[0], position[1] - 0.3, position[2]]} duration={2} />;
        }

        // All VFX kinds should be handled above, but return null for safety
        return null;
      })}
    </group>
  );
}
