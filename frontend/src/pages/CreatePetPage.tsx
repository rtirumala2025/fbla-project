/**
 * CreatePetPage - Simple page that uses PetCreationForm
 * Provides a streamlined pet creation experience
 */
import React from 'react';
import { motion } from 'framer-motion';
import { PetCreationForm } from '../components/pets/PetCreationForm';

export const CreatePetPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Create Your Virtual Pet
          </h1>
          <p className="text-lg text-gray-600">
            Choose a pet type and give it a name to get started
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <PetCreationForm />
        </motion.div>
      </div>
    </div>
  );
};

