import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
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

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.message,
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
    }, [currentContext, messages]);

    return (
        <AIAssistantContext.Provider value={{
            isOpen,
            toggleOpen,
            messages,
            sendMessage,
            isLoading,
            clearHistory,
            updateContext,
            currentContext
        }}>
            {children}
        </AIAssistantContext.Provider>
    );
};
