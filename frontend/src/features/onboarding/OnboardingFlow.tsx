/**
 * Interactive Onboarding Flow
 * Multi-step tutorial that guides users through the app
 */
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePet } from '../../context/PetContext';
import { indexedDBStorage } from '../../utils/indexedDBStorage';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  action?: {
    label: string;
    route?: string;
    onClick?: () => void;
  };
  target?: string; // CSS selector for highlighting
  placement?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Virtual Pet Companion! 🎉',
    description: 'Let\'s get you started with your new pet',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700">
          This interactive tutorial will guide you through the key features. You can skip at any time.
        </p>
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
          <p className="text-sm text-indigo-800">
            <strong>Tip:</strong> Complete the tutorial to unlock a special welcome bonus!
          </p>
        </div>
      </div>
    ),
    placement: 'center',
  },
  {
    id: 'pet-overview',
    title: 'Meet Your Pet 🐾',
    description: 'Your pet has 5 key stats to manage',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { stat: 'Health', emoji: '❤️', color: 'red' },
            { stat: 'Hunger', emoji: '🍽️', color: 'orange' },
            { stat: 'Happiness', emoji: '😊', color: 'yellow' },
            { stat: 'Cleanliness', emoji: '🧼', color: 'blue' },
            { stat: 'Energy', emoji: '⚡', color: 'green' },
          ].map(({ stat, emoji, color }) => (
            <div key={stat} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{emoji}</span>
                <span className="font-medium text-gray-800">{stat}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600">
          Keep these stats high by regularly caring for your pet!
        </p>
      </div>
    ),
    target: '[data-onboarding="pet-display"]',
    placement: 'bottom',
  },
  {
    id: 'actions',
    title: 'Pet Actions 🎮',
    description: 'Interact with your pet using these actions',
    content: (
      <div className="space-y-3">
        <div className="space-y-2">
          {[
            { action: 'Feed', emoji: '🍖', effect: 'Restores hunger', cost: '5-25 coins' },
            { action: 'Play', emoji: '🎾', effect: 'Increases happiness', cost: '0-15 coins' },
            { action: 'Bathe', emoji: '🛁', effect: 'Improves cleanliness', cost: '10 coins' },
            { action: 'Rest', emoji: '😴', effect: 'Restores energy', cost: 'Free' },
          ].map(({ action, emoji, effect, cost }) => (
            <div key={action} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
              <span className="text-2xl">{emoji}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-800">{action}</div>
                <div className="text-xs text-gray-600">{effect} • {cost}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    target: '[data-onboarding="pet-actions"]',
    placement: 'top',
  },
  {
    id: 'coins',
    title: 'Coins & Economy 💰',
    description: 'Earn and spend coins wisely',
    content: (
      <div className="space-y-4">
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-900 mb-2">Ways to Earn:</h4>
          <ul className="space-y-1 text-sm text-amber-800">
            <li>✅ Complete daily quests</li>
            <li>✅ Play mini-games</li>
            <li>✅ Complete chores</li>
            <li>✅ Daily login bonus</li>
          </ul>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Ways to Spend:</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>🛒 Buy food and items in Shop</li>
            <li>🎮 Unlock premium activities</li>
            <li>🎨 Customize your pet</li>
          </ul>
        </div>
      </div>
    ),
    target: '[data-onboarding="coins-display"]',
    placement: 'left',
  },
  {
    id: 'navigation',
    title: 'Explore the App 🧭',
    description: 'Navigate between different sections',
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Shop', emoji: '🛒', desc: 'Buy items' },
            { name: 'Games', emoji: '🎮', desc: 'Play & earn' },
            { name: 'Budget', emoji: '📊', desc: 'Track spending' },
            { name: 'Profile', emoji: '👤', desc: 'Settings' },
          ].map(({ name, emoji, desc }) => (
            <div key={name} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <div className="text-2xl mb-1">{emoji}</div>
              <div className="font-medium text-sm text-gray-800">{name}</div>
              <div className="text-xs text-gray-600">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    target: '[data-onboarding="navigation"]',
    placement: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎊',
    description: 'Start caring for your pet',
    content: (
      <div className="space-y-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="inline-block"
        >
          <Sparkles className="w-16 h-16 text-indigo-500 mx-auto" />
        </motion.div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-800 font-medium">
            🎁 Welcome Bonus: 50 coins added to your account!
          </p>
        </div>
        <p className="text-gray-700">
          You now know the basics. Start by feeding your pet and exploring the Shop!
        </p>
      </div>
    ),
    placement: 'center',
    action: {
      label: 'Go to Dashboard',
      route: '/dashboard',
    },
  },
];

interface OnboardingFlowProps {
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onComplete,
  onSkip,
  autoStart = false,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(autoStart);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { pet } = usePet();

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const saved = await indexedDBStorage.getTutorialProgress('onboarding-flow');
        if (saved !== null && saved < ONBOARDING_STEPS.length) {
          setCurrentStep(saved);
          // Mark previous steps as completed
          const completed = new Set<string>();
          for (let i = 0; i < saved; i++) {
            completed.add(ONBOARDING_STEPS[i].id);
          }
          setCompletedSteps(completed);
        }
      } catch (error) {
        console.error('Failed to load onboarding progress:', error);
      }
    };
    loadProgress();
  }, []);

  // Save progress
  const saveProgress = useCallback(async (step: number) => {
    try {
      await indexedDBStorage.saveTutorialProgress('onboarding-flow', step);
    } catch (error) {
      console.error('Failed to save onboarding progress:', error);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setCompletedSteps((prev) => new Set([...prev, ONBOARDING_STEPS[currentStep].id]));
      saveProgress(nextStep);
    } else {
      handleComplete();
    }
  }, [currentStep, saveProgress]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      saveProgress(prevStep);
    }
  }, [currentStep, saveProgress]);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    onSkip?.();
  }, [onSkip]);

  const handleComplete = useCallback(async () => {
    try {
      // Mark all steps as completed
      await indexedDBStorage.saveTutorialProgress('onboarding-flow', ONBOARDING_STEPS.length - 1);
      
      // Award welcome bonus (if not already awarded)
      // This would typically be handled by the backend
      
      setIsVisible(false);
      onComplete?.();
      
      // Navigate to dashboard if action specified
      const lastStep = ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1];
      if (lastStep.action?.route) {
        navigate(lastStep.action.route);
      }
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  }, [navigate, onComplete]);

  const handleAction = useCallback(() => {
    const step = ONBOARDING_STEPS[currentStep];
    if (step.action?.onClick) {
      step.action.onClick();
    } else if (step.action?.route) {
      navigate(step.action.route);
      handleComplete();
    }
  }, [currentStep, navigate, handleComplete]);

  // Calculate position for tooltip
  const getTooltipPosition = useCallback((): React.CSSProperties => {
    const step = ONBOARDING_STEPS[currentStep];
    if (step.placement === 'center') {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        const spacing = 20;
        
        switch (step.placement) {
          case 'top':
            return {
              position: 'fixed',
              bottom: `${window.innerHeight - rect.top + spacing}px`,
              left: `${rect.left + rect.width / 2}px`,
              transform: 'translateX(-50%)',
            };
          case 'bottom':
            return {
              position: 'fixed',
              top: `${rect.bottom + spacing}px`,
              left: `${rect.left + rect.width / 2}px`,
              transform: 'translateX(-50%)',
            };
          case 'left':
            return {
              position: 'fixed',
              top: `${rect.top + rect.height / 2}px`,
              right: `${window.innerWidth - rect.left + spacing}px`,
              transform: 'translateY(-50%)',
            };
          case 'right':
            return {
              position: 'fixed',
              top: `${rect.top + rect.height / 2}px`,
              left: `${rect.right + spacing}px`,
              transform: 'translateY(-50%)',
            };
        }
      }
    }

    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }, [currentStep]);

  if (!isVisible) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={step.placement === 'center' ? undefined : handleNext}
          />
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed z-[9999] max-w-md w-full mx-4"
            style={getTooltipPosition()}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-gray-100">
                <motion.div
                  className="h-full bg-indigo-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  <button
                    onClick={handleSkip}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label="Skip tutorial"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">{step.content}</div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {ONBOARDING_STEPS.map((s, idx) => (
                    <div
                      key={s.id}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentStep
                          ? 'w-8 bg-indigo-600'
                          : idx < currentStep
                          ? 'w-2 bg-indigo-300'
                          : 'w-2 bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={isFirstStep ? handleSkip : handlePrevious}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {isFirstStep ? (
                      <>
                        <X className="w-4 h-4" />
                        <span>Skip</span>
                      </>
                    ) : (
                      <>
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back</span>
                      </>
                    )}
                  </button>

                  {step.action ? (
                    <button
                      onClick={handleAction}
                      className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      <span>{step.action.label}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      <span>{isLastStep ? 'Complete' : 'Next'}</span>
                      {!isLastStep && <ChevronRight className="w-4 h-4" />}
                      {isLastStep && <CheckCircle className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Highlight target element */}
      {step.target && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed z-[9997] pointer-events-none"
          style={{
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
          }}
        >
          {(() => {
            const element = document.querySelector(step.target!);
            if (element) {
              const rect = element.getBoundingClientRect();
              return (
                <motion.div
                  className="absolute border-4 border-indigo-500 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                  style={{
                    top: `${rect.top - 4}px`,
                    left: `${rect.left - 4}px`,
                    width: `${rect.width + 8}px`,
                    height: `${rect.height + 8}px`,
                  }}
                  animate={{
                    boxShadow: [
                      '0 0 0 9999px rgba(0,0,0,0.5), 0 0 0 0 rgba(99,102,241,0.7)',
                      '0 0 0 9999px rgba(0,0,0,0.5), 0 0 0 8px rgba(99,102,241,0)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              );
            }
            return null;
          })()}
        </motion.div>
      )}
    </>
  );
};

export default OnboardingFlow;
