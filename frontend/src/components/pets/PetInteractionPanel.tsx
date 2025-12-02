/**
 * PetInteractionPanel Component
 * 
 * A comprehensive React component that combines pet naming validation and pet command
 * interfaces into a single, accessible, and animated panel.
 * 
 * Features:
 * - Real-time pet name validation against Name Validator API
 * - Display validation suggestions when name is invalid
 * - Chat-style interface for pet commands
 * - Display AI responses with error/fallback messages
 * - Fully responsive design with smooth animations
 * - Comprehensive accessibility support (ARIA labels, keyboard navigation)
 * - TypeScript-ready with full type definitions
 * 
 * @module PetInteractionPanel
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Heart,
  Zap,
  Coffee,
  Droplet,
  Info,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Name validation request payload
 */
interface NameValidationRequest {
  name: string;
  name_type: 'pet' | 'account';
  exclude_user_id?: string;
}

/**
 * Name validation response from API
 */
interface NameValidationResponse {
  status: 'success' | 'error';
  valid: boolean;
  suggestions: string[];
  errors: string[];
}

/**
 * Pet command step result
 */
interface PetCommandStepResult {
  action: string;
  success: boolean;
  message: string;
  stat_changes?: Record<string, number>;
  pet_state?: {
    hunger?: number;
    happiness?: number;
    health?: number;
    energy?: number;
    cleanliness?: number;
    mood?: string;
  };
}

/**
 * Pet command AI response
 */
interface PetCommandAIResponse {
  success: boolean;
  message: string;
  suggestions: string[];
  results: PetCommandStepResult[];
  confidence: number;
  original_command: string;
  steps_executed: number;
}

/**
 * Chat message in the command interface
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  petState?: PetCommandStepResult['pet_state'];
}

// ============================================================================
// Component Props
// ============================================================================

export interface PetInteractionPanelProps {
  /**
   * Optional initial pet name value
   */
  initialPetName?: string;
  
  /**
   * Callback fired when a valid pet name is submitted
   */
  onPetNameSubmit?: (name: string) => void;
  
  /**
   * Optional custom API base URL (defaults to env variable or localhost:8000)
   */
  apiBaseUrl?: string;
  
  /**
   * Whether to show the pet naming section (default: true)
   */
  showNaming?: boolean;
  
  /**
   * Whether to show the pet commands section (default: true)
   */
  showCommands?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Debounce function to limit API calls
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get pet mood emoji based on mood string
 */
const getMoodEmoji = (mood?: string): string => {
  const emojis: Record<string, string> = {
    happy: '😊',
    excited: '🎉',
    neutral: '😐',
    tired: '😴',
    hungry: '🍽️',
    playful: '🎾',
    sad: '😢',
    sick: '🤒',
    content: '😌',
  };
  return mood ? emojis[mood.toLowerCase()] || '🐾' : '🐾';
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * PetInteractionPanel - Main component for pet naming and commands
 */
export const PetInteractionPanel: React.FC<PetInteractionPanelProps> = ({
  initialPetName = '',
  onPetNameSubmit,
  apiBaseUrl,
  showNaming = true,
  showCommands = true,
}) => {
  // ========================================================================
  // State Management
  // ========================================================================
  
  // Pet Naming State
  const [petName, setPetName] = useState<string>(initialPetName);
  const [isValidatingName, setIsValidatingName] = useState<boolean>(false);
  const [nameValidation, setNameValidation] = useState<NameValidationResponse | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSubmittingName, setIsSubmittingName] = useState<boolean>(false);

  // Pet Commands State
  const [commandInput, setCommandInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingCommand, setIsLoadingCommand] = useState<boolean>(false);
  const [commandError, setCommandError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

  // UI State
  const [activeTab, setActiveTab] = useState<'naming' | 'commands'>(
    showNaming ? 'naming' : 'commands'
  );

  // Refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auth Context
  const { currentUser } = useAuth();

  // ========================================================================
  // API Configuration
  // ========================================================================
  
  const API_BASE_URL = apiBaseUrl || process.env.REACT_APP_API_URL || 'http://localhost:8000';

  // ========================================================================
  // Effects
  // ========================================================================
  
  /**
   * Initialize session ID on mount
   * Removed localStorage - session ID generated in component state
   * Backend manages session history via session_id
   */
  useEffect(() => {
    // Generate session ID in component state (no localStorage)
    const newSessionId = `pet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
  }, []);

  /**
   * Auto-scroll to bottom of chat messages
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  /**
   * Focus input on tab change
   */
  useEffect(() => {
    if (activeTab === 'naming' && nameInputRef.current) {
      nameInputRef.current.focus();
    } else if (activeTab === 'commands' && commandInputRef.current) {
      commandInputRef.current.focus();
    }
  }, [activeTab]);

  // ========================================================================
  // Name Validation Functions
  // ========================================================================
  
  /**
   * Validate pet name against API
   */
  const validatePetName = useCallback(async (name: string) => {
    if (!name.trim() || name.trim().length < 2) {
      setNameValidation(null);
      return;
    }

    setIsValidatingName(true);
    setNameError(null);

    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_BASE_URL}/api/validate-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          name: name.trim(),
          name_type: 'pet',
          ...(currentUser?.uid && { exclude_user_id: currentUser.uid }),
        } as NameValidationRequest),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      const data: NameValidationResponse = await response.json();
      setNameValidation(data);
    } catch (error) {
      console.error('Name validation error:', error);
      setNameError('Failed to validate name. Please try again.');
      setNameValidation(null);
    } finally {
      setIsValidatingName(false);
    }
  }, [API_BASE_URL, currentUser?.uid]);

  /**
   * Debounced name validation
   */
  const debouncedValidateName = useCallback(
    debounce((name: string) => {
      validatePetName(name);
    }, 500),
    [validatePetName]
  );

  /**
   * Handle pet name input change
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setPetName(newName);
    setNameError(null);

    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    // Debounce validation
    if (newName.trim().length >= 2) {
      validationTimeoutRef.current = setTimeout(() => {
        debouncedValidateName(newName);
      }, 500);
    } else {
      setNameValidation(null);
    }
  };

  /**
   * Handle pet name submission
   */
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!petName.trim()) return;
    
    // If name is invalid, don't submit
    if (nameValidation && !nameValidation.valid) {
      return;
    }

    setIsSubmittingName(true);
    setNameError(null);

    try {
      // Final validation check
      if (!nameValidation) {
        await validatePetName(petName);
        // Wait a moment for validation to complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (nameValidation && !nameValidation.valid) {
        setIsSubmittingName(false);
        return;
      }

      // Call the callback if provided
      if (onPetNameSubmit) {
        onPetNameSubmit(petName.trim());
      }
    } catch (error) {
      console.error('Name submission error:', error);
      setNameError('Failed to submit name. Please try again.');
    } finally {
      setIsSubmittingName(false);
    }
  };

  // ========================================================================
  // Pet Command Functions
  // ========================================================================
  
  /**
   * Execute pet command via API
   */
  const executePetCommand = async (command: string) => {
    if (!command.trim() || isLoadingCommand) return;

    setIsLoadingCommand(true);
    setCommandError(null);

    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: command.trim(),
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, userMessage]);

    // Clear input
    setCommandInput('');

    // Create placeholder for assistant response
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    setChatMessages(prev => [...prev, assistantMessage]);

    try {
      // Get authentication token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${API_BASE_URL}/api/pets/commands/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          command: command.trim(),
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `Request failed: ${response.status}`);
      }

      const data: PetCommandAIResponse = await response.json();

      // Update assistant message with response
      setChatMessages(prev => {
        const newMessages = [...prev];
        const messageIndex = newMessages.findIndex(m => m.id === assistantMessageId);
        
        if (messageIndex !== -1) {
          const latestPetState = data.results[data.results.length - 1]?.pet_state;
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            content: data.message || "I'm not sure how to respond to that.",
            suggestions: data.suggestions.length > 0 ? data.suggestions : undefined,
            petState: latestPetState,
          };
        }
        
        return newMessages;
      });
      
      // Sync pet state with global store if updated
      if (data.results && data.results.length > 0) {
        const latestResult = data.results[data.results.length - 1];
        if (latestResult?.pet_state) {
          const { useAppStore } = await import('../../store/useAppStore');
          const petState = latestResult.pet_state;
          if (petState.stats) {
            useAppStore.getState().updatePetStats({
              health: petState.stats.health,
              hunger: petState.stats.hunger,
              happiness: petState.stats.happiness || petState.stats.mood,
              cleanliness: petState.stats.cleanliness || petState.stats.hygiene,
              energy: petState.stats.energy,
            });
          }
        }
      }
    } catch (error) {
      console.error('Command execution error:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to execute command. Please try again.';
      
      setCommandError(errorMessage);

      // Update assistant message with error
      setChatMessages(prev => {
        const newMessages = [...prev];
        const messageIndex = newMessages.findIndex(m => m.id === assistantMessageId);
        
        if (messageIndex !== -1) {
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            content: "I'm having trouble connecting right now. Please try again later.",
            suggestions: [
              'Check your internet connection',
              'Try simpler commands like "feed my pet"',
              'If the problem persists, refresh the page',
            ],
          };
        }
        
        return newMessages;
      });
    } finally {
      setIsLoadingCommand(false);
    }
  };

  /**
   * Handle command form submission
   */
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commandInput.trim()) {
      executePetCommand(commandInput);
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ========================================================================
  // Render
  // ========================================================================
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tab Navigation */}
      {(showNaming && showCommands) && (
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('naming')}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'naming'
                ? 'text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-selected={activeTab === 'naming'}
            aria-controls="naming-panel"
            id="naming-tab"
            role="tab"
          >
            Pet Naming
            {activeTab === 'naming' && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('commands')}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'commands'
                ? 'text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            aria-selected={activeTab === 'commands'}
            aria-controls="commands-panel"
            id="commands-tab"
            role="tab"
          >
            Pet Commands
            {activeTab === 'commands' && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        </div>
      )}

      {/* Pet Naming Panel */}
      <AnimatePresence mode="wait">
        {activeTab === 'naming' && showNaming && (
          <motion.div
            key="naming-panel"
            id="naming-panel"
            role="tabpanel"
            aria-labelledby="naming-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Name Your Pet
              </h2>
              <p className="text-gray-600">
                Enter a name for your pet. We'll validate it in real-time and provide suggestions if needed.
              </p>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-4">
              {/* Name Input */}
              <div>
                <label
                  htmlFor="pet-name-input"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Pet Name
                </label>
                <div className="relative">
                  <input
                    ref={nameInputRef}
                    id="pet-name-input"
                    type="text"
                    value={petName}
                    onChange={handleNameChange}
                    placeholder="Enter your pet's name..."
                    maxLength={50}
                    className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${
                      nameValidation?.valid === true
                        ? 'border-green-300 bg-green-50'
                        : nameValidation?.valid === false
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300 bg-white'
                    }`}
                    aria-describedby={
                      nameValidation
                        ? nameValidation.valid
                          ? 'name-success'
                          : 'name-error'
                        : undefined
                    }
                    aria-invalid={nameValidation?.valid === false}
                    aria-required="true"
                  />
                  
                  {/* Validation Icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isValidatingName && (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    )}
                    {!isValidatingName && nameValidation?.valid === true && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" aria-hidden="true" />
                    )}
                    {!isValidatingName && nameValidation?.valid === false && (
                      <XCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                    )}
                  </div>
                </div>

                {/* Character Count */}
                <p className="mt-1 text-xs text-gray-500">
                  {petName.length}/50 characters
                </p>

                {/* Validation Status */}
                <AnimatePresence>
                  {nameValidation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      {nameValidation.valid ? (
                        <div
                          id="name-success"
                          className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                          role="status"
                          aria-live="polite"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-green-800">
                            Great! This name is available.
                          </p>
                        </div>
                      ) : (
                        <div
                          id="name-error"
                          className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                          role="alert"
                          aria-live="assertive"
                        >
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-red-800 mb-2">
                              This name is not valid:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                              {nameValidation.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Suggestions */}
                <AnimatePresence>
                  {nameValidation && !nameValidation.valid && nameValidation.suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Suggestions:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {nameValidation.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setPetName(suggestion);
                                validatePetName(suggestion);
                              }}
                              className="px-3 py-1.5 text-sm bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Message */}
                <AnimatePresence>
                  {nameError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                      role="alert"
                      aria-live="assertive"
                    >
                      <p className="text-sm text-red-700">{nameError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!petName.trim() || isValidatingName || isSubmittingName || (nameValidation ? !nameValidation.valid : false)}
                className="w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmittingName ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Submit Name
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pet Commands Panel */}
      <AnimatePresence mode="wait">
        {activeTab === 'commands' && showCommands && (
          <motion.div
            key="commands-panel"
            id="commands-panel"
            role="tabpanel"
            aria-labelledby="commands-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col"
            style={{ height: '600px' }}
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-indigo-600 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6" />
                  <h2 className="text-xl font-semibold">Pet Commands</h2>
                </div>
                {chatMessages.some(m => m.petState?.mood) && (
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                    <span>{getMoodEmoji(chatMessages[chatMessages.length - 1]?.petState?.mood)}</span>
                    <span className="text-sm capitalize">
                      {chatMessages[chatMessages.length - 1]?.petState?.mood || 'neutral'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="bg-indigo-100 p-4 rounded-full mb-4">
                    <Bot className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Ready to Interact!
                  </h3>
                  <p className="text-gray-600 max-w-md mb-6">
                    Type a command to interact with your pet. Try commands like "feed my pet" or "play fetch".
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                    <button
                      type="button"
                      onClick={() => setCommandInput('feed my pet')}
                      className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <div className="flex items-center">
                        <span className="text-orange-500 mr-2">🍖</span>
                        <span>Feed pet</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommandInput('play fetch')}
                      className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-2">🎾</span>
                        <span>Play fetch</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommandInput('let my pet rest')}
                      className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <div className="flex items-center">
                        <span className="text-blue-500 mr-2">😴</span>
                        <span>Rest pet</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommandInput('check pet status')}
                      className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <div className="flex items-center">
                        <span className="text-green-500 mr-2">📊</span>
                        <span>Check status</span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 ${
                          message.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && (
                            <Bot className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            
                            {/* Pet State Stats */}
                            {message.petState && (
                              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  {message.petState.happiness !== undefined && (
                                    <div className="flex items-center gap-1 text-pink-600">
                                      <Heart className="w-3 h-3" />
                                      <span>Happiness: {Math.round(message.petState.happiness)}%</span>
                                    </div>
                                  )}
                                  {message.petState.energy !== undefined && (
                                    <div className="flex items-center gap-1 text-yellow-600">
                                      <Zap className="w-3 h-3" />
                                      <span>Energy: {Math.round(message.petState.energy)}%</span>
                                    </div>
                                  )}
                                  {message.petState.hunger !== undefined && (
                                    <div className="flex items-center gap-1 text-orange-600">
                                      <Coffee className="w-3 h-3" />
                                      <span>Hunger: {Math.round(message.petState.hunger)}%</span>
                                    </div>
                                  )}
                                  {message.petState.cleanliness !== undefined && (
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <Droplet className="w-3 h-3" />
                                      <span>Cleanliness: {Math.round(message.petState.cleanliness)}%</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Suggestions */}
                            {message.suggestions && message.suggestions.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs font-medium text-gray-700 mb-2">Suggestions:</p>
                                <ul className="space-y-1">
                                  {message.suggestions.map((suggestion, index) => (
                                    <li key={index} className="text-xs text-gray-600">
                                      • {suggestion}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Timestamp */}
                            <p className={`text-xs mt-2 ${
                              message.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
                            }`}>
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                          {message.role === 'user' && (
                            <User className="w-5 h-5 text-indigo-200 flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Loading Indicator */}
                  {isLoadingCommand && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-4">
                        <div className="flex items-center gap-2">
                          <Bot className="w-5 h-5 text-indigo-500" />
                          <div className="flex space-x-1.5">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Command Input Form */}
            <form onSubmit={handleCommandSubmit} className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
              <AnimatePresence>
                {commandError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2"
                    role="alert"
                    aria-live="assertive"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">Error</p>
                      <p className="text-red-600">{commandError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCommandError(null)}
                      className="text-red-400 hover:text-red-600 focus:outline-none"
                      aria-label="Dismiss error"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="relative">
                <input
                  ref={commandInputRef}
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="Type a command (e.g., 'feed my pet', 'play fetch')..."
                  className="w-full px-4 py-3 pr-14 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-70 transition-all"
                  disabled={isLoadingCommand}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCommandSubmit(e);
                    }
                  }}
                  aria-label="Pet command input"
                  aria-describedby={commandError ? 'command-error' : undefined}
                />
                <button
                  type="submit"
                  disabled={!commandInput.trim() || isLoadingCommand}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    !commandInput.trim() || isLoadingCommand
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-white bg-indigo-600 hover:bg-indigo-700'
                  }`}
                  aria-label="Send command"
                >
                  {isLoadingCommand ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              <p className="mt-2 text-xs text-gray-500">
                Press Enter to send. Try commands like "feed my pet", "play fetch", or "check pet status".
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PetInteractionPanel;

