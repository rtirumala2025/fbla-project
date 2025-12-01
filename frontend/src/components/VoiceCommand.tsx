import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, AlertCircle, CheckCircle, History, X, RotateCcw } from 'lucide-react';
import apiClient from '../services/apiClient';

// TypeScript interfaces
export interface CommandHistoryItem {
  id: string;
  command: string;
  timestamp: Date;
  confidence: number;
  action: string;
  success: boolean;
  error?: string;
  response?: string;
}

export interface VoiceCommandResponse {
  action: string;
  confidence: number;
  parameters: Record<string, any>;
  intent: string;
  needs_clarification: boolean;
  suggestions: string[];
  error?: string;
  fallback_used: boolean;
}

export interface VoiceCommandProps {
  userId: string;
  sessionId?: string;
  petContext?: {
    name?: string;
    hunger?: number;
    happiness?: number;
    energy?: number;
    cleanliness?: number;
  };
  onCommandExecuted?: (result: VoiceCommandResponse) => void;
  className?: string;
}

export const VoiceCommand: React.FC<VoiceCommandProps> = ({
  userId,
  sessionId,
  petContext,
  onCommandExecuted,
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setCommand(transcript);
          setIsListening(false);
          handleCommandSubmit(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setError(`Speech recognition error: ${event.error}`);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const handleCommandSubmit = useCallback(async (commandText?: string, retryCount = 0) => {
    const text = commandText || command.trim();
    if (!text) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        suggestions: string[];
        results: Array<{
          action: string;
          success: boolean;
          message: string;
          stat_changes?: Record<string, number>;
          pet_state?: Record<string, any>;
        }>;
        confidence: number;
        original_command: string;
        steps_executed: number;
      }>('/api/pets/commands/execute', {
        command: text,
      });

      // Add to history
      const historyItem: CommandHistoryItem = {
        id: Date.now().toString(),
        command: text,
        timestamp: new Date(),
        confidence: response.data.confidence || 0,
        action: response.data.results[0]?.action || 'unknown',
        success: response.data.success,
        error: response.data.success ? undefined : response.data.message,
        response: response.data.message,
      };

      setCommandHistory((prev) => [historyItem, ...prev].slice(0, 20)); // Keep last 20
      
      // Call callback if provided
      if (onCommandExecuted) {
        onCommandExecuted({
          action: response.data.results[0]?.action || 'unknown',
          confidence: response.data.confidence || 0,
          parameters: {},
          intent: response.data.results[0]?.action || 'unknown',
          needs_clarification: response.data.confidence < 0.5,
          suggestions: response.data.suggestions || [],
          fallback_used: false,
        });
      }

      // Clear command on success
      if (response.data.success) {
        setCommand('');
      } else if (response.data.confidence < 0.5 && retryCount < 2) {
        // Suggest retry for low confidence
        setError(`Low confidence (${Math.round(response.data.confidence * 100)}%). Try rephrasing or click retry.`);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        'Failed to process command. Please try again.';

      setError(errorMessage);

      // Add error to history
      const historyItem: CommandHistoryItem = {
        id: Date.now().toString(),
        command: text,
        timestamp: new Date(),
        confidence: 0,
        action: 'error',
        success: false,
        error: errorMessage,
      };

      setCommandHistory((prev) => [historyItem, ...prev].slice(0, 20));
    } finally {
      setLoading(false);
    }
  }, [command, userId, onCommandExecuted]);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setError(null);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setError('Speech recognition not available. Please type your command.');
      }
    } else {
      setError('Speech recognition not supported in this browser.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Command Input */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleCommandSubmit();
                }
              }}
              placeholder="Say or type a command (e.g., 'feed my pet', 'check status')..."
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            />
          </div>

          {/* Voice Button */}
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={loading || !recognitionRef.current}
            className={`
              p-3 rounded-lg transition-all
              ${isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send Button */}
          <button
            onClick={() => handleCommandSubmit()}
            disabled={loading || !command.trim()}
            className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>

        {/* Error Display with Retry */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
            >
              <div className="flex items-center space-x-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  handleCommandSubmit(command, 1);
                }}
                className="ml-3 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-3 text-sm text-gray-600 flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Processing command...</span>
          </div>
        )}
      </div>

      {/* History Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <History className="w-4 h-4" />
          <span>Command History ({commandHistory.length})</span>
        </button>
      </div>

      {/* Command History */}
      <AnimatePresence>
        {showHistory && commandHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-4 space-y-3 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Recent Commands</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {commandHistory.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.command}</p>
                    {item.response && (
                      <p className="text-xs text-gray-600 mt-1">{item.response}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{item.timestamp.toLocaleTimeString()}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Action: {item.action}</span>
                    <span className={`font-medium ${getConfidenceColor(item.confidence)}`}>
                      Confidence: {getConfidenceLabel(item.confidence)} ({Math.round(item.confidence * 100)}%)
                    </span>
                  </div>
                </div>
                {item.error && (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{item.error}</span>
                    </div>
                    <button
                      onClick={() => handleCommandSubmit(item.command, 1)}
                      className="ml-2 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 transition-colors flex items-center space-x-1"
                      title="Retry this command"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceCommand;
