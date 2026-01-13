import { supabase } from '../lib/supabase';
import { getEnv } from '../utils/env';

export interface AIRequest {
    userMessage: string;
    context: {
        currentPage: string;
        petStats?: any;
        balance?: number;
        recentActions?: string[];
    };
    chatHistory: { role: 'user' | 'assistant' | 'system'; content: string }[];
}

export interface AIResponse {
    message: string;
    mood?: string;
    notifications?: string[];
}

export async function askAIAssistant(request: AIRequest): Promise<AIResponse> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        if (!token) {
            console.warn('No auth token found for AI request');
            // If we have no token, we can't use the backend.
            // Fallback for unauthenticated users (though app usually requires auth)
            return { message: "Please log in to chat with me!" };
        }

        const API_URL = getEnv('VITE_API_URL', 'http://localhost:8000');

        // Enrich the message with context since backend request schema is simple
        // The backend knows pet stats/balance, but not "Current Page" or frontend state
        let contextPrefix = "";
        if (request.context.currentPage && request.context.currentPage !== 'unknown') {
            contextPrefix += `[Current Page: ${request.context.currentPage}] `;
        }

        const finalMessage = contextPrefix ? `${contextPrefix}\n\n${request.userMessage}` : request.userMessage;

        const response = await fetch(`${API_URL}/api/ai/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: finalMessage,
                // We could pass session_id if we managed it in the context
                // For now, let the backend handle stateless or default session logic
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI Backend Error:', response.status, errorText);
            throw new Error(`Backend request failed: ${response.status}`);
        }

        const data = await response.json();

        return {
            message: data.message,
            mood: data.mood,
            notifications: data.notifications
        };

    } catch (error) {
        console.error('AI Service Error:', error);
        return { message: "Sorry, I'm having trouble connecting to the brain. Please try again later." };
    }
}
