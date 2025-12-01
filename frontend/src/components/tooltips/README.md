# Progressive Tooltip System

Context-sensitive tooltips that appear as users navigate through the app.

## Usage

```tsx
import { ProgressiveTooltip } from '@/components/tooltips';
import type { TooltipConfig } from '@/components/tooltips';

const tooltips: TooltipConfig[] = [
  {
    id: 'dashboard-stats',
    target: '[data-tooltip="pet-stats"]',
    title: 'Pet Stats',
    content: 'Monitor your pet\'s health here!',
    route: '/dashboard',
    placement: 'bottom',
    delay: 1000,
  },
];

function App() {
  return (
    <>
      <YourApp />
      <ProgressiveTooltip tooltips={tooltips} enabled={true} />
    </>
  );
}
```

## Features

- Route-based tooltip display
- Priority system for multiple tooltips
- Conditional display support
- IndexedDB persistence (show once option)
- Smooth animations
- Visual element highlighting

## Data Attributes

Add `data-tooltip="unique-id"` to elements you want to target.
