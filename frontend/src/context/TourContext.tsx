import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePet } from './PetContext';

export interface TourStep {
    id: string;
    targetId: string;
    content: string;
    actionType: 'click' | 'view';
    nextStepId?: string;
    position?: 'top' | 'right' | 'bottom' | 'left';
}

interface TourContextType {
    isActive: boolean;
    currentStep: TourStep | null;
    startTour: () => void;
    endTour: () => void;
    completeStep: (stepId: string) => void;
}

const TOUR_STEPS: TourStep[] = [
    {
        id: 'step-navigation',
        targetId: 'nav-kitchen',
        content: "Hi! I'm Scout, your guide. Let's start by visiting the Kitchen to see if your pet is hungry!",
        actionType: 'click',
        nextStepId: 'step-select-food',
        position: 'bottom'
    },
    {
        id: 'step-select-food',
        targetId: 'inventory-item-apple',
        content: "Great! First, select the Basic Kibble from the menu.",
        actionType: 'click',
        nextStepId: 'step-feed-confirm',
        position: 'right'
    },
    {
        id: 'step-feed-confirm',
        targetId: 'feed-confirm-button',
        content: "Now, click 'Feed Pet' to give it to your pet!",
        actionType: 'click',
        nextStepId: 'step-observation',
        position: 'top'
    },
    {
        id: 'step-observation',
        targetId: 'stat-hunger',
        content: "See that? The Hunger bar updated! Keep an eye on your pet's stats to keep them happy.",
        actionType: 'view',
        nextStepId: 'step-economy',
        position: 'left'
    },
    {
        id: 'step-economy',
        targetId: 'nav-town',
        content: "Lastly, visit the Town (Shop) to buy more supplies or play games to earn coins!",
        actionType: 'click',
        position: 'bottom'
    }
];

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(() => {
        const saved = localStorage.getItem('tour_step_index');
        return saved ? parseInt(saved, 10) : -1;
    });
    const { oneTimeEvents, completeOneTimeEvent } = usePet();

    useEffect(() => {
        if (currentStepIndex >= 0) {
            setIsActive(true);
            localStorage.setItem('tour_step_index', currentStepIndex.toString());
        } else {
            setIsActive(false);
            localStorage.removeItem('tour_step_index');
        }
    }, [currentStepIndex]);

    const startTour = useCallback(() => {
        setCurrentStepIndex(0);
    }, []);

    const endTour = useCallback(async () => {
        setCurrentStepIndex(-1);
        try {
            await completeOneTimeEvent('tutorial_complete');
        } catch (err) {
            console.error('Failed to save tour completion:', err);
        }
    }, [completeOneTimeEvent]);

    const completeStep = useCallback((stepId: string) => {
        if (!isActive || currentStepIndex === -1) return;

        const currentStep = TOUR_STEPS[currentStepIndex];
        if (currentStep.id === stepId) {
            if (currentStepIndex < TOUR_STEPS.length - 1) {
                setCurrentStepIndex(prev => prev + 1);
            } else {
                endTour();
            }
        }
    }, [isActive, currentStepIndex, endTour]);

    const currentStep = currentStepIndex >= 0 ? TOUR_STEPS[currentStepIndex] : null;

    return (
        <TourContext.Provider value={{ isActive, currentStep, startTour, endTour, completeStep }}>
            {children}
        </TourContext.Provider>
    );
};

export const useTour = () => {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
};
