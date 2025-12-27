/**
 * PetVisual Component
 * PHASE 3: PET VISUAL GROUNDING
 *
 * Renders a pet visually using pure React + CSS with full-body assets.
 * VISUAL ONLY — no gameplay logic.
 */

import React, { useMemo } from 'react';
import { LazyImage } from './LazyImage';
import './PetVisual.css';

export type PetType = 'dog' | 'cat' | 'panda';

export type PetAnimationState = 'idle' | 'walk' | 'eat' | 'play' | 'bathe' | 'sleep';

export interface PetVisualStats {
  happiness?: number;
  energy?: number;
  cleanliness?: number;
  hunger?: number;
}

export interface PetVisualProps {
  petType: PetType;
  animation?: PetAnimationState;
  mood?: string;
  stats?: PetVisualStats;
}

export const PetVisual: React.FC<PetVisualProps> = ({ petType, animation = 'idle', mood, stats }) => {
  const normalizedPetType: PetType = useMemo(() => {
    if (petType === 'dog' || petType === 'cat' || petType === 'panda') {
      return petType;
    }
    console.warn(`PetVisual: Unknown petType "${petType}", defaulting to "dog"`);
    return 'dog';
  }, [petType]);

  const assetPaths = useMemo(
    () => ({
      body: `/assets/pets/${normalizedPetType}/body.svg`,
      eyes: `/assets/pets/${normalizedPetType}/eyes.svg`,
      tail: `/assets/pets/${normalizedPetType}/tail.svg`,
    }),
    [normalizedPetType]
  );

  return (
    <div className="pet-world-anchor">
      <div className="pet-visual-container">
        <figure
          className={`pet pet-${normalizedPetType} pet-state-${animation} ${mood ? `pet-mood-${mood.toLowerCase()}` : ''}`}
          style={{
            ['--pet-happiness' as any]: String(stats?.happiness ?? 50),
            ['--pet-energy' as any]: String(stats?.energy ?? 50),
            ['--pet-cleanliness' as any]: String(stats?.cleanliness ?? 50),
            ['--pet-hunger' as any]: String(stats?.hunger ?? 50),
          }}
        >
          <LazyImage
            src={assetPaths.body}
            alt={`${normalizedPetType} body`}
            className="pet-body-layer"
            fallback=""
          />
          <LazyImage
            src={assetPaths.eyes}
            alt=""
            className="pet-eyes-layer"
            aria-hidden="true"
            fallback=""
          />
          <LazyImage
            src={assetPaths.tail}
            alt=""
            className="pet-tail-layer"
            aria-hidden="true"
            fallback=""
          />
        </figure>

        {/* Ground contact shadow */}
        <div className="pet-shadow" />
      </div>
    </div>
  );
};

export default PetVisual;