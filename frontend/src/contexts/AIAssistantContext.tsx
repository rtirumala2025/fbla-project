import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { askAIAssistant, AIRequest, AIResponse } from '../services/aiAssistant';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

interface AIContextState {
    currentPage: string;
    petStats?: any;
    balance?: number;
    recentActions?: string[];
    // Add other relevant context data here
}

interface AIAssistantContextType {
    isOpen: boolean;
    toggleOpen: () => void;
    messages: ChatMessage[];
    sendMessage: (message: string) => Promise<void>;
    sendSystemMessage: (buildingType: string) => void;
    isLoading: boolean;
    clearHistory: () => void;
    updateContext: (context: Partial<AIContextState>) => void;
    currentContext: AIContextState;
}

const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

export const useAIAssistant = () => {
    const context = useContext(AIAssistantContext);
    if (!context) {
        throw new Error('useAIAssistant must be used within an AIAssistantProvider');
    }
    return context;
};

interface AIAssistantProviderProps {
    children: ReactNode;
    initialContext?: Partial<AIContextState>;
}

export const AIAssistantProvider: React.FC<AIAssistantProviderProps> = ({ children, initialContext = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentContext, setCurrentContext] = useState<AIContextState>({
        currentPage: 'unknown',
        ...initialContext
    });

    const toggleOpen = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const updateContext = useCallback((newContext: Partial<AIContextState>) => {
        setCurrentContext(prev => ({ ...prev, ...newContext }));
    }, []);

    const clearHistory = useCallback(() => {
        setMessages([]);
    }, []);

    const navigate = useNavigate();

    const sendMessage = useCallback(async (content: string) => {
        // Add user message immediately
        const userMessage: ChatMessage = {
            role: 'user',
            content,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const request: AIRequest = {
                userMessage: content,
                context: currentContext,
                chatHistory: messages.map(m => ({ role: m.role, content: m.content }))
            };

            const response = await askAIAssistant(request);
            let finalContent = response.message;

            // Navigation parsing logic
            const navMatch = finalContent.match(/\[NAVIGATE:\s*(\w+)\]/);
            if (navMatch) {
                const roomName = navMatch[1];
                // Remove the tag from the content
                finalContent = finalContent.replace(/\[NAVIGATE:\s*\w+\]/g, '').trim();

                // Map room names to routes
                const roomRoutes: Record<string, string> = {
                    'Dashboard': '/dashboard',
                    'Shop': '/shop',
                    'PetGame': '/pet-game',
                    'Budget': '/budget',
                    'Clean': '/clean',
                    'Rest': '/rest',
                    'Health': '/health',
                    'Social': '/social',
                    'FinanceSim': '/finance-sim',
                    'Fetch': '/minigames/fetch',
                    'Puzzle': '/minigames/puzzle',
                    'Reaction': '/minigames/reaction',
                    'Dream': '/minigames/dream',
                    'Memory': '/minigames/memory',
                    'Kitchen': '/dashboard?action=feed'
                };

                const route = roomRoutes[roomName];
                if (route) {
                    console.log(`AI Navigation: Moving to ${roomName} (${route})`);
                    navigate(route);
                }
            }

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: finalContent,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Failed to get AI response:', error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [currentContext, messages, navigate]);

    // Game/building intro messages
    const BUILDING_INTROS: Record<string, string> = {
        agility: `🎯 **Welcome to the Agility Center!**

Here's how to play:
1. **Click the moving targets** as fast as you can
2. **Build combos** by hitting targets in a row for bonus points
3. **Watch for ⭐ bonus targets** - they're worth 50 points!
4. You have **30 seconds** - earn coins based on your score

💡 **Tip:** The faster you click, the higher your time bonus! Ready to train your reflexes?`,

        vet: `🏥 **Welcome to the Vet Clinic!**

Here's how the health check works:
1. **Watch for the glowing body part** on your pet
2. **Click it quickly** before time runs out (2 seconds per round)
3. Complete **5 rounds** to finish the checkup
4. Your score determines the **health boost** your pet receives

💰 **Cost:** 25 coins for treatment after the checkup. Better scores = bigger health boosts!`,

        shop: `🛍️ **Welcome to the Gift Shop!**

Here you can:
- **Browse items** by category (Food, Toys, Medicine, Accessories)
- **Add items to cart** and purchase with your coins
- **Use purchased items** from your inventory to boost pet stats

💡 **Tip:** Stock up on food and medicine to keep your pet healthy!`,

        house: `🏠 **Welcome Home!**

This is where you can:
- **Feed your pet** (costs 5 coins, increases hunger & energy)
- **Play with your pet** (free, increases happiness)
- **Bathe your pet** (costs 3 coins, increases cleanliness)
- **Let your pet rest** (free, restores energy)

💡 **Tip:** Keep all stats balanced for a happy, healthy pet!`
    };

    const sendSystemMessage = useCallback((buildingType: string) => {
        const intro = BUILDING_INTROS[buildingType.toLowerCase()];
        if (!intro) return;

        // Clear previous messages and add the intro
        const introMessage: ChatMessage = {
            role: 'assistant',
            content: intro,
            timestamp: Date.now()
        };

        setMessages([introMessage]);
        setIsOpen(true); // Auto-open the AI chat
    }, []);

    return (
        <AIAssistantContext.Provider value={{
            isOpen,
            toggleOpen,
            messages,
            sendMessage,
            sendSystemMessage,
            isLoading,
            clearHistory,
            updateContext,
            currentContext
        }}>
            {children}
        </AIAssistantContext.Provider>
    );
};
