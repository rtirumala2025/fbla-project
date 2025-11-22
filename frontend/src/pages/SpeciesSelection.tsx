import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Species {
  id: string;
  name: string;
  emoji: string;
  description: string;
  traits: string[];
  gradient: string;
}

const species: Species[] = [
  {
    id: 'dog',
    name: 'Dog',
    emoji: '🐕',
    description: 'Loyal and energetic. Needs lots of play time.',
    traits: ['High Energy', 'Social', 'Loyal'],
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'cat',
    name: 'Cat',
    emoji: '🐱',
    description: 'Independent and curious. Lower maintenance.',
    traits: ['Independent', 'Curious', 'Calm'],
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'bird',
    name: 'Bird',
    emoji: '🐦',
    description: 'Cheerful and vocal. Needs regular care.',
    traits: ['Vocal', 'Active', 'Social'],
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'rabbit',
    name: 'Rabbit',
    emoji: '🐰',
    description: 'Gentle and playful. Moderate energy.',
    traits: ['Gentle', 'Playful', 'Quiet'],
    gradient: 'from-pink-500 to-rose-600',
  },
];

export const SpeciesSelection = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (selected) {
      // Pass selection via React Router state (no localStorage)
      navigate('/onboarding/breed', { state: { selectedSpecies: selected } });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-8 h-2 bg-indigo-600 rounded-full" />
          <div className="w-8 h-2 bg-slate-700 rounded-full" />
          <div className="w-8 h-2 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-slate-50 mb-4">
            Choose your companion
          </h1>
          <p className="text-xl text-slate-400">
            Each species has unique needs and personality traits
          </p>
        </motion.div>

        {/* Species grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {species.map((spec, index) => (
            <motion.button
              key={spec.id}
              onClick={() => setSelected(spec.id)}
              className={`text-left bg-slate-800/50 backdrop-blur-sm border-2 rounded-2xl p-6 transition-all ${
                selected === spec.id
                  ? 'border-indigo-500 shadow-lg shadow-indigo-500/50'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              {/* Emoji display */}
              <div className={`w-full aspect-square bg-gradient-to-br ${spec.gradient} rounded-xl flex items-center justify-center mb-4 text-6xl`}>
                {spec.emoji}
              </div>

              {/* Species info */}
              <h3 className="text-2xl font-black text-slate-50 mb-2">{spec.name}</h3>
              <p className="text-slate-400 text-sm mb-4 leading-relaxed">{spec.description}</p>

              {/* Traits */}
              <div className="flex flex-wrap gap-2">
                {spec.traits.map((trait) => (
                  <span
                    key={trait}
                    className="px-3 py-1 bg-slate-900/50 border border-slate-700 rounded-full text-xs font-semibold text-slate-300"
                  >
                    {trait}
                  </span>
                ))}
              </div>

              {/* Selected indicator */}
              {selected === spec.id && (
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

        {/* Continue button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Continue to Breeds
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
