/**
 * Enhanced Voice Command UI
 * Features waveform animation, error indicators, and success/failure states
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import '../../styles/Voice.css';

export interface VoiceCommandState {
  status: 'idle' | 'listening' | 'processing' | 'success' | 'error';
  transcript?: string;
  confidence?: number;
  error?: string;
  result?: {
    action: string;
    message: string;
  };
}

interface VoiceCommandUIProps {
  onStartListening?: () => void;
  onStopListening?: () => void;
  onCommandSubmit?: (command: string) => Promise<void>;
  state?: VoiceCommandState;
  disabled?: boolean;
  className?: string;
}

export const VoiceCommandUI: React.FC<VoiceCommandUIProps> = ({
  onStartListening,
  onStopListening,
  onCommandSubmit,
  state = { status: 'idle' },
  disabled = false,
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [commandText, setCommandText] = useState('');
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize audio context and analyser
  useEffect(() => {
    if (state.status === 'listening' && !audioContextRef.current) {
      initializeAudio();
    } else if (state.status !== 'listening' && audioContextRef.current) {
      cleanupAudio();
    }

    return () => {
      cleanupAudio();
    };
  }, [state.status]);

  // Animate waveform
  useEffect(() => {
    if (state.status === 'listening' && waveformCanvasRef.current) {
      animateWaveform();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      // Clear canvas
      if (waveformCanvasRef.current) {
        const ctx = waveformCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, waveformCanvasRef.current.width, waveformCanvasRef.current.height);
        }
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [state.status]);

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      microphoneRef.current = microphone;

      // Generate waveform data
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWaveform = () => {
        if (analyserRef.current && state.status === 'listening') {
          analyserRef.current.getByteFrequencyData(dataArray);
          const normalized = Array.from(dataArray).slice(0, 50).map((val) => val / 255);
          setWaveformData(normalized);
          requestAnimationFrame(updateWaveform);
        }
      };
      updateWaveform();
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      if (onStopListening) {
        onStopListening();
      }
    }
  };

  const cleanupAudio = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const animateWaveform = () => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (state.status !== 'listening') return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#3b82f6'; // Indigo-500

      const barWidth = canvas.width / waveformData.length;
      const maxBarHeight = canvas.height * 0.8;

      waveformData.forEach((value, index) => {
        const barHeight = value * maxBarHeight;
        const x = index * barWidth;
        const y = canvas.height - barHeight;

        // Draw bar with rounded top
        const width = barWidth - 2;
        const radius = 2;
        ctx.beginPath();
        ctx.moveTo(x + 1 + radius, y);
        ctx.lineTo(x + 1 + width - radius, y);
        ctx.quadraticCurveTo(x + 1 + width, y, x + 1 + width, y + radius);
        ctx.lineTo(x + 1 + width, y + barHeight);
        ctx.lineTo(x + 1, y + barHeight);
        ctx.lineTo(x + 1, y + radius);
        ctx.quadraticCurveTo(x + 1, y, x + 1 + radius, y);
        ctx.closePath();
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      if (onStopListening) {
        onStopListening();
      }
    } else {
      setIsListening(true);
      if (onStartListening) {
        onStartListening();
      }
    }
  }, [isListening, onStartListening, onStopListening]);

  const handleSubmit = useCallback(async () => {
    if (!commandText.trim() || !onCommandSubmit) return;

    try {
      await onCommandSubmit(commandText.trim());
      setCommandText('');
    } catch (error) {
      console.error('Command submission failed:', error);
    }
  }, [commandText, onCommandSubmit]);

  const getStatusColor = () => {
    switch (state.status) {
      case 'listening':
        return 'bg-red-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-indigo-500';
    }
  };

  const getStatusIcon = () => {
    switch (state.status) {
      case 'listening':
        return <MicOff className="w-6 h-6" />;
      case 'processing':
        return <Loader2 className="w-6 h-6 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6" />;
      case 'error':
        return <AlertCircle className="w-6 h-6" />;
      default:
        return <Mic className="w-6 h-6" />;
    }
  };

  return (
    <div className={`voice-command-container ${className}`}>
      {/* Main control button */}
      <div className="relative">
        <motion.button
          onClick={handleToggleListening}
          disabled={disabled || state.status === 'processing'}
          className={`voice-command-button ${getStatusColor()} ${
            state.status === 'listening' ? 'animate-pulse' : ''
          }`}
          whileHover={!disabled && state.status === 'idle' ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          aria-label={state.status === 'listening' ? 'Stop listening' : 'Start listening'}
        >
          {getStatusIcon()}
        </motion.button>

        {/* Pulse ring when listening */}
        {state.status === 'listening' && (
          <motion.div
            className={`absolute inset-0 rounded-full ${getStatusColor()} opacity-30`}
            animate={{
              scale: [1, 1.5, 1.5],
              opacity: [0.3, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </div>

      {/* Waveform visualization */}
      <AnimatePresence>
        {state.status === 'listening' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-md"
          >
            <canvas
              ref={waveformCanvasRef}
              className="voice-command-waveform"
              width={300}
              height={80}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status display */}
      <div className="voice-command-status">
        {/* Transcript */}
        <AnimatePresence>
          {state.transcript && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="voice-command-transcript"
            >
              <Mic className="w-4 h-4" />
              <p className="flex-1">{state.transcript}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confidence score */}
        <AnimatePresence>
          {state.confidence !== undefined && state.status !== 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="voice-command-confidence"
            >
              <span className="confidence-label">Confidence:</span>
              <div className="confidence-bar-container">
                <motion.div
                  className={`confidence-bar ${
                    state.confidence >= 0.8
                      ? 'high'
                      : state.confidence >= 0.5
                      ? 'medium'
                      : 'low'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${state.confidence * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="confidence-value">
                {Math.round(state.confidence * 100)}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing indicator */}
        <AnimatePresence>
          {state.status === 'processing' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="voice-command-processing"
            >
              <Loader2 className="w-4 h-4" />
              <span>Processing command...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success state */}
        <AnimatePresence>
          {state.status === 'success' && state.result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="voice-command-response"
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="response-intent">{state.result.action}</p>
                  <p className="response-feedback mt-1">{state.result.message}</p>
                </div>
                <button
                  onClick={() => {
                    // Reset state - would need parent to handle this
                  }}
                  className="text-green-600 hover:text-green-700 p-1"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {state.status === 'error' && state.error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="voice-command-error"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Command failed</p>
                <p className="text-sm mt-1">{state.error}</p>
              </div>
              <button
                onClick={() => {
                  // Reset state - would need parent to handle this
                }}
                className="text-red-600 hover:text-red-700 p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Manual input (optional) */}
      {onCommandSubmit && (
        <div className="w-full max-w-md mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              placeholder="Or type your command..."
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={state.status === 'processing'}
            />
            <button
              onClick={handleSubmit}
              disabled={!commandText.trim() || state.status === 'processing'}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCommandUI;
