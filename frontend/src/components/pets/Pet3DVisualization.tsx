/**
 * Pet3DVisualization Component
 * Placeholder component (3D functionality temporarily disabled)
 */
import React, { memo } from 'react';
import { Pet } from '../../types/pet';
import { AccessoryEquipResponse } from '../../types/accessories';

interface Pet3DVisualizationProps {
  pet: Pet;
  accessories?: AccessoryEquipResponse[];
  size?: 'sm' | 'md' | 'lg';
}

export const Pet3DVisualization: React.FC<Pet3DVisualizationProps> = memo(({
  pet,
  accessories = [],
  size = 'md',
}) => {
  const height = size === 'sm' ? 300 : size === 'md' ? 400 : 500;

  return (
    <div 
      className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-lg flex items-center justify-center"
      style={{ height: `${height}px` }}
    >
      <div className="text-center">
        <div className="mb-4 text-6xl">🐾</div>
        <div className="text-xl font-bold text-gray-800">{pet.name}</div>
        {pet.level && (
          <div className="text-sm text-gray-600">Level {pet.level}</div>
        )}
        {accessories && accessories.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {accessories.filter(acc => acc.equipped).length} accessory{accessories.filter(acc => acc.equipped).length !== 1 ? 's' : ''} equipped
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if pet or accessories change
  return (
    prevProps.pet.id === nextProps.pet.id &&
    prevProps.pet.name === nextProps.pet.name &&
    prevProps.pet.species === nextProps.pet.species &&
    JSON.stringify(prevProps.accessories) === JSON.stringify(nextProps.accessories) &&
    prevProps.size === nextProps.size
  );
});

Pet3DVisualization.displayName = 'Pet3DVisualization';

export default Pet3DVisualization;
