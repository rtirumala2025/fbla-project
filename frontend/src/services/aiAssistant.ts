
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
}

const SYSTEM_PROMPT_TEMPLATE = `You are a helpful assistant for the Companion virtual pet application, designed for FBLA competition. 

The app helps users learn about pet care and financial responsibility by:
- Caring for a virtual pet (feed, play, rest, bathe)
- Managing a budget (actions cost money)
- Tracking expenses and pet statistics

Current context:
- Page: {currentPage}
- Pet Stats: {petStats}
- User Balance: {balance}

Provide concise, friendly help. Keep responses under 100 words unless detailed explanation requested.`;

const FAQ = {
    "default": "I'm here to help with your pet and budget! Ask me anything.",
    "feed": "You can feed your pet by clicking the 'Feed' button. It costs a small amount but keeps your pet healthy!",
    "budget": "Check the Budget page to see your recent transactions and manage your expenses."
};

export async function askAIAssistant(request: AIRequest): Promise<AIResponse> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
        console.warn('OpenRouter API key not set. Using fallback responses.');
        // Simple mock response based on keywords if no API key
        const lowerMsg = request.userMessage.toLowerCase();
        if (lowerMsg.includes('feed') || lowerMsg.includes('food')) return { message: FAQ.feed };
        if (lowerMsg.includes('budget') || lowerMsg.includes('money') || lowerMsg.includes('cost')) return { message: FAQ.budget };
        return { message: "I'm currently in demo mode (no API key). " + FAQ.default };
    }

    try {
        // Construct system prompt with current context
        const filledSystemPrompt = SYSTEM_PROMPT_TEMPLATE
            .replace('{currentPage}', request.context.currentPage)
            .replace('{petStats}', JSON.stringify(request.context.petStats || 'Unknown'))
            .replace('{balance}', request.context.balance !== undefined ? `$${request.context.balance}` : 'Unknown');

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'FBLA Virtual Pet Companion'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.2-3b-instruct:free',
                messages: [
                    { role: 'system', content: filledSystemPrompt },
                    ...request.chatHistory.slice(-5), // Keep context window small
                    { role: 'user', content: request.userMessage }
                ],
                max_tokens: 200,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI API Error:', response.status, errorText);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return {
            message: data.choices[0]?.message?.content || "I'm not sure how to answer that."
        };
    } catch (error) {
        console.error('AI Service Error:', error);
        return { message: "Sorry, I'm having trouble connecting to the brain. Please try again later." };
    }
}
