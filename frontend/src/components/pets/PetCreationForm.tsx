/**
 * PetCreationForm Component
 * Simple form for creating a pet with type selection and name input
 * Connects to Supabase and Google Auth via PetContext
 */
import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePet } from '../../context/PetContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

type PetType = 'dog' | 'cat' | 'panda';

const PET_TYPES: Array<{ id: PetType; name: string; emoji: string }> = [
  { id: 'dog', name: 'Dog', emoji: '🐕' },
  { id: 'cat', name: 'Cat', emoji: '🐱' },
  { id: 'panda', name: 'Panda', emoji: '🐼' },
];

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 20;

interface PetCreationFormProps {
  onSuccess?: () => void;
}

export const PetCreationForm: React.FC<PetCreationFormProps> = ({ onSuccess }) => {
  const [selectedType, setSelectedType] = useState<PetType | null>(null);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ type?: string; name?: string }>({});
  
  const navigate = useNavigate();
  const { createPet } = usePet();
  const { currentUser } = useAuth();
  const toast = useToast();

  // Validate form inputs
  const validate = (): boolean => {
    const newErrors: { type?: string; name?: string } = {};

    if (!selectedType) {
      newErrors.type = 'Please select a pet type';
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = 'Pet name is required';
    } else if (trimmedName.length < MIN_NAME_LENGTH) {
      newErrors.name = `Name must be at least ${MIN_NAME_LENGTH} characters`;
    } else if (trimmedName.length > MAX_NAME_LENGTH) {
      newErrors.name = `Name must be no more than ${MAX_NAME_LENGTH} characters`;
    } else if (!/^[a-zA-Z0-9\s'-]+$/.test(trimmedName)) {
      newErrors.name = 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (!currentUser) {
      toast.error('You must be logged in to create a pet');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const trimmedName = name.trim();
      // Use 'Mixed' as default breed for simplicity
      await createPet(trimmedName, selectedType!, 'Mixed');
      
      toast.success(`Your ${PET_TYPES.find(t => t.id === selectedType)?.name.toLowerCase()} ${trimmedName} has been created!`);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default: navigate to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to create pet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create pet. Please try again.';
      toast.error(errorMessage);
      setErrors({ name: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pet Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Pet Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PET_TYPES.map((type) => (
            <motion.button
              key={type.id}
              type="button"
              onClick={() => {
                setSelectedType(type.id);
                setErrors(prev => ({ ...prev, type: undefined }));
              }}
              className={`
                relative p-6 rounded-xl border-2 transition-all
                ${
                  selectedType === type.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                    : 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-4xl mb-2">{type.emoji}</div>
              <div className="text-lg font-semibold text-gray-900">{type.name}</div>
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
        {errors.type && (
          <p className="mt-2 text-sm text-red-600">{errors.type}</p>
        )}
      </div>

      {/* Name Input */}
      <div>
        <label htmlFor="pet-name" className="block text-sm font-medium text-gray-700 mb-2">
          Pet Name <span className="text-red-500">*</span>
        </label>
        <input
          id="pet-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors(prev => ({ ...prev, name: undefined }));
          }}
          placeholder="Enter your pet's name..."
          maxLength={MAX_NAME_LENGTH}
          minLength={MIN_NAME_LENGTH}
          className={`
            w-full px-4 py-3 border rounded-lg transition-all
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none
            ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}
          `}
          disabled={isSubmitting}
        />
        <div className="mt-1 flex justify-between items-center">
          <div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {name.length}/{MAX_NAME_LENGTH} characters
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !selectedType || !name.trim()}
        className={`
          w-full px-6 py-3 rounded-lg font-semibold text-white transition-all
          ${
            isSubmitting || !selectedType || !name.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl'
          }
        `}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Pet...
          </span>
        ) : (
          'Create Pet'
        )}
      </button>
    </form>
  );
};

