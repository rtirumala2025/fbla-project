import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Breed {
  id: string;
  name: string;
  description: string;
  traits: string[];
}

const breedData: Record<string, Breed[]> = {
  dog: [
    { id: 'labrador', name: 'Labrador', description: 'Friendly and outgoing', traits: ['Energetic', 'Friendly'] },
    { id: 'poodle', name: 'Poodle', description: 'Intelligent and elegant', traits: ['Smart', 'Active'] },
    { id: 'german-shepherd', name: 'German Shepherd', description: 'Loyal and confident', traits: ['Protective', 'Loyal'] },
    { id: 'beagle', name: 'Beagle', description: 'Merry and friendly', traits: ['Curious', 'Gentle'] },
    { id: 'golden-retriever', name: 'Golden Retriever', description: 'Intelligent and devoted', traits: ['Friendly', 'Devoted'] },
  ],
  cat: [
    { id: 'siamese', name: 'Siamese', description: 'Vocal and social', traits: ['Vocal', 'Social'] },
    { id: 'persian', name: 'Persian', description: 'Calm and sweet', traits: ['Calm', 'Affectionate'] },
    { id: 'tabby', name: 'Tabby', description: 'Playful and friendly', traits: ['Playful', 'Friendly'] },
    { id: 'maine-coon', name: 'Maine Coon', description: 'Gentle giant', traits: ['Gentle', 'Social'] },
  ],
  bird: [
    { id: 'parakeet', name: 'Parakeet', description: 'Cheerful and active', traits: ['Cheerful', 'Active'] },
    { id: 'canary', name: 'Canary', description: 'Sweet singer', traits: ['Musical', 'Calm'] },
    { id: 'cockatiel', name: 'Cockatiel', description: 'Affectionate and social', traits: ['Affectionate', 'Social'] },
  ],
  rabbit: [
    { id: 'holland-lop', name: 'Holland Lop', description: 'Friendly and calm', traits: ['Friendly', 'Calm'] },
    { id: 'lionhead', name: 'Lionhead', description: 'Fluffy and playful', traits: ['Playful', 'Gentle'] },
    { id: 'dutch', name: 'Dutch', description: 'Active and friendly', traits: ['Active', 'Friendly'] },
  ],
};

export const BreedSelection = () => {
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [selectedBreed, setSelectedBreed] = useState<string | null>(null);
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const species = localStorage.getItem('selectedSpecies');
    if (!species) {
      navigate('/onboarding/species');
      return;
    }
    setSelectedSpecies(species);
    setBreeds(breedData[species] || []);
  }, [navigate]);

  const handleContinue = () => {
    if (selectedBreed) {
      localStorage.setItem('selectedBreed', selectedBreed);
      navigate('/onboarding/naming');
    }
  };

  const handleBack = () => {
    navigate('/onboarding/species');
  };

  return (
    <div className="min-h-screen bg-slate-900 px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-8 h-2 bg-indigo-600 rounded-full" />
          <div className="w-8 h-2 bg-indigo-600 rounded-full" />
          <div className="w-8 h-2 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-slate-50 mb-4">
            Pick a breed
          </h1>
          <p className="text-xl text-slate-400 capitalize">
            Choose your {selectedSpecies} breed
          </p>
        </motion.div>

        {/* Breed grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {breeds.map((breed, index) => (
            <motion.button
              key={breed.id}
              onClick={() => setSelectedBreed(breed.id)}
              className={`text-left bg-slate-800/50 backdrop-blur-sm border-2 rounded-2xl p-6 transition-all ${
                selectedBreed === breed.id
                  ? 'border-indigo-500 shadow-lg shadow-indigo-500/50'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              {/* Placeholder for breed image */}
              <div className="w-full aspect-square bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center mb-4 text-6xl">
                {selectedSpecies === 'dog' && '🐕'}
                {selectedSpecies === 'cat' && '🐱'}
                {selectedSpecies === 'bird' && '🐦'}
                {selectedSpecies === 'rabbit' && '🐰'}
              </div>

              <h3 className="text-xl font-black text-slate-50 mb-2">{breed.name}</h3>
              <p className="text-slate-400 text-sm mb-4">{breed.description}</p>

              {/* Traits */}
              <div className="flex flex-wrap gap-2">
                {breed.traits.map((trait) => (
                  <span
                    key={trait}
                    className="px-3 py-1 bg-slate-900/50 border border-slate-700 rounded-full text-xs font-semibold text-slate-300"
                  >
                    {trait}
                  </span>
                ))}
              </div>

              {/* Selected indicator */}
              {selectedBreed === breed.id && (
                <motion.div
                  className="mt-4 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <ArrowRight className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            className="px-8 py-4 bg-slate-800 border border-slate-700 text-slate-300 font-bold rounded-xl hover:border-slate-600 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <button
            onClick={handleContinue}
            disabled={!selectedBreed}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Name Your Pet
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
