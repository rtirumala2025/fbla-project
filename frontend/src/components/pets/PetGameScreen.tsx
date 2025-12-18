/**
 * PetGameScreen Component
 * Now renders the immersive PetGameScene for a true game experience
 * The old dashboard-style UI has been replaced with a living game world
 */
import React from 'react';
import { PetGameScene } from './PetGameScene';

export function PetGameScreen() {
  return <PetGameScene />;
}

// Default export for lazy loading compatibility
export default PetGameScreen;

