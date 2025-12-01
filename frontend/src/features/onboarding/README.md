# Onboarding Flow Feature

Interactive onboarding tutorial that guides users through the app.

## Usage

```tsx
import { OnboardingFlow } from '@/features/onboarding';

function App() {
  return (
    <>
      <YourApp />
      <OnboardingFlow 
        autoStart={true}
        onComplete={() => console.log('Tutorial completed!')}
        onSkip={() => console.log('Tutorial skipped')}
      />
    </>
  );
}
```

## Features

- Multi-step interactive tutorial
- Progress tracking with IndexedDB persistence
- Visual highlights for target elements
- Smooth animations with Framer Motion
- Skip and resume functionality

## Data Attributes

Add these data attributes to your components for targeting:

- `data-onboarding="pet-display"` - Pet display area
- `data-onboarding="pet-actions"` - Action buttons
- `data-onboarding="coins-display"` - Coins display
- `data-onboarding="navigation"` - Navigation menu
