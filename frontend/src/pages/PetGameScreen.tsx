/**
 * PetGameScreen Page Component
 * Redirects to the immersive PetGameScene for a true game experience
 * This file exists for routing compatibility
 */
import React from 'react';
import { PetGameScene } from '../components/pets/PetGameScene';

export const PetGameScreen: React.FC = () => {
  return <PetGameScene />;
};

export default PetGameScreen;
