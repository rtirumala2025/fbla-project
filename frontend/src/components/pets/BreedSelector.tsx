import React from 'react';
import { motion } from 'framer-motion';
import { PetType } from './PetTypeSelector';

export interface BreedOption {
  id: string;
  name: string;
}

// Breed data structure - 3 breeds per pet type
const breedData: Record<PetType, BreedOption[]> = {
  dog: [
    { id: 'breed1', name: 'Breed1' },
    { id: 'breed2', name: 'Breed2' },
    { id: 'breed3', name: 'Breed3' },
  ],
  cat: [
    { id: 'breed1', name: 'Breed1' },
    { id: 'breed2', name: 'Breed2' },
    { id: 'breed3', name: 'Breed3' },
  ],
  panda: [
    { id: 'breed1', name: 'Breed1' },
    { id: 'breed2', name: 'Breed2' },
    { id: 'breed3', name: 'Breed3' },
  ],
};

interface BreedSelectorProps {
  selectedType: PetType | null;
  selectedBreed: string | null;
  onSelectBreed: (breedId: string) => void;
}

export const BreedSelector: React.FC<BreedSelectorProps> = ({
  selectedType,
  selectedBreed,
  onSelectBreed,
}) => {
  if (!selectedType) {
    return (
      <div className="w-full text-center py-8">
        <p className="text-gray-500">Please select a pet type first</p>
      </div>
    );
  }

  const breeds = breedData[selectedType];

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-charcoal mb-6 text-center">
        Choose a Breed
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {breeds.map((breed, index) => (
          <motion.button
            key={breed.id}
            onClick={() => onSelectBreed(breed.id)}
            className={`
              relative p-6 rounded-xl border-2 transition-all
              ${
                selectedBreed === breed.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                  : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
              }
            `}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Placeholder image/icon area */}
            <div className="w-full aspect-square mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-4xl">
                {selectedType === 'dog' && '🐕'}
                {selectedType === 'cat' && '🐱'}
                {selectedType === 'panda' && '🐼'}
              </span>
            </div>

            {/* Breed name */}
            <h3 className="text-lg font-bold text-charcoal text-center">
              {breed.name}
            </h3>

            {/* Selected indicator */}
            {selectedBreed === breed.id && (
              <motion.div
                className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

