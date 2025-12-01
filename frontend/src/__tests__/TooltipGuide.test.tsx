/**
 * Tests for TooltipGuide component
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import TooltipGuide from '../components/TooltipGuide';
import { indexedDBStorage } from '../utils/indexedDBStorage';

// Mock IndexedDB
jest.mock('../utils/indexedDBStorage', () => {
  const mockStorage: any = {
    isTooltipDismissed: jest.fn().mockResolvedValue(false),
    dismissTooltip: jest.fn().mockResolvedValue(undefined),
    resetTooltip: jest.fn().mockResolvedValue(undefined),
    resetAllTooltips: jest.fn().mockResolvedValue(undefined),
    isSupported: jest.fn().mockReturnValue(true),
  };
  return {
    indexedDBStorage: mockStorage,
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockTooltips = [
  {
    id: 'test-tooltip-1',
    target: '[data-tooltip="test-element"]',
    route: '/dashboard',
    title: 'Test Tooltip 1',
    content: 'This is test tooltip content',
    placement: 'top' as const,
    delay: 100,
  },
  {
    id: 'test-tooltip-2',
    target: '[data-tooltip="test-element-2"]',
    route: '/shop',
    title: 'Test Tooltip 2',
    content: 'This is another test tooltip',
    placement: 'bottom' as const,
    delay: 100,
  },
];

const renderComponent = (route = '/dashboard', props = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <div>
        <div data-tooltip="test-element">Test Element</div>
        <TooltipGuide tooltips={mockTooltips} {...props} />
      </div>
    </MemoryRouter>
  );
};

describe('TooltipGuide', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.queryByText('Test Tooltip 1')).not.toBeInTheDocument();
  });

  it('loads dismissed tooltips from IndexedDB', async () => {
    renderComponent();

    await waitFor(() => {
      expect(indexedDBStorage.isTooltipDismissed).toHaveBeenCalledWith('test-tooltip-1');
      expect(indexedDBStorage.isTooltipDismissed).toHaveBeenCalledWith('test-tooltip-2');
    });
  });

  it('shows tooltip for current route after delay', async () => {
    renderComponent('/dashboard');

    // Fast-forward timers
    jest.advanceTimersByTime(600);

    await waitFor(() => {
      expect(screen.getByText('Test Tooltip 1')).toBeInTheDocument();
    });
  });

  it('does not show tooltip for different route', () => {
    renderComponent('/profile');

    jest.advanceTimersByTime(600);

    expect(screen.queryByText('Test Tooltip 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Tooltip 2')).not.toBeInTheDocument();
  });

  it('does not show dismissed tooltips', async () => {
    (indexedDBStorage.isTooltipDismissed as jest.Mock).mockResolvedValue(true);
    renderComponent('/dashboard');

    jest.advanceTimersByTime(600);

    await waitFor(() => {
      expect(screen.queryByText('Test Tooltip 1')).not.toBeInTheDocument();
    });
  });

  it('dismisses tooltip when close button is clicked', async () => {
    renderComponent('/dashboard');

    jest.advanceTimersByTime(600);

    await waitFor(() => {
      expect(screen.getByText('Test Tooltip 1')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('Dismiss tooltip');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Test Tooltip 1')).not.toBeInTheDocument();
      expect(indexedDBStorage.dismissTooltip).toHaveBeenCalledWith('test-tooltip-1');
    });
  });

  it('dismisses tooltip when "Got it" is clicked', async () => {
    renderComponent('/dashboard');

    jest.advanceTimersByTime(600);

    await waitFor(() => {
      expect(screen.getByText('Test Tooltip 1')).toBeInTheDocument();
    });

    const gotItButton = screen.getByText('Got it');
    fireEvent.click(gotItButton);

    await waitFor(() => {
      expect(screen.queryByText('Test Tooltip 1')).not.toBeInTheDocument();
      expect(indexedDBStorage.dismissTooltip).toHaveBeenCalledWith('test-tooltip-1');
    });
  });

  it('temporarily dismisses tooltip when "Maybe later" is clicked', async () => {
    renderComponent('/dashboard');

    jest.advanceTimersByTime(600);

    await waitFor(() => {
      expect(screen.getByText('Test Tooltip 1')).toBeInTheDocument();
    });

    const maybeLaterButton = screen.getByText('Maybe later');
    fireEvent.click(maybeLaterButton);

    await waitFor(() => {
      expect(screen.queryByText('Test Tooltip 1')).not.toBeInTheDocument();
      expect(indexedDBStorage.dismissTooltip).not.toHaveBeenCalled();
    });
  });

  it('does not show tooltip if target element is not found', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <div>
          {/* Element not present */}
          <TooltipGuide tooltips={mockTooltips} />
        </div>
      </MemoryRouter>
    );

    jest.advanceTimersByTime(600);

    expect(screen.queryByText('Test Tooltip 1')).not.toBeInTheDocument();
  });

  it('does not show tooltip if disabled', () => {
    renderComponent('/dashboard', { enabled: false });

    jest.advanceTimersByTime(600);

    expect(screen.queryByText('Test Tooltip 1')).not.toBeInTheDocument();
  });

  it('handles IndexedDB not supported gracefully', () => {
    (indexedDBStorage.isSupported as jest.Mock).mockReturnValue(false);
    renderComponent('/dashboard');

    // Should still render without errors
    expect(screen.queryByText('Test Tooltip 1')).not.toBeInTheDocument();
  });

  it('updates tooltip when route changes', async () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <div>
          <div data-tooltip="test-element">Test Element</div>
          <div data-tooltip="test-element-2">Test Element 2</div>
          <TooltipGuide tooltips={mockTooltips} />
        </div>
      </MemoryRouter>
    );

    jest.advanceTimersByTime(600);

    await waitFor(() => {
      expect(screen.getByText('Test Tooltip 1')).toBeInTheDocument();
    });

    // Change route
    rerender(
      <MemoryRouter initialEntries={['/shop']}>
        <div>
          <div data-tooltip="test-element">Test Element</div>
          <div data-tooltip="test-element-2">Test Element 2</div>
          <TooltipGuide tooltips={mockTooltips} />
        </div>
      </MemoryRouter>
    );

    jest.advanceTimersByTime(600);

    await waitFor(() => {
      expect(screen.queryByText('Test Tooltip 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test Tooltip 2')).toBeInTheDocument();
    });
  });
});
