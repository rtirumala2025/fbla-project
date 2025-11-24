import React from 'react';
import { motion } from 'framer-motion';
import { PetType } from './PetTypeSelector';

interface PreviewAreaProps {
  selectedType: PetType | null;
  selectedBreed: string | null;
}

export const PreviewArea: React.FC<PreviewAreaProps> = ({
  selectedType,
  selectedBreed,
}) => {
  const getTypeEmoji = (type: PetType | null) => {
    if (!type) return '❓';
    switch (type) {
      case 'dog':
        return '🐕';
      case 'cat':
        return '🐱';
      case 'panda':
        return '🐼';
      default:
        return '❓';
    }
  };

  const getTypeName = (type: PetType | null) => {
    if (!type) return 'No Type Selected';
    switch (type) {
      case 'dog':
        return 'Dog';
      case 'cat':
        return 'Cat';
      case 'panda':
        return 'Panda';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border-2 border-gray-200 p-6">
      <h2 className="text-xl font-bold text-charcoal mb-4 text-center">
        Preview
      </h2>
      
      {selectedType && selectedBreed ? (
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Pet preview placeholder */}
          <div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-6xl">
            {getTypeEmoji(selectedType)}
          </div>

          {/* Pet info */}
          <div className="space-y-2">
            <p className="text-lg font-semibold text-charcoal">
              {getTypeName(selectedType)}
            </p>
            <p className="text-sm text-gray-600">
              Breed: {selectedBreed}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-8">
          <div className="w-32 h-32 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center text-6xl">
            {getTypeEmoji(selectedType)}
          </div>
          <p className="text-gray-500">
            {selectedType
              ? 'Select a breed to see preview'
              : 'Select a pet type and breed'}
          </p>
        </div>
      )}
    </div>
  );
};

