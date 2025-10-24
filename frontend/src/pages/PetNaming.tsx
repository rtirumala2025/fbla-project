import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const randomNames = {
  dog: ['Max', 'Buddy', 'Charlie', 'Cooper', 'Rocky', 'Duke', 'Bear', 'Zeus', 'Tucker', 'Oliver'],
  cat: ['Luna', 'Simba', 'Milo', 'Cleo', 'Whiskers', 'Shadow', 'Felix', 'Bella', 'Oliver', 'Nala'],
  bird: ['Tweety', 'Sunny', 'Sky', 'Rio', 'Echo', 'Kiwi', 'Mango', 'Blue', 'Chirpy', 'Peaches'],
  rabbit: ['Thumper', 'Clover', 'Cotton', 'Hop', 'Bunny', 'Snowball', 'Fluffy', 'Peter', 'Daisy', 'Oreo'],
};

export const PetNaming = () => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedSpecies = localStorage.getItem('selectedSpecies');
    const storedBreed = localStorage.getItem('selectedBreed');
    
    if (!storedSpecies || !storedBreed) {
      navigate('/onboarding/species');
      return;
    }
    
    setSpecies(storedSpecies);
    setBreed(storedBreed);
  }, [navigate]);

  const generateRandomName = () => {
    const names = randomNames[species as keyof typeof randomNames] || randomNames.dog;
    const randomName = names[Math.floor(Math.random() * names.length)];
    setName(randomName);
  };

  const handleContinue = () => {
    if (name.trim()) {
      localStorage.setItem('petName', name);
      // Redirect to dashboard
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    navigate('/onboarding/breed');
  };

  return (
    <div className="min-h-screen bg-slate-900 px-6 py-12 flex items-center">
      <div className="max-w-2xl mx-auto w-full">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-8 h-2 bg-indigo-600 rounded-full" />
          <div className="w-8 h-2 bg-indigo-600 rounded-full" />
          <div className="w-8 h-2 bg-indigo-600 rounded-full" />
        </div>

        {/* Main card */}
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Pet preview */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-block text-8xl mb-6"
              animate={{
                y: [0, -10, 0],
                rotate: [-5, 5, -5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {species === 'dog' && '🐕'}
              {species === 'cat' && '🐱'}
              {species === 'bird' && '🐦'}
              {species === 'rabbit' && '🐰'}
            </motion.div>
            
            <div className="inline-block bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-4">
              <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider capitalize">
                {breed?.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Naming section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black text-slate-50 mb-4">
              Name your companion
            </h1>
            <p className="text-xl text-slate-400">
              This is the start of something special
            </p>
          </div>

          {/* Name input */}
          <div className="mb-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-6 py-4 text-slate-50 text-center text-2xl font-bold placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              maxLength={20}
            />
            <p className="text-center text-sm text-slate-500 mt-2">
              {name.length}/20 characters
            </p>
          </div>

          {/* Random name button */}
          <button
            onClick={generateRandomName}
            className="w-full mb-8 px-6 py-3 bg-slate-900/50 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:border-indigo-500/50 hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Generate Random Name
          </button>

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-4 bg-slate-900/50 border border-slate-700 text-slate-300 font-bold rounded-xl hover:border-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
            
            <button
              onClick={handleContinue}
              disabled={!name.trim()}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Start Journey
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
