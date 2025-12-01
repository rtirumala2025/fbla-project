# Voice Command UI Feature

Enhanced voice command interface with waveform animation and state feedback.

## Usage

```tsx
import { VoiceCommandUI } from '@/features/voice';
import type { VoiceCommandState } from '@/features/voice';

function MyComponent() {
  const [state, setState] = useState<VoiceCommandState>({ status: 'idle' });

  const handleStartListening = () => {
    setState({ status: 'listening' });
    // Start speech recognition
  };

  const handleStopListening = () => {
    setState({ status: 'processing' });
    // Stop speech recognition
  };

  const handleCommandSubmit = async (command: string) => {
    try {
      // Process command
      setState({ 
        status: 'success', 
        result: { action: 'feed', message: 'Pet fed successfully!' } 
      });
    } catch (error) {
      setState({ 
        status: 'error', 
        error: 'Failed to process command' 
      });
    }
  };

  return (
    <VoiceCommandUI
      onStartListening={handleStartListening}
      onStopListening={handleStopListening}
      onCommandSubmit={handleCommandSubmit}
      state={state}
    />
  );
}
```

## Features

- Real-time waveform visualization
- Visual state indicators (idle, listening, processing, success, error)
- Confidence score display
- Error and success feedback
- Manual text input fallback
- Smooth animations

## States

- `idle` - Ready to listen
- `listening` - Actively recording audio
- `processing` - Analyzing command
- `success` - Command executed successfully
- `error` - Command failed
