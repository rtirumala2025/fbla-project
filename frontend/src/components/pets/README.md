# PetInteractionPanel Component

A comprehensive React component that combines pet naming validation and pet command interfaces into a single, accessible, and animated panel.

## Features

### 🎯 Pet Naming
- **Real-time validation** against Name Validator API
- **Visual feedback** with success/error states
- **Automatic suggestions** when name is invalid
- **Debounced API calls** to prevent excessive requests
- **Character count** display (50 character limit)
- **Accessibility** with ARIA labels and keyboard navigation

### 🤖 Pet Commands
- **Chat-style interface** for natural language commands
- **AI-powered responses** from Pet Commands API
- **Real-time pet state** display (happiness, energy, hunger, cleanliness)
- **Suggestions** for next actions
- **Error handling** with fallback messages
- **Command history** in chat format
- **Quick action buttons** for common commands

### ✨ General Features
- **Responsive design** - Works on all screen sizes
- **Smooth animations** using Framer Motion
- **TypeScript-ready** with full type definitions
- **Fully documented** with JSDoc comments
- **Accessible** - WCAG compliant with ARIA labels
- **Error boundaries** - Graceful error handling

## Installation

The component uses the following dependencies (should already be in your project):

```json
{
  "react": "^18.2.0",
  "framer-motion": "^10.16.4",
  "lucide-react": "^0.546.0",
  "@supabase/supabase-js": "^2.76.1"
}
```

## Basic Usage

```tsx
import { PetInteractionPanel } from './components/pets/PetInteractionPanel';

function MyComponent() {
  const handlePetNameSubmit = (name: string) => {
    console.log('Pet name:', name);
    // Save to backend, update state, etc.
  };

  return (
    <PetInteractionPanel
      onPetNameSubmit={handlePetNameSubmit}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialPetName` | `string` | `''` | Optional initial pet name value |
| `onPetNameSubmit` | `(name: string) => void` | `undefined` | Callback fired when a valid pet name is submitted |
| `apiBaseUrl` | `string` | `process.env.REACT_APP_API_URL \|\| 'http://localhost:8000'` | Optional custom API base URL |
| `showNaming` | `boolean` | `true` | Whether to show the pet naming section |
| `showCommands` | `boolean` | `true` | Whether to show the pet commands section |

## API Endpoints

The component uses the following API endpoints:

### Name Validation
- **Endpoint**: `POST /api/validate-name`
- **Request Body**:
  ```typescript
  {
    name: string;
    name_type: 'pet' | 'account';
    exclude_user_id?: string;
  }
  ```
- **Response**:
  ```typescript
  {
    status: 'success' | 'error';
    valid: boolean;
    suggestions: string[];
    errors: string[];
  }
  ```

### Pet Commands
- **Endpoint**: `POST /api/pets/commands/execute`
- **Request Body**:
  ```typescript
  {
    command: string;
    session_id?: string;
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;
    message: string;
    suggestions: string[];
    results: Array<{
      action: string;
      success: boolean;
      message: string;
      stat_changes?: Record<string, number>;
      pet_state?: {
        hunger?: number;
        happiness?: number;
        health?: number;
        energy?: number;
        cleanliness?: number;
        mood?: string;
      };
    }>;
    confidence: number;
    original_command: string;
    steps_executed: number;
  }
  ```

## Examples

### Naming Only

```tsx
<PetInteractionPanel
  showNaming={true}
  showCommands={false}
  onPetNameSubmit={(name) => {
    // Handle name submission
  }}
/>
```

### Commands Only

```tsx
<PetInteractionPanel
  showNaming={false}
  showCommands={true}
/>
```

### With Initial Value

```tsx
<PetInteractionPanel
  initialPetName="Buddy"
  onPetNameSubmit={(name) => {
    // Handle name update
  }}
/>
```

### Custom API URL

```tsx
<PetInteractionPanel
  apiBaseUrl="https://api.example.com"
  onPetNameSubmit={(name) => {
    // Handle name submission
  }}
/>
```

## Styling

The component uses Tailwind CSS for styling. Make sure Tailwind is configured in your project.

### Customization

You can customize the appearance by overriding Tailwind classes. The component uses:
- Primary color: `indigo-600` (buttons, focus states)
- Success color: `green-500` (validation success)
- Error color: `red-500` (validation errors)
- Background: `white` and `gray-50` (alternating sections)

## Accessibility

The component follows WCAG 2.1 guidelines:

- ✅ **ARIA labels** on all interactive elements
- ✅ **Keyboard navigation** support
- ✅ **Focus management** - Auto-focuses input on tab change
- ✅ **Screen reader support** - Proper role attributes
- ✅ **Live regions** - Announces validation status
- ✅ **Error announcements** - Alerts for errors
- ✅ **Semantic HTML** - Proper use of form, button, input elements

## Animations

Animations are powered by Framer Motion:

- **Tab transitions** - Smooth slide animations
- **Validation feedback** - Fade in/out for messages
- **Chat messages** - Slide up animation on new messages
- **Loading states** - Spinner and bouncing dots
- **Error messages** - Slide down animation

## Error Handling

The component handles various error scenarios:

1. **Network errors** - Shows user-friendly error message
2. **Validation errors** - Displays errors from API
3. **API errors** - Shows fallback messages
4. **Empty inputs** - Prevents submission
5. **Loading states** - Disables inputs during API calls

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## TypeScript

The component is fully typed with TypeScript:

```typescript
import { PetInteractionPanel, PetInteractionPanelProps } from './components/pets/PetInteractionPanel';

const props: PetInteractionPanelProps = {
  initialPetName: 'Buddy',
  onPetNameSubmit: (name: string) => {
    console.log(name);
  },
};
```

## Development

To develop or modify this component:

1. Component file: `frontend/src/components/pets/PetInteractionPanel.tsx`
2. Example file: `frontend/src/components/pets/PetInteractionPanel.example.tsx`
3. Tests: Add tests in `frontend/src/components/pets/__tests__/`

## License

Part of the Virtual Pet Application project.

