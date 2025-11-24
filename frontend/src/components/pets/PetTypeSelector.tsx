import React from 'react';
import { motion } from 'framer-motion';

export type PetType = 'dog' | 'cat' | 'panda';

export interface PetTypeOption {
  id: PetType;
  name: string;
  emoji: string;
  description: string;
}

const petTypes: PetTypeOption[] = [
  {
    id: 'dog',
    name: 'Dog',
    emoji: '🐕',
    description: 'Loyal and energetic companion',
  },
  {
    id: 'cat',
    name: 'Cat',
    emoji: '🐱',
    description: 'Independent and curious friend',
  },
  {
    id: 'panda',
    name: 'Panda',
    emoji: '🐼',
    description: 'Gentle and playful buddy',
  },
];

interface PetTypeSelectorProps {
  selectedType: PetType | null;
  onSelectType: (type: PetType) => void;
}

export const PetTypeSelector: React.FC<PetTypeSelectorProps> = ({
  selectedType,
  onSelectType,
}) => {
  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-charcoal mb-6 text-center">
        Choose Your Pet Type
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {petTypes.map((type, index) => (
          <motion.button
            key={type.id}
            onClick={() => onSelectType(type.id)}
            className={`
              relative p-6 rounded-xl border-2 transition-all
              ${
                selectedType === type.id
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
            {/* Emoji/Icon placeholder */}
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-4xl">
              {type.emoji}
            </div>

            {/* Type name */}
            <h3 className="text-xl font-bold text-charcoal mb-2 text-center">
              {type.name}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 text-center mb-4">
              {type.description}
            </p>

            {/* Selected indicator */}
            {selectedType === type.id && (
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

