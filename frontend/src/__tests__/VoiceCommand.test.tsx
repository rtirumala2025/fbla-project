/**
 * Tests for VoiceCommand component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VoiceCommand from '../components/VoiceCommand';
import { sendVoiceCommand } from '../api/nextGen';

// Mock API
jest.mock('../api/nextGen', () => ({
  sendVoiceCommand: jest.fn(),
}));

// Mock Speech Recognition API
const mockRecognition = {
  lang: 'en-US',
  continuous: false,
  interimResults: true,
  maxAlternatives: 1,
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  onstart: null as any,
  onresult: null as any,
  onerror: null as any,
  onend: null as any,
};

const mockSpeechRecognition = jest.fn(() => mockRecognition);

// Mock window.SpeechRecognition
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: mockSpeechRecognition,
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: mockSpeechRecognition,
});

// Mock MediaDevices API
const mockStream = {
  getTracks: jest.fn(() => [
    {
      stop: jest.fn(),
    },
  ]),
};

const mockGetUserMedia = jest.fn(() => Promise.resolve(mockStream));

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
});

// Mock AudioContext
const mockAudioContext = {
  createAnalyser: jest.fn(() => ({
    fftSize: 256,
    smoothingTimeConstant: 0.8,
    frequencyBinCount: 128,
    getByteFrequencyData: jest.fn(),
  })),
  createMediaStreamSource: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
  close: jest.fn().mockResolvedValue(undefined),
  state: 'running',
};

const mockAudioContextConstructor = jest.fn(() => mockAudioContext);

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: mockAudioContextConstructor,
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: mockAudioContextConstructor,
});

// Mock canvas
HTMLCanvasElement.prototype.getContext = jest.fn(() => {
  return {
    fillStyle: '',
    fillRect: jest.fn(),
  } as any;
});

const renderComponent = (props = {}) => {
  return render(<VoiceCommand {...props} />);
};

describe('VoiceCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecognition.start.mockClear();
    mockRecognition.stop.mockClear();
    mockGetUserMedia.mockClear();
  });

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByLabelText('Start voice command')).toBeInTheDocument();
  });

  it('shows unsupported message when SpeechRecognition is not available', () => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    renderComponent();
    expect(screen.getByText(/Voice commands are not supported/i)).toBeInTheDocument();
  });

  it('does not render when disabled', () => {
    renderComponent({ enabled: false });
    expect(screen.queryByLabelText('Start voice command')).not.toBeInTheDocument();
  });

  it('starts listening when button is clicked', () => {
    renderComponent();

    const button = screen.getByLabelText('Start voice command');
    fireEvent.click(button);

    expect(mockRecognition.start).toHaveBeenCalled();
  });

  it('stops listening when button is clicked again', async () => {
    renderComponent();

    const button = screen.getByLabelText('Start voice command');
    fireEvent.click(button);

    // Wait for state to update
    await waitFor(() => {
      expect(screen.getByLabelText('Stop listening')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Stop listening'));

    expect(mockRecognition.stop).toHaveBeenCalled();
  });

  it('shows listening state when recognition starts', async () => {
    renderComponent();

    const button = screen.getByLabelText('Start voice command');
    fireEvent.click(button);

    // Simulate recognition start
    if (mockRecognition.onstart) {
      mockRecognition.onstart();
    }

    await waitFor(() => {
      expect(screen.getByLabelText('Stop listening')).toBeInTheDocument();
    });
  });

  it('displays transcript when speech is recognized', async () => {
    renderComponent();

    const button = screen.getByLabelText('Start voice command');
    fireEvent.click(button);

    // Simulate recognition result
    const mockEvent = {
      results: [
        [
          {
            transcript: 'feed my pet',
            confidence: 0.9,
            isFinal: false,
          },
        ],
      ],
    };

    if (mockRecognition.onstart) {
      mockRecognition.onstart();
    }

    await waitFor(() => {
      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/"feed my pet"/)).toBeInTheDocument();
    });
  });

  it('processes command when final result is received', async () => {
    const mockResponse: any = {
      intent: 'feed',
      confidence: 0.9,
      feedback: 'Feeding your pet...',
      action: 'feed_pet',
    };

    (sendVoiceCommand as jest.Mock).mockResolvedValue(mockResponse);

    renderComponent();

    const button = screen.getByLabelText('Start voice command');
    fireEvent.click(button);

    // Simulate final recognition result
    const mockEvent = {
      results: [
        [
          {
            transcript: 'feed my pet',
            confidence: 0.9,
            isFinal: true,
          },
        ],
      ],
    };

    if (mockRecognition.onstart) {
      mockRecognition.onstart();
    }

    await waitFor(() => {
      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }
    });

    await waitFor(() => {
      expect(sendVoiceCommand).toHaveBeenCalledWith({
        transcript: 'feed my pet',
        locale: 'en-US',
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/Feeding your pet/i)).toBeInTheDocument();
    });
  });

  it('calls onCommandSuccess when command succeeds', async () => {
    const onCommandSuccess = jest.fn();
    const mockResponse: any = {
      intent: 'feed',
      confidence: 0.9,
      feedback: 'Success',
    };

    (sendVoiceCommand as jest.Mock).mockResolvedValue(mockResponse);

    renderComponent({ onCommandSuccess });

    const button = screen.getByLabelText('Start voice command');
    fireEvent.click(button);

    const mockEvent = {
      results: [
        [
          {
            transcript: 'feed my pet',
            confidence: 0.9,
            isFinal: true,
          },
        ],
      ],
    };

    if (mockRecognition.onstart) {
      mockRecognition.onstart();
    }

    await waitFor(() => {
      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }
    });

    await waitFor(() => {
      expect(onCommandSuccess).toHaveBeenCalledWith(mockResponse);
    });
  });

  it('displays error message when command fails', async () => {
    const error = new Error('Network error');
    (sendVoiceCommand as jest.Mock).mockRejectedValue(error);

    renderComponent();

    const button = screen.getByLabelText('Start voice command');
    fireEvent.click(button);

    const mockEvent = {
      results: [
        [
          {
            transcript: 'feed my pet',
            confidence: 0.9,
            isFinal: true,
          },
        ],
      ],
    };

    if (mockRecognition.onstart) {
      mockRecognition.onstart();
    }

    await waitFor(() => {
      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('calls onCommandError when command fails', async () => {
    const onCommandError = jest.fn();
    const error = new Error('Command failed');
    (sendVoiceCommand as jest.Mock).mockRejectedValue(error);

    renderComponent({ onCommandError });

    const button = screen.getByLabelText('Start voice command');
    fireEvent.click(button);

    const mockEvent = {
      results: [
        [
          {
            transcript: 'feed my pet',
            confidence: 0.9,
            isFinal: true,
          },
        ],
      ],
    };

    if (mockRecognition.onstart) {
      mockRecognition.onstart();
    }

    await waitFor(() => {
      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }
    });

    await waitFor(() => {
      expect(onCommandError).toHaveBeenCalledWith(error);
    });
  });

  it('displays confidence score', async () => {
    renderComponent();

    const button = screen.getByLabelText('Start voice command');
    fireEvent.click(button);

    const mockEvent = {
      results: [
        [
          {
            transcript: 'feed my pet',
            confidence: 0.85,
            isFinal: false,
          },
        ],
      ],
    };

    if (mockRecognition.onstart) {
      mockRecognition.onstart();
    }

    await waitFor(() => {
      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/85%/)).toBeInTheDocument();
    });
  });

  it('handles recognition errors gracefully', async () => {
    renderComponent();

    const button = screen.getByLabelText('Start voice command');
    fireEvent.click(button);

    if (mockRecognition.onstart) {
      mockRecognition.onstart();
    }

    // Simulate error
    const mockErrorEvent = {
      error: 'no-speech',
    };

    await waitFor(() => {
      if (mockRecognition.onerror) {
        mockRecognition.onerror(mockErrorEvent);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/No speech detected/i)).toBeInTheDocument();
    });
  });

  it('shows processing state while command is being processed', async () => {
    let resolveCommand: any;
    const commandPromise = new Promise((resolve) => {
      resolveCommand = resolve;
    });

    (sendVoiceCommand as jest.Mock).mockReturnValue(commandPromise);

    renderComponent();

    const button = screen.getByLabelText('Start voice command');
    fireEvent.click(button);

    const mockEvent = {
      results: [
        [
          {
            transcript: 'feed my pet',
            confidence: 0.9,
            isFinal: true,
          },
        ],
      ],
    };

    if (mockRecognition.onstart) {
      mockRecognition.onstart();
    }

    await waitFor(() => {
      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/Processing your command/i)).toBeInTheDocument();
    });

    // Resolve the command
    resolveCommand({
      intent: 'feed',
      confidence: 0.9,
      feedback: 'Success',
    });
  });

  it('renders waveform canvas when listening', async () => {
    renderComponent();

    const button = screen.getByLabelText('Start voice command');
    fireEvent.click(button);

    if (mockRecognition.onstart) {
      mockRecognition.onstart();
    }

    await waitFor(() => {
      const canvas = document.querySelector('.voice-command-waveform');
      expect(canvas).toBeInTheDocument();
    });
  });
});
