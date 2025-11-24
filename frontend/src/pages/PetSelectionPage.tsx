import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PetTypeSelector, PetType } from '../components/pets/PetTypeSelector';
import { BreedSelector } from '../components/pets/BreedSelector';
import { PreviewArea } from '../components/pets/PreviewArea';

export const PetSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<PetType | null>(null);
  const [selectedBreed, setSelectedBreed] = useState<string | null>(null);

  const handleTypeSelect = (type: PetType) => {
    setSelectedType(type);
    // Reset breed selection when type changes
    setSelectedBreed(null);
  };

  const handleBreedSelect = (breedId: string) => {
    setSelectedBreed(breedId);
  };

  const handleContinue = () => {
    if (selectedType && selectedBreed) {
      // Get breed name from the breed ID
      const breedData: Record<PetType, { id: string; name: string }[]> = {
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
      
      const breedName = breedData[selectedType].find(b => b.id === selectedBreed)?.name || selectedBreed;
      
      // Navigate to naming page with selection data
      navigate('/onboarding/naming', {
        state: {
          selectedSpecies: selectedType,
          selectedBreed: breedName, // Pass breed name instead of ID
        },
      });
    }
  };

  // Log selection state for debugging (can be removed later)
  React.useEffect(() => {
    if (selectedType && selectedBreed) {
      console.log('Pet Selection:', {
        type: selectedType,
        breed: selectedBreed,
      });
    }
  }, [selectedType, selectedBreed]);

  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Select Your Virtual Pet
          </h1>
          <p className="text-lg text-gray-600">
            Choose a pet type and breed to get started
          </p>
        </motion.div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left column - Pet Type Selector */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PetTypeSelector
              selectedType={selectedType}
              onSelectType={handleTypeSelect}
            />
          </motion.div>

          {/* Right column - Preview Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PreviewArea
              selectedType={selectedType}
              selectedBreed={selectedBreed}
            />
          </motion.div>
        </div>

        {/* Breed Selector - Full width below */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <BreedSelector
            selectedType={selectedType}
            selectedBreed={selectedBreed}
            onSelectBreed={handleBreedSelect}
          />
        </motion.div>

        {/* Continue Button */}
        {selectedType && selectedBreed && (
          <motion.div
            className="mt-8 flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg w-full max-w-md">
              <p className="text-sm text-indigo-800 text-center mb-2">
                <strong>Selected:</strong> {selectedType} - {selectedBreed}
              </p>
              <p className="text-xs text-indigo-600 text-center">
                ⚠️ Selection is in memory only (not saved to database yet)
              </p>
            </div>
            <button
              onClick={handleContinue}
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
            >
              Continue to Name Your Pet →
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

