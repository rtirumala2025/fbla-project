/**
 * Tests for OnboardingTutorial component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import OnboardingTutorial from '../components/OnboardingTutorial';
import { indexedDBStorage } from '../utils/indexedDBStorage';

// Mock react-joyride
jest.mock('react-joyride', () => {
  const actual = jest.requireActual('react-joyride');
  return {
    ...actual,
    default: ({ steps, run, stepIndex, callback }: any) => {
      if (!run) return null;
      const currentStep = steps[stepIndex];
      return (
        <div data-testid="joyride-overlay" data-step-index={stepIndex}>
          <div data-testid="joyride-content">{currentStep?.content}</div>
          <button
            data-testid="joyride-next"
            onClick={() => {
              callback({
                status: stepIndex === steps.length - 1 ? 'finished' : 'running',
                action: 'next',
                index: stepIndex + 1,
                type: 'step:after',
              });
            }}
          >
            Next
          </button>
          <button
            data-testid="joyride-back"
            onClick={() => {
              callback({
                status: 'running',
                action: 'prev',
                index: stepIndex - 1,
                type: 'step:after',
              });
            }}
          >
            Back
          </button>
          <button
            data-testid="joyride-skip"
            onClick={() => {
              callback({
                status: 'skipped',
                action: 'close',
                index: stepIndex,
                type: 'tooltip:before',
              });
            }}
          >
            Skip
          </button>
        </div>
      );
    },
  };
});

// Mock IndexedDB
jest.mock('../utils/indexedDBStorage', () => {
  const mockStorage: any = {
    getTutorialProgress: jest.fn().mockResolvedValue(null),
    saveTutorialProgress: jest.fn().mockResolvedValue(undefined),
    clearTutorialProgress: jest.fn().mockResolvedValue(undefined),
    isTutorialCompleted: jest.fn().mockResolvedValue(false),
    isSupported: jest.fn().mockReturnValue(true),
  };
  return {
    indexedDBStorage: mockStorage,
  };
});

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <div>
        <div data-tour="pet-display">Pet Display</div>
        <div data-tour="pet-stats">Pet Stats</div>
        <div data-tour="pet-actions">Pet Actions</div>
        <div data-tour="navigation">Navigation</div>
        <div data-tour="coins">Coins</div>
        <OnboardingTutorial {...props} />
      </div>
    </BrowserRouter>
  );
};

describe('OnboardingTutorial', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.queryByTestId('joyride-overlay')).not.toBeInTheDocument();
  });

  it('loads saved progress from IndexedDB', async () => {
    (indexedDBStorage.getTutorialProgress as jest.Mock).mockResolvedValue(2);
    renderComponent({ autoStart: true });

    await waitFor(() => {
      expect(indexedDBStorage.getTutorialProgress).toHaveBeenCalledWith('main-onboarding-tutorial');
    });
  });

  it('starts automatically when autoStart is true', async () => {
    renderComponent({ autoStart: true });

    await waitFor(
      () => {
        expect(screen.getByTestId('joyride-overlay')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('shows first step when tutorial starts', async () => {
    renderComponent({ autoStart: true });

    await waitFor(() => {
      const overlay = screen.getByTestId('joyride-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay.getAttribute('data-step-index')).toBe('0');
    });
  });

  it('advances to next step when Next is clicked', async () => {
    renderComponent({ autoStart: true });

    await waitFor(() => {
      expect(screen.getByTestId('joyride-overlay')).toBeInTheDocument();
    });

    const nextButton = screen.getByTestId('joyride-next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      const overlay = screen.getByTestId('joyride-overlay');
      expect(overlay.getAttribute('data-step-index')).toBe('1');
    });
  });

  it('goes back when Back is clicked', async () => {
    renderComponent({ autoStart: true });

    await waitFor(() => {
      expect(screen.getByTestId('joyride-overlay')).toBeInTheDocument();
    });

    // Go to step 1
    fireEvent.click(screen.getByTestId('joyride-next'));
    await waitFor(() => {
      expect(screen.getByTestId('joyride-overlay').getAttribute('data-step-index')).toBe('1');
    });

    // Go back
    fireEvent.click(screen.getByTestId('joyride-back'));
    await waitFor(() => {
      expect(screen.getByTestId('joyride-overlay').getAttribute('data-step-index')).toBe('0');
    });
  });

  it('calls onComplete when tutorial is finished', async () => {
    const onComplete = jest.fn();
    renderComponent({ autoStart: true, onComplete });

    await waitFor(() => {
      expect(screen.getByTestId('joyride-overlay')).toBeInTheDocument();
    });

    // Go to last step
    const overlay = screen.getByTestId('joyride-overlay');
    const stepIndex = parseInt(overlay.getAttribute('data-step-index') || '0');
    
    // Click next until last step
    let currentStep = stepIndex;
    while (currentStep < 6) {
      fireEvent.click(screen.getByTestId('joyride-next'));
      await waitFor(() => {
        const newOverlay = screen.getByTestId('joyride-overlay');
        currentStep = parseInt(newOverlay.getAttribute('data-step-index') || '0');
      });
    }

    // Click next on last step to finish
    fireEvent.click(screen.getByTestId('joyride-next'));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it('calls onSkip when tutorial is skipped', async () => {
    const onSkip = jest.fn();
    renderComponent({ autoStart: true, onSkip });

    await waitFor(() => {
      expect(screen.getByTestId('joyride-overlay')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('joyride-skip'));

    await waitFor(() => {
      expect(onSkip).toHaveBeenCalled();
    });
  });

  it('saves progress to IndexedDB when step changes', async () => {
    renderComponent({ autoStart: true });

    await waitFor(() => {
      expect(screen.getByTestId('joyride-overlay')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('joyride-next'));

    await waitFor(() => {
      expect(indexedDBStorage.saveTutorialProgress).toHaveBeenCalledWith('main-onboarding-tutorial', 1);
    });
  });

  it('does not auto-start if tutorial is already completed', async () => {
    (indexedDBStorage.isTutorialCompleted as jest.Mock).mockResolvedValue(true);
    renderComponent({ autoStart: true });

    await waitFor(() => {
      expect(indexedDBStorage.isTutorialCompleted).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('joyride-overlay')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('shows restart button when tutorial is not running', () => {
    renderComponent();
    const restartButton = screen.getByTitle('Restart Tutorial');
    expect(restartButton).toBeInTheDocument();
  });

  it('restarts tutorial when restart button is clicked', async () => {
    renderComponent();
    const restartButton = screen.getByTitle('Restart Tutorial');

    fireEvent.click(restartButton);

    await waitFor(() => {
      expect(indexedDBStorage.clearTutorialProgress).toHaveBeenCalledWith('main-onboarding-tutorial');
      expect(screen.getByTestId('joyride-overlay')).toBeInTheDocument();
    });
  });

  it('handles IndexedDB not supported gracefully', () => {
    (indexedDBStorage.isSupported as jest.Mock).mockReturnValue(false);
    renderComponent({ autoStart: true });
    
    // Should still render without errors
    expect(screen.queryByTestId('joyride-overlay')).not.toBeInTheDocument();
  });
});
