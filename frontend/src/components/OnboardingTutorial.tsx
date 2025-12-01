/**
 * Interactive Onboarding Tutorial Component
 * Step-by-step guide using React Joyride with IndexedDB progress tracking
 */
import React, { useEffect, useState, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step, EVENTS, ACTIONS } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, RotateCcw } from 'lucide-react';
import { indexedDBStorage } from '../utils/indexedDBStorage';

const TUTORIAL_ID = 'main-onboarding-tutorial';

interface OnboardingTutorialProps {
  /** Whether the tutorial should automatically start */
  autoStart?: boolean;
  /** Callback when tutorial is completed */
  onComplete?: () => void;
  /** Callback when tutorial is skipped */
  onSkip?: () => void;
}

/**
 * Main onboarding tutorial steps
 * These guide users through the key features of the app
 */
const TUTORIAL_STEPS: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Welcome to Virtual Pet Companion! 🎉</h3>
        <p className="text-sm">
          Let's take a quick tour of the main features. This tutorial will help you get started with caring for your pet.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="pet-display"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Meet Your Pet! 🐾</h3>
        <p className="text-sm">
          This is your virtual pet companion. Your pet has 5 key stats: Health, Hunger, Happiness, Cleanliness, and Energy.
          Keep these stats high by interacting with your pet regularly!
        </p>
      </div>
    ),
    placement: 'top',
    spotlightClicks: false,
  },
  {
    target: '[data-tour="pet-stats"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Pet Stats Bar 📊</h3>
        <p className="text-sm">
          Monitor your pet's well-being here. Stats gradually decrease over time, so check in regularly.
          Green = Good, Yellow = Needs Attention, Red = Critical!
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: false,
  },
  {
    target: '[data-tour="pet-actions"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Pet Actions 🎮</h3>
        <p className="text-sm">
          Use these buttons to care for your pet:
          <ul className="list-disc list-inside mt-1 text-xs">
            <li><strong>Feed:</strong> Restores hunger (+30)</li>
            <li><strong>Play:</strong> Increases happiness (+25)</li>
            <li><strong>Bathe:</strong> Improves cleanliness (+40)</li>
            <li><strong>Rest:</strong> Restores energy (+35)</li>
          </ul>
        </p>
      </div>
    ),
    placement: 'top',
    spotlightClicks: true,
  },
  {
    target: '[data-tour="navigation"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Navigation Menu 🧭</h3>
        <p className="text-sm">
          Explore different sections of the app:
          <ul className="list-disc list-inside mt-1 text-xs">
            <li><strong>Shop:</strong> Buy items for your pet</li>
            <li><strong>Games:</strong> Play mini-games to earn coins</li>
            <li><strong>Budget:</strong> Track your spending</li>
            <li><strong>Profile:</strong> Customize your settings</li>
          </ul>
        </p>
      </div>
    ),
    placement: 'bottom',
    spotlightClicks: false,
  },
  {
    target: '[data-tour="coins"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Coins System 💰</h3>
        <p className="text-sm">
          You earn coins by completing quests, playing mini-games, and completing daily tasks.
          Use coins to buy food, toys, and accessories for your pet in the Shop!
        </p>
      </div>
    ),
    placement: 'left',
    spotlightClicks: false,
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">You're All Set! 🎊</h3>
        <p className="text-sm">
          You now know the basics! Start by feeding your pet and exploring the Shop.
          You can restart this tutorial anytime from your Profile settings.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
];

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  autoStart = false,
  onComplete,
  onSkip,
}) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Load saved progress from IndexedDB
  useEffect(() => {
    const loadProgress = async () => {
      try {
        if (!indexedDBStorage.isSupported()) {
          console.warn('IndexedDB not supported, tutorial progress will not persist');
          setIsLoading(false);
          if (autoStart) {
            setRun(true);
          }
          return;
        }

        const savedStep = await indexedDBStorage.getTutorialProgress(TUTORIAL_ID);
        const isCompleted = await indexedDBStorage.isTutorialCompleted(TUTORIAL_ID, TUTORIAL_STEPS.length);

        if (isCompleted) {
          // Tutorial already completed, don't auto-start
          setIsLoading(false);
          return;
        }

        if (savedStep !== null && savedStep >= 0) {
          // Resume from saved step
          setStepIndex(Math.min(savedStep, TUTORIAL_STEPS.length - 1));
        }

        setIsLoading(false);

        // Auto-start if requested and tutorial not completed
        if (autoStart && !isCompleted) {
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            setRun(true);
          }, 500);
        }
      } catch (error) {
        console.error('Failed to load tutorial progress:', error);
        setIsLoading(false);
        if (autoStart) {
          setRun(true);
        }
      }
    };

    loadProgress();
  }, [autoStart]);

  // Save progress to IndexedDB whenever step changes
  const saveProgress = useCallback(async (currentStep: number) => {
    try {
      if (indexedDBStorage.isSupported()) {
        await indexedDBStorage.saveTutorialProgress(TUTORIAL_ID, currentStep);
      }
    } catch (error) {
      console.error('Failed to save tutorial progress:', error);
    }
  }, []);

  // Handle tutorial callbacks
  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, index, type } = data;

      // Save progress on step changes
      if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        if (index !== undefined) {
          saveProgress(index);
          setStepIndex(index);
        }
      }

      // Handle different statuses
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        setRun(false);
        setStepIndex(0);

        if (status === STATUS.FINISHED) {
          // Mark as completed
          indexedDBStorage.saveTutorialProgress(TUTORIAL_ID, TUTORIAL_STEPS.length - 1).catch(console.error);
          onComplete?.();
        } else if (status === STATUS.SKIPPED) {
          // Save current step even if skipped
          if (index !== undefined) {
            saveProgress(index);
          }
          onSkip?.();
        }
      }

      // Handle skip action
      if (action === ACTIONS.CLOSE) {
        setRun(false);
        if (index !== undefined) {
          saveProgress(index);
        }
        onSkip?.();
      }
    },
    [saveProgress, onComplete, onSkip]
  );

  // Manual start function
  const startTutorial = useCallback(() => {
    setStepIndex(0);
    setRun(true);
  }, []);

  // Restart tutorial (reset progress)
  const restartTutorial = useCallback(async () => {
    try {
      await indexedDBStorage.clearTutorialProgress(TUTORIAL_ID);
      setStepIndex(0);
      setRun(true);
    } catch (error) {
      console.error('Failed to reset tutorial:', error);
      // Still start tutorial even if reset fails
      setStepIndex(0);
      setRun(true);
    }
  }, []);

  // Expose methods for parent components
  React.useImperativeHandle(
    React.forwardRef(() => null),
    () => ({
      start: startTutorial,
      restart: restartTutorial,
    }),
    [startTutorial, restartTutorial]
  );

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Joyride
        steps={TUTORIAL_STEPS}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        disableOverlayClose={false}
        disableScrolling={false}
        spotlightClicks={true}
        styles={{
          options: {
            primaryColor: '#3b82f6', // Blue-500
            zIndex: 10000,
            arrowColor: '#ffffff',
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
          },
          tooltip: {
            borderRadius: 8,
            padding: 20,
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          buttonNext: {
            backgroundColor: '#3b82f6',
            fontSize: '14px',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: 600,
          },
          buttonBack: {
            color: '#6b7280',
            fontSize: '14px',
            padding: '8px 16px',
            marginRight: '8px',
          },
          buttonSkip: {
            color: '#6b7280',
            fontSize: '14px',
          },
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip Tutorial',
        }}
        callback={handleJoyrideCallback}
      />
      {/* Floating restart button (shown when tutorial is not running) */}
      {!run && (
        <button
          onClick={restartTutorial}
          className="fixed bottom-4 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2 group"
          title="Restart Tutorial"
          aria-label="Restart Tutorial"
        >
          <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
          <span className="text-sm font-medium hidden sm:inline">Restart Tutorial</span>
        </button>
      )}
    </>
  );
};

// Export hook for programmatic control
export const useOnboardingTutorial = () => {
  const [tutorialRef, setTutorialRef] = useState<{
    start: () => void;
    restart: () => void;
  } | null>(null);

  const startTutorial = useCallback(() => {
    tutorialRef?.start();
  }, [tutorialRef]);

  const restartTutorial = useCallback(() => {
    tutorialRef?.restart();
  }, [tutorialRef]);

  return {
    startTutorial,
    restartTutorial,
    setTutorialRef,
  };
};

export default OnboardingTutorial;
