/**
 * PetVisual Component
 * PHASE 3: PET VISUAL GROUNDING
 * 
 * Renders a pet visually using pure React + CSS with full-body assets.
 * This is a VISUAL GROUNDING step ONLY - no gameplay mechanics, stats, or interactions.
 * 
 * Requirements:
 * - Pure React + CSS (NO Three.js, NO Canvas, NO WebGL)
 * - Accepts petType: 'dog' | 'cat' | 'panda'
 * - Uses CSS animations for subtle pet animations (breathing, tail sway, eye blink)
 * - Pet only (environment is handled separately by EnvironmentRenderer)
 */

import React, { useMemo, useState } from 'react';
import { LazyImage } from './LazyImage';
import './PetVisual.css';

export type PetType = 'dog' | 'cat' | 'panda';

export interface PetVisualProps {
  petType: PetType;
}

/**
 * PetVisual Component
 * Renders a full-body pet with layered assets (body, eyes, tail) and subtle idle animations
 */
export const PetVisual: React.FC<PetVisualProps> = ({ petType }) => {
  // Defensive: normalize petType and provide safe fallback
  const normalizedPetType: PetType = useMemo(() => {
    if (petType === 'dog' || petType === 'cat' || petType === 'panda') {
      return petType;
    }
    console.warn(`PetVisual: Unknown petType "${petType}", defaulting to "dog"`);
    return 'dog';
  }, [petType]);

  // Memoize asset paths to avoid re-renders
  const assetPaths = useMemo(() => ({
    body: `/assets/pets/${normalizedPetType}/body.svg`,
    eyes: `/assets/pets/${normalizedPetType}/eyes.svg`,
    tail: `/assets/pets/${normalizedPetType}/tail.svg`,
  }), [normalizedPetType]);

  return (
    <div className="pet-visual-container">
      <div className="pet-sprite-container">
        <figure className={`pet pet-${normalizedPetType}`}>
          {/* Body layer - animates with breathing */}
          <LazyImage 
            src={assetPaths.body} 
            alt={`${normalizedPetType} body`}
            className="pet-body-layer"
            fallback=""
            onError={() => {
              console.error(`Failed to load pet body asset: ${assetPaths.body}`);
            }}
          />
          {/* Eyes layer - animates with blinking */}
          <LazyImage 
            src={assetPaths.eyes} 
            alt=""
            className="pet-eyes-layer"
            aria-hidden="true"
            fallback=""
            onError={() => {
              console.error(`Failed to load pet eyes asset: ${assetPaths.eyes}`);
            }}
          />
          {/* Tail layer - animates with sway */}
          <LazyImage 
            src={assetPaths.tail} 
            alt=""
            className="pet-tail-layer"
            aria-hidden="true"
            fallback=""
            onError={() => {
              console.error(`Failed to load pet tail asset: ${assetPaths.tail}`);
            }}
          />
        </figure>
        <div className="pet-shadow" />
      </div>
    </div>
  );
};

export default PetVisual;

