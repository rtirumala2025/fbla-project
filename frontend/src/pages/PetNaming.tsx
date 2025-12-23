import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, AlertCircle, HelpCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePet } from '../context/PetContext';
import { useToast } from '../contexts/ToastContext';
import { useInteractionLogger } from '../hooks/useInteractionLogger';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import { AnimatedPetSprite } from '../components/pets/AnimatedPetSprite';
import type { PetMood } from '../components/pets/AnimatedPetSprite';

const randomNames = {
  dog: ['Max', 'Buddy', 'Charlie', 'Cooper', 'Rocky', 'Duke', 'Bear', 'Zeus', 'Tucker', 'Oliver'],
  cat: ['Luna', 'Simba', 'Milo', 'Cleo', 'Whiskers', 'Shadow', 'Felix', 'Bella', 'Oliver', 'Nala'],
  bird: ['Tweety', 'Sunny', 'Sky', 'Rio', 'Echo', 'Kiwi', 'Mango', 'Blue', 'Chirpy', 'Peaches'],
  rabbit: ['Thumper', 'Clover', 'Cotton', 'Hop', 'Bunny', 'Snowball', 'Fluffy', 'Peter', 'Daisy', 'Oreo'],
};

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 20;

interface NameValidationResponse {
  status: 'success' | 'error';
  valid: boolean;
  suggestions: string[];
  errors: string[];
}

export const PetNaming = () => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiValidation, setApiValidation] = useState<NameValidationResponse | null>(null);
  const [isValidatingName, setIsValidatingName] = useState(false);
  const [touched, setTouched] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { createPet, pet: existingPet } = usePet();
  const toast = useToast();
  const { currentUser, hasPet, refreshUserState } = useAuth();
  const { logFormSubmit, logFormValidation, logFormError, logUserAction } = useInteractionLogger('PetNaming');

  const location = useLocation();

  // Calculate mood dynamically based on pet stats (if pet exists) or use default
  const petMood = useMemo<PetMood>(() => {
    // If pet exists and has stats, calculate mood from stats
    if (existingPet?.stats) {
      const stats = existingPet.stats;
      // Similar logic to Pet3DVisualization
      if (stats.happiness >= 80 && stats.health >= 80) return 'joyful';
      if (stats.energy < 30) return 'sleepy';
      if (stats.happiness >= 60) return 'playful';
      if (stats.health < 50) return 'concerned';
      return 'calm';
    }
    // Default mood for new pets during naming (they're happy to be created!)
    return 'joyful';
  }, [existingPet?.stats]);

  useEffect(() => {
    // Get species and breed from React Router state (no localStorage)
    // Can come from either /onboarding/breed or /pet-selection
    const routeSpecies = location.state?.selectedSpecies;
    const routeBreed = location.state?.selectedBreed;
    
    if (!routeSpecies) {
      // If no species, redirect to selection
      navigate('/pet-selection');
      return;
    }
    
    // Normalize species to lowercase for consistency
    const normalizedSpecies = routeSpecies.toLowerCase().trim();
    setSpecies(normalizedSpecies);
    setBreed(routeBreed || 'Mixed'); // Default to 'Mixed' if no breed provided
    
    // Debug logging to verify species is correctly passed
    console.log('PetNaming: Setting species and breed', { 
      originalSpecies: routeSpecies, 
      normalizedSpecies, 
      breed: routeBreed || 'Mixed' 
    });
  }, [navigate, location.state]);

  // Validate name with API (non-blocking, with timeout)
  const validateNameWithAPI = useCallback(async (value: string) => {
    const trimmed = value.trim();
    
    // Basic client-side validation first
    if (!trimmed || trimmed.length < MIN_NAME_LENGTH) {
      setApiValidation(null);
      return;
    }
    
    if (trimmed.length > MAX_NAME_LENGTH) {
      setApiValidation({
        status: 'error',
        valid: false,
        suggestions: [],
        errors: [`Name must be no more than ${MAX_NAME_LENGTH} characters`],
      });
      return;
    }

    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Debounce API call
    validationTimeoutRef.current = setTimeout(async () => {
      setIsValidatingName(true);
      try {
        // Add timeout wrapper to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Validation timeout')), 5000); // 5 second timeout
        });

        const apiPromise = apiClient.post<NameValidationResponse>('/api/validate-name', {
          name: trimmed,
          name_type: 'pet',
          ...(currentUser?.uid && { exclude_user_id: currentUser.uid }),
        });
        
        const response = await Promise.race([apiPromise, timeoutPromise]);
        
        setApiValidation(response.data);
        
        if (!response.data.valid && response.data.errors.length > 0) {
          setValidationError(response.data.errors[0]);
        } else if (response.data.valid) {
          setValidationError(null);
        }
      } catch (error: any) {
        console.warn('Name validation API error (non-blocking):', error);
        // Don't block user if API fails or times out - fall back to client-side validation
        // Silently continue - client-side validation will handle it
        setApiValidation(null);
      } finally {
        setIsValidatingName(false);
      }
    }, 500);
  }, [currentUser?.uid]);

  // Client-side validation (fallback)
  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Pet name is required';
    }
    if (trimmed.length < MIN_NAME_LENGTH) {
      return `Name must be at least ${MIN_NAME_LENGTH} characters`;
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      return `Name must be no more than ${MAX_NAME_LENGTH} characters`;
    }
    // Check for invalid characters (only letters, numbers, spaces, hyphens, apostrophes)
    if (!/^[a-zA-Z0-9\s'-]+$/.test(trimmed)) {
      return 'Name can only contain letters, numbers, spaces, hyphens, and apostrophes';
    }
    return null;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setTouched(true);
    
    // Clear API validation when user types
    setApiValidation(null);
    
    // Client-side validation for immediate feedback
    const clientError = validateName(value);
    setValidationError(clientError);
    
    if (touched) {
      if (clientError) {
        logFormValidation('name', false, clientError);
      } else {
        logFormValidation('name', true);
      }
    }
    
    // Trigger API validation for appropriate names
    if (!clientError && value.trim().length >= MIN_NAME_LENGTH) {
      validateNameWithAPI(value);
    }
    
    logUserAction('name_input', { length: value.length });
  };

  const generateRandomName = () => {
    const names = randomNames[species as keyof typeof randomNames] || randomNames.dog;
    const randomName = names[Math.floor(Math.random() * names.length)];
    setName(randomName);
    setTouched(true);
    setValidationError(null);
    logUserAction('generate_random_name', { species, generatedName: randomName });
  };

  const handleContinue = async () => {
    setTouched(true);
    
    // Final validation check
    const clientError = validateName(name);
    
    if (clientError) {
      setValidationError(clientError);
      logFormError('name', clientError);
      toast.error(clientError);
      inputRef.current?.focus();
      return;
    }

    if (!name.trim()) {
      const emptyError = 'Pet name is required';
      setValidationError(emptyError);
      logFormError('name', emptyError);
      toast.error(emptyError);
      inputRef.current?.focus();
      return;
    }

    // Check API validation if available
    if (apiValidation && !apiValidation.valid) {
      const apiError = apiValidation.errors[0] || 'Name validation failed';
      setValidationError(apiError);
      logFormError('name', apiError);
      toast.error(apiError);
      inputRef.current?.focus();
      return;
    }

    // Don't wait for API validation - it's non-blocking
    // If API validation failed or is pending, proceed with client-side validation only
    // API validation is nice-to-have but not required
    
    setIsCreating(true);
    logFormSubmit({ name: name.trim(), species, breed }, false);
    
    try {
      // Create pet in database via PetContext (with breed from selection)
      // Note: We proceed even if API validation is pending or failed
      // Client-side validation already passed, which is sufficient
      await createPet(name.trim(), species, breed || 'Mixed');
      
      // Note: No localStorage cleanup needed - using React Router state instead
      
      logFormSubmit({ name: name.trim(), species, breed }, true);
      toast.success(`Welcome, ${name}! 🎉`);
      
      // CRITICAL: Wait for state to propagate before navigating
      // PetContext.createPet() already calls refreshUserState() which updates hasPet
      // Ensure the state update has time to propagate through React's state system
      // Use a small delay to allow React to process the state update
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Double-check by refreshing state one more time to ensure it's up to date
      try {
        await refreshUserState();
      } catch (refreshError) {
        console.warn('State refresh warning (non-critical):', refreshError);
        // Continue anyway - the route guard will handle it
      }
      
      // Redirect to game UI with smooth transition
      // The ProtectedRoute will verify hasPet, and if not true yet, will redirect appropriately
      navigate('/game', { replace: true });
    } catch (error: any) {
      console.error('Failed to create pet:', error);
      
      // Extract error message properly
      let errorMessage = 'Failed to create pet';
      
      // Check for timeout errors specifically
      const errorString = error instanceof Error ? error.message : String(error?.message || error || '');
      if (errorString.includes('timed out') || errorString.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract meaningful information from error object
        try {
          const errorStr = JSON.stringify(error);
          if (errorStr !== '{}') {
            errorMessage = `Error: ${errorStr}`;
          }
        } catch (e) {
          errorMessage = 'An unexpected error occurred. Please try again.';
        }
      }
      
      logFormError('pet_creation', errorMessage, { name: name.trim(), species, breed, error });
      toast.error(errorMessage);
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    logUserAction('navigate_back');
    navigate('/onboarding/breed');
  };

  const handleBlur = () => {
    setTouched(true);
    const error = validateName(name);
    setValidationError(error);
    if (error) {
      logFormValidation('name', false, error);
    }
  };

  const isValid = !validationError && name.trim().length >= MIN_NAME_LENGTH && (apiValidation?.valid ?? true);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 px-4 sm:px-6 py-8 sm:py-12 flex items-center">
      <div className="max-w-2xl mx-auto w-full">
        {/* Pet Image Preview */}
        <div className="flex items-center justify-center mb-12">
          {species && (
            <AnimatedPetSprite 
              species={species} 
              mood={petMood} 
              size="lg" 
            />
          )}
        </div>

        {/* Main card */}
        <motion.div
          className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl sm:rounded-3xl p-6 sm:p-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Breed badge */}
          <div className="text-center mb-8">
            <div className="inline-block bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2">
              <span className="text-sm font-bold text-indigo-400 uppercase tracking-wider capitalize">
                {breed?.replace('-', ' ') || species || 'Pet'}
              </span>
            </div>
          </div>

          {/* Naming section */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-50 mb-4">
              Name your companion
            </h1>
            <p className="text-lg sm:text-xl text-slate-400">
              This is the start of something special
            </p>
          </motion.div>

          {/* Name input */}
          <div className="mb-6">
            <div className="relative">
              <label 
                htmlFor="pet-name-input" 
                className="block text-sm font-medium text-slate-300 mb-2 text-center"
              >
                Pet Name
                <button
                  type="button"
                  className="ml-2 inline-flex items-center"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onFocus={() => setShowTooltip(true)}
                  onBlur={() => setShowTooltip(false)}
                  aria-label="Name requirements"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400 hover:text-indigo-400 transition-colors" />
                </button>
              </label>
              
              {/* Tooltip */}
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    ref={tooltipRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-slate-800 border border-slate-600 rounded-lg shadow-xl text-sm text-slate-200"
                  >
                    <p className="font-semibold mb-1">Name Requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>2-20 characters</li>
                      <li>Letters, numbers, spaces only</li>
                      <li>Hyphens and apostrophes allowed</li>
                      <li>No special symbols</li>
                    </ul>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <input
                  ref={inputRef}
                  id="pet-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Enter a name..."
                  className={`w-full bg-slate-900/50 border rounded-xl px-6 py-4 text-slate-50 text-center text-xl md:text-2xl font-bold placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    touched && validationError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : touched && isValid
                      ? 'border-green-500 focus:border-indigo-500 focus:ring-indigo-500/20'
                      : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                  maxLength={MAX_NAME_LENGTH}
                  aria-invalid={touched && !!validationError}
                  aria-describedby={touched && validationError ? 'name-error' : touched && isValid ? 'name-success' : undefined}
                  disabled={isCreating}
                />
                
                {/* Validation icon */}
                {touched && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <AnimatePresence mode="wait">
                      {isValidatingName ? (
                        <motion.div
                          key="validating"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" aria-hidden="true" />
                        </motion.div>
                      ) : validationError ? (
                        <motion.div
                          key="error"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                        </motion.div>
                      ) : isValid && apiValidation?.valid ? (
                        <motion.div
                          key="success"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-500" aria-hidden="true" />
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Character count and error message */}
              <div className="mt-2 text-center">
                <AnimatePresence mode="wait">
                  {touched && validationError ? (
                    <motion.div
                      key="error"
                      id="name-error"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm text-red-400 font-medium"
                      role="alert"
                    >
                      <p>{validationError}</p>
                      {apiValidation && apiValidation.suggestions.length > 0 && (
                        <p className="mt-1 text-xs text-red-300">
                          Suggestions: {apiValidation.suggestions.slice(0, 3).join(', ')}
                        </p>
                      )}
                    </motion.div>
                  ) : touched && isValid && apiValidation?.valid ? (
                    <motion.p
                      key="success"
                      id="name-success"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm text-green-400 font-medium"
                    >
                      Great name!
                    </motion.p>
                  ) : (
                    <motion.p
                      key="count"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`text-sm transition-colors ${
                        name.length > MAX_NAME_LENGTH * 0.9
                          ? 'text-amber-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {name.length}/{MAX_NAME_LENGTH} characters
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Random name button */}
          <motion.button
            type="button"
            onClick={generateRandomName}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mb-8 px-6 py-3 bg-slate-900/50 border border-slate-700 text-slate-300 font-semibold rounded-xl hover:border-indigo-500/50 hover:text-indigo-400 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isCreating}
            aria-label="Generate a random pet name"
          >
            <Sparkles className="w-5 h-5" />
            Generate Random Name
          </motion.button>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              type="button"
              onClick={handleBack}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-4 bg-slate-900/50 border border-slate-700 text-slate-300 font-bold rounded-xl hover:border-slate-600 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCreating}
              aria-label="Go back to previous step"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </motion.button>
            
            <motion.button
              type="button"
              onClick={handleContinue}
              disabled={!isValid || isCreating}
              whileHover={!isCreating && isValid ? { scale: 1.02 } : {}}
              whileTap={!isCreating && isValid ? { scale: 0.98 } : {}}
              className={`flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                isValid && !isCreating
                  ? 'hover:shadow-lg hover:shadow-indigo-500/50 hover:-translate-y-0.5'
                  : ''
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isValid ? "Continue to create your pet" : "Please enter a valid pet name"}
            >
              {isCreating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="rounded-full h-5 w-5 border-2 border-white border-t-transparent"
                  />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Start Journey</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
