import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePet } from './PetContext';

export interface TourStep {
    id: string;
    targetId: string;
    content: string; // Fallback content
    actionType: 'click' | 'view';
    nextStepId?: string;
    position?: 'top' | 'right' | 'bottom' | 'left';
    missionDescription?: string; // What the user needs to do
}

interface TourContextType {
    isActive: boolean;
    isDismissed: boolean;
    currentStep: TourStep | null;
    scoutMessage: string;
    startTour: () => void;
    endTour: () => void;
    completeStep: (stepId: string) => void;
    dismissStep: () => void;
    setIsDismissed: (val: boolean) => void;
    isGenerating: boolean;
    scoutMood?: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        id: 'step-navigation',
        targetId: 'nav-kitchen',
        content: "Hi! I'm Scout, your guide. Let's start by visiting the Kitchen to see if your pet is hungry!",
        missionDescription: "Visit the Kitchen",
        actionType: 'click',
        nextStepId: 'step-select-food',
        position: 'bottom'
    },
    {
        id: 'step-select-food',
        targetId: 'inventory-item-apple',
        content: "Great! First, select the Basic Kibble from the menu.",
        missionDescription: "Select Basic Kibble",
        actionType: 'click',
        nextStepId: 'step-feed-confirm',
        position: 'right'
    },
    {
        id: 'step-feed-confirm',
        targetId: 'feed-confirm-button',
        content: "Now, click 'Feed Pet' to give it to your pet!",
        missionDescription: "Feed your pet",
        actionType: 'click',
        nextStepId: 'step-observation',
        position: 'top'
    },
    {
        id: 'step-observation',
        targetId: 'stat-hunger',
        content: "See that? The Hunger bar updated! Keep an eye on your pet's stats to keep them happy.",
        missionDescription: "Check the stats",
        actionType: 'view',
        nextStepId: 'step-economy',
        position: 'left'
    },
    {
        id: 'step-economy',
        targetId: 'nav-town',
        content: "Lastly, visit the Town (Shop) to buy more supplies or play games to earn coins!",
        missionDescription: "Explore the Town",
        actionType: 'click',
        position: 'bottom'
    }
];

const TourContext = createContext<TourContextType | undefined>(undefined);

import { askAIAssistant } from '../services/aiAssistant';

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isActive, setIsActive] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [scoutMessage, setScoutMessage] = useState("");
    const [scoutMood, setScoutMood] = useState<string | undefined>(undefined);
    const [currentStepIndex, setCurrentStepIndex] = useState(() => {
        const saved = localStorage.getItem('tour_step_index');
        return saved ? parseInt(saved, 10) : -1;
    });
    const { oneTimeEvents, completeOneTimeEvent, pet } = usePet();

    useEffect(() => {
        if (currentStepIndex >= 0) {
            setIsActive(true);
            setIsDismissed(false);
            localStorage.setItem('tour_step_index', currentStepIndex.toString());
        } else {
            setIsActive(false);
            setIsDismissed(false);
            localStorage.removeItem('tour_step_index');
        }
    }, [currentStepIndex]);

    // AI Message Generation
    const generateScoutMessage = useCallback(async (step: TourStep) => {
        if (!pet) {
            setScoutMessage(step.content);
            return;
        }

        setIsGenerating(true);
        try {
            const prompt = `You are Scout, the AI Assistant (Llama 4 mode). 
            MISSION: ${step.missionDescription || step.targetId}.
            PET: ${pet.name} (${pet.species}).
            STATS: Hunger ${pet.stats.hunger}%, Happiness ${pet.stats.happiness}%, Energy ${pet.stats.energy}%.
            
            Based on these stats, give a highly personalized, encouraging 1-2 sentence instruction for the tour mission. 
            Be witty and refer to ${pet.name}'s specific needs right now.
            Respond in JSON format with "message" and "mood" (one of: happy, excited, concerned, focused).`;

            const response = await askAIAssistant({
                userMessage: prompt,
                context: {
                    currentPage: window.location.pathname,
                    petStats: pet.stats
                },
                chatHistory: []
            });

            // The backend usually returns the message. If it recognized the JSON request:
            let content = response.message;
            try {
                // If the model wrapped it in JSON or markdown code block
                const jsonMatch = response.message.match(/\{.*\}/s);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    content = parsed.message || content;
                    setScoutMood(parsed.mood);
                } else {
                    setScoutMood(response.mood);
                }
            } catch (e) {
                setScoutMood(response.mood);
            }

            setScoutMessage(content || step.content);
        } catch (err) {
            console.error('Failed to generate Scout message:', err);
            setScoutMessage(step.content);
        } finally {
            setIsGenerating(false);
        }
    }, [pet]);

    useEffect(() => {
        if (currentStepIndex >= 0) {
            generateScoutMessage(TOUR_STEPS[currentStepIndex]);
        }
    }, [currentStepIndex, generateScoutMessage]);

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

    const dismissStep = useCallback(() => {
        setIsDismissed(true);
    }, []);

    const currentStep = currentStepIndex >= 0 ? TOUR_STEPS[currentStepIndex] : null;

    return (
        <TourContext.Provider value={{
            isActive,
            isDismissed,
            setIsDismissed,
            currentStep,
            scoutMessage,
            scoutMood,
            startTour,
            endTour,
            completeStep,
            dismissStep,
            isGenerating
        }}>
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
