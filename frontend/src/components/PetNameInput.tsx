import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Sparkles, Loader2 } from 'lucide-react';
import apiClient from '../services/apiClient';

// TypeScript interfaces matching backend schemas
export interface PetNameSuggestionResponse {
  valid: boolean;
  suggestions: string[];
}

export interface PetNameInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const PetNameInput: React.FC<PetNameInputProps> = ({
  value,
  onChange,
  onValidationChange,
  className = '',
  placeholder = 'Enter pet name...',
  disabled = false,
}) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const validateAndGetSuggestions = useCallback(async (name: string) => {
    if (!name || name.trim().length === 0) {
      setIsValid(null);
      setSuggestions([]);
      onValidationChange?.(undefined as any);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<PetNameSuggestionResponse>('/api/ai/pet_name_suggestions', {
        input_name: name.trim(),
      });

      setIsValid(response.data.valid);
      setSuggestions(response.data.suggestions);
      onValidationChange?.(response.data.valid);
    } catch (err: any) {
      // Handle network errors gracefully
      if (err.code === 'ECONNREFUSED' || err.message === 'Network Error' || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        // Backend not available - use basic client-side validation
        const basicValid = name.trim().length >= 1 && name.trim().length <= 20;
        setIsValid(basicValid);
        setSuggestions([]);
        onValidationChange?.(basicValid);
        setLoading(false);
        return;
      }
      
      setError(err.response?.data?.detail || err.message || 'Failed to validate name');
      setIsValid(null);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [onValidationChange]);

  useEffect(() => {
    // Debounce validation to avoid too many API calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      validateAndGetSuggestions(value);
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, validateAndGetSuggestions]);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    validateAndGetSuggestions(suggestion);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={20}
          className={`
            w-full px-4 py-3 rounded-lg border-2 transition-all
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${
              isValid === true
                ? 'border-green-500 focus:border-green-500'
                : isValid === false
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-300 focus:border-indigo-500'
            }
          `}
        />
        
        {/* Validation Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : isValid === true ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : isValid === false ? (
            <XCircle className="w-5 h-5 text-red-500" />
          ) : null}
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-red-600 flex items-center space-x-2"
          >
            <XCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation Feedback */}
      <AnimatePresence>
        {value && !loading && isValid !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-sm flex items-center space-x-2 ${
              isValid ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {isValid ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Great name! This name is valid.</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>This name is invalid. Please check the suggestions below.</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="font-medium">AI Suggestions:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors border border-indigo-200"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PetNameInput;
