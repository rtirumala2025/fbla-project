import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2, Heart, Zap, Coffee, Droplet } from 'lucide-react';
import PetEmotionCard from './PetEmotionCard';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  action?: string;
  state?: any;
};

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [petState, setPetState] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  // Generate a unique session ID if not exists
  useEffect(() => {
    const storedSessionId = localStorage.getItem('petSessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
      // Load chat history from localStorage
      const savedChat = localStorage.getItem(`chat_${storedSessionId}`);
      if (savedChat) {
        try {
          const parsed = JSON.parse(savedChat);
          setMessages(parsed.messages || []);
          setPetState(parsed.petState || null);
        } catch (e) {
          console.error('Failed to load chat history', e);
        }
      }
    } else {
      const newSessionId = `pet_${Date.now()}`;
      localStorage.setItem('petSessionId', newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  // Save chat history when messages or pet state changes
  useEffect(() => {
    if (sessionId && (messages.length > 0 || petState)) {
      const chatData = {
        messages,
        petState,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(`chat_${sessionId}`, JSON.stringify(chatData));
    }
  }, [messages, petState, sessionId]);

  // Focus input on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Create a placeholder for the assistant's response
    const assistantMessageId = `temp-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, assistantMessage]);

    // Check if this is a command (starts with /)

    try {
      let response;
      let isCommand = false;
      
      // Handle commands (if any)
      if (input.startsWith('/')) {
        const [command, ...args] = input.slice(1).split(' ');
        isCommand = true;
        
        // Map commands to pet actions
        const commandMap: Record<string, string> = {
          'feed': 'feed',
          'play': 'play',
          'sleep': 'sleep',
          'pet': 'pet',
          'train': 'train',
          'clean': 'clean',
          'status': 'status'
        };
        
        const action = commandMap[command.toLowerCase()] || 'talk';
        
        response = await fetch('/api/pet/interact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': currentUser ? `Bearer ${await currentUser.getIdToken()}` : '',
          },
          body: JSON.stringify({
            session_id: sessionId,
            action: action,
            message: action === 'talk' ? args.join(' ') : undefined,
          }),
        });
      } else {
        // Regular chat message
        response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': currentUser ? `Bearer ${await currentUser.getIdToken()}` : '',
          },
          body: JSON.stringify({
            session_id: sessionId,
            message: input,
            model: 'meta-llama/llama-3-70b-instruct',
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      // If this was a pet interaction, update the pet state
      if (data.pet_state) {
        setPetState({
          ...data.pet_state,
          last_updated: new Date().toISOString()
        });
      }
      
      // Update the assistant's message with the response
      setMessages(prev => {
        const newMessages = [...prev];
        const messageIndex = newMessages.findIndex(m => m.id === assistantMessageId);
        
        if (messageIndex !== -1) {
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            content: data.message || data.response || "I'm not sure how to respond to that.",
            state: data.pet_state ? { ...data.pet_state } : undefined
          };
        }
        
        return newMessages;
      });
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Update the assistant's message with an error
      setMessages(prev => {
        const newMessages = [...prev];
        const messageIndex = newMessages.findIndex(m => m.id === assistantMessageId);
        
        if (messageIndex !== -1) {
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            content: "I'm having trouble connecting right now. Please try again later.",
          };
        }
        
        return newMessages;
      });
      
      setError('Failed to get response. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format message timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get pet mood emoji
  const getMoodEmoji = (mood: string) => {
    const emojis: Record<string, string> = {
      happy: '😊',
      excited: '🎉',
      neutral: '😐',
      tired: '😴',
      hungry: '🍽️',
      playful: '🎾',
      sad: '😢',
      sick: '🤒'
    };
    return emojis[mood.toLowerCase()] || '🐾';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar with pet status */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-80 bg-white border-r border-gray-200 flex flex-col"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Pet Status</h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {petState ? (
                <PetEmotionCard petState={petState} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🐾</div>
                    <p className="text-gray-500">Your pet is ready to play!</p>
                    <p className="text-sm text-gray-400 mt-2">Start chatting to see your pet's status</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                <p>Try commands: /feed, /play, /sleep, /pet</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-white shadow-lg">
        {/* Header */}
        <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-1 rounded-md hover:bg-indigo-500"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <h2 className="text-xl font-semibold">Virtual Pet Assistant</h2>
          </div>
          {petState?.mood && (
            <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
              <span>{getMoodEmoji(petState.mood)}</span>
              <span className="capitalize">{petState.mood}</span>
            </div>
          )}
        </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="bg-indigo-100 p-4 rounded-full mb-4">
              <Bot className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Virtual Pet!</h3>
            <p className="text-gray-500 max-w-md mb-6">
              I'm your virtual pet assistant. You can talk to me or use commands to interact with your pet.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              <button
                onClick={() => setInput('/play')}
                className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-2">🎾</span>
                  <span>Play with pet</span>
                </div>
              </button>
              <button
                onClick={() => setInput('/feed')}
                className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-orange-500 mr-2">🍖</span>
                  <span>Feed pet</span>
                </div>
              </button>
              <button
                onClick={() => setInput('/status')}
                className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-blue-500 mr-2">📊</span>
                  <span>Check status</span>
                </div>
              </button>
              <button
                onClick={() => setInput('What can you do?')}
                className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <span className="text-purple-500 mr-2">❓</span>
                  <span>What can you do?</span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-start">
                    {message.role === 'assistant' && (
                      <div className="mr-2 mt-0.5">
                        <Bot className="w-5 h-5 text-indigo-500" />
                      </div>
                    )}
                    <div>
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      {message.state && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <div className="flex items-center space-x-4 text-xs">
                            {message.state.happiness !== undefined && (
                              <div className="flex items-center">
                                <Heart className="w-3 h-3 text-pink-500 mr-1" />
                                <span>{Math.round(message.state.happiness)}%</span>
                              </div>
                            )}
                            {message.state.energy !== undefined && (
                              <div className="flex items-center">
                                <Zap className="w-3 h-3 text-yellow-500 mr-1" />
                                <span>{Math.round(message.state.energy)}%</span>
                              </div>
                            )}
                            {message.state.hunger !== undefined && (
                              <div className="flex items-center">
                                <Coffee className="w-3 h-3 text-orange-500 mr-1" />
                                <span>{Math.round(message.state.hunger)}%</span>
                              </div>
                            )}
                            {message.state.cleanliness !== undefined && (
                              <div className="flex items-center">
                                <Droplet className="w-3 h-3 text-blue-500 mr-1" />
                                <span>{Math.round(message.state.cleanliness)}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <p className={`text-xs mt-2 ${
                        message.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="ml-2">
                        <User className="w-5 h-5 text-indigo-200" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-4 max-w-[85%]">
                  <div className="flex items-center space-x-2">
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
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start"
            >
              <div className="flex-1">
                <p className="font-medium">Something went wrong</p>
                <p className="text-red-600">{error}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or try /help..."
            className="w-full p-3 pr-16 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-70 transition-all duration-200"
            disabled={isLoading}
            onKeyDown={(e) => {
              // Allow new lines with Shift+Enter
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full ${
              !input.trim() || isLoading
                ? 'text-gray-400'
                : 'text-white bg-indigo-600 hover:bg-indigo-700'
            } transition-colors`}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1"></span>
            {petState ? 'Pet is online' : 'Ready'}
          </span>
          <span>•</span>
          <button 
            type="button"
            onClick={() => setInput('/help')}
            className="text-indigo-600 hover:underline"
          >
            Type /help for commands
          </button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default AIChat;
