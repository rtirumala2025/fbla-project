/**
 * PetVisual Component
 * PHASE 3: PET VISUAL GROUNDING
 * 
 * Renders a pet visually using pure React + CSS.
 * This is a VISUAL GROUNDING step ONLY - no gameplay mechanics, stats, or interactions.
 * 
 * Requirements:
 * - Pure React + CSS (NO Three.js, NO Canvas, NO WebGL)
 * - Accepts petType: 'dog' | 'cat' | 'panda'
 * - Uses CSS animations for subtle pet animations
 * - Pet only (environment is handled separately by EnvironmentRenderer)
 */

import React, { useMemo } from 'react';
import './PetVisual.css';

export type PetType = 'dog' | 'cat' | 'panda';

export interface PetVisualProps {
  petType: PetType;
}

// Pet emojis by type - normalized for consistent visual weight
const PET_EMOJI: Record<PetType, string> = {
  dog: '🐕',
  cat: '🐱',
  panda: '🐼',
};

/**
 * PetVisual Component
 * Renders a pet visually with subtle idle animations
 */
export const PetVisual: React.FC<PetVisualProps> = ({ petType }) => {
  // Defensive: normalize petType and provide safe fallback
  const normalizedPetType: PetType = useMemo(() => {
    if (petType === 'dog' || petType === 'cat' || petType === 'panda') {
      return petType;
    }
    return 'dog';
  }, [petType]);

  const petEmoji = PET_EMOJI[normalizedPetType];

  return (
    <div className="pet-visual-container">
      <div className="pet-sprite-container">
        <div className="pet-sprite">
          <span className="pet-emoji" role="img" aria-label={`${normalizedPetType} pet`}>
            {petEmoji}
          </span>
        </div>
        <div className="pet-shadow" />
      </div>
    </div>
  );
};

export default PetVisual;

