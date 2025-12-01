/**
 * Progressive Tooltip Guide Component
 * Context-sensitive tooltips that appear as user navigates
 * Dismissed steps are persisted in IndexedDB
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { indexedDBStorage, IndexedDBStorage } from '../utils/indexedDBStorage';
import { motion, AnimatePresence } from 'framer-motion';

interface Tooltip {
  /** Unique identifier for the tooltip */
  id: string;
  /** CSS selector or data attribute to target */
  target: string;
  /** Tooltip content */
  content: React.ReactNode;
  /** Tooltip title */
  title?: string;
  /** Route where this tooltip should appear */
  route?: string | string[];
  /** Placement of tooltip relative to target */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing tooltip (ms) */
  delay?: number;
  /** Show arrow pointing to target */
  showArrow?: boolean;
}

interface TooltipGuideProps {
  /** Tooltips configuration */
  tooltips?: Tooltip[];
  /** Whether tooltips are enabled */
  enabled?: boolean;
  /** Global delay before showing tooltips */
  defaultDelay?: number;
}

/**
 * Default tooltips for common app features
 * These appear contextually as users navigate
 */
const DEFAULT_TOOLTIPS: Tooltip[] = [
  {
    id: 'dashboard-pet-stats',
    target: '[data-tooltip="pet-stats"]',
    route: '/dashboard',
    title: 'Pet Stats',
    content: 'Keep an eye on these stats! They decrease over time, so check in regularly to keep your pet happy and healthy.',
    placement: 'bottom',
    delay: 1000,
  },
  {
    id: 'dashboard-feed-button',
    target: '[data-tooltip="feed-action"]',
    route: '/dashboard',
    title: 'Feed Your Pet',
    content: 'Click here to feed your pet. This will restore hunger and cost some coins.',
    placement: 'top',
    delay: 2000,
  },
  {
    id: 'shop-categories',
    target: '[data-tooltip="shop-categories"]',
    route: '/shop',
    title: 'Shop Categories',
    content: 'Browse items by category. Food restores hunger, toys increase happiness, and medicine improves health!',
    placement: 'bottom',
    delay: 1000,
  },
  {
    id: 'shop-cart',
    target: '[data-tooltip="shop-cart"]',
    route: '/shop',
    title: 'Shopping Cart',
    content: 'Items you select will appear here. Review before purchasing!',
    placement: 'left',
    delay: 1500,
  },
  {
    id: 'budget-summary',
    target: '[data-tooltip="budget-summary"]',
    route: '/budget',
    title: 'Budget Overview',
    content: 'Track your spending and earnings here. This helps you make smart financial decisions!',
    placement: 'bottom',
    delay: 1000,
  },
  {
    id: 'quest-board',
    target: '[data-tooltip="quest-board"]',
    route: '/dashboard',
    title: 'Daily Quests',
    content: 'Complete quests to earn coins and experience! Check back daily for new challenges.',
    placement: 'right',
    delay: 3000,
  },
];

export const TooltipGuide: React.FC<TooltipGuideProps> = ({
  tooltips = DEFAULT_TOOLTIPS,
  enabled = true,
  defaultDelay = 500,
}) => {
  const location = useLocation();
  const [activeTooltip, setActiveTooltip] = useState<Tooltip | null>(null);
  const [dismissedTooltips, setDismissedTooltips] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetElementRef = useRef<Element | null>(null);

  // Load dismissed tooltips from IndexedDB
  useEffect(() => {
    const loadDismissedTooltips = async () => {
      if (!IndexedDBStorage.isSupported()) {
        setIsLoading(false);
        return;
      }

      try {
        const dismissedSet = new Set<string>();
        for (const tooltip of tooltips) {
          const isDismissed = await indexedDBStorage.isTooltipDismissed(tooltip.id);
          if (isDismissed) {
            dismissedSet.add(tooltip.id);
          }
        }
        setDismissedTooltips(dismissedSet);
      } catch (error) {
        console.error('Failed to load dismissed tooltips:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDismissedTooltips();
  }, [tooltips]);

  // Check for tooltips to show when route changes
  useEffect(() => {
    if (!enabled || isLoading) return;

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Find tooltips for current route
    const routeTooltips = tooltips.filter((tooltip) => {
      if (dismissedTooltips.has(tooltip.id)) return false;

      if (!tooltip.route) return true; // Show on all routes if no route specified

      const routes = Array.isArray(tooltip.route) ? tooltip.route : [tooltip.route];
      return routes.some((route) => location.pathname.startsWith(route));
    });

    if (routeTooltips.length === 0) {
      setActiveTooltip(null);
      return;
    }

    // Show first tooltip that has a visible target
    const showNextTooltip = (index: number = 0) => {
      if (index >= routeTooltips.length) {
        setActiveTooltip(null);
        return;
      }

      const tooltip = routeTooltips[index];
      const targetElement = document.querySelector(tooltip.target);

      if (!targetElement) {
        // Target not found, try next tooltip
        showNextTooltip(index + 1);
        return;
      }

      // Check if element is visible
      const rect = targetElement.getBoundingClientRect();
      const isVisible =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth;

      if (!isVisible) {
        // Element not visible, try next tooltip
        showNextTooltip(index + 1);
        return;
      }

      // Wait for delay, then show tooltip
      const delay = tooltip.delay ?? defaultDelay;
      timeoutRef.current = setTimeout(() => {
        targetElementRef.current = targetElement;
        setActiveTooltip(tooltip);
      }, delay);
    };

    // Start showing tooltips after a brief delay
    const initialDelay = setTimeout(() => {
      showNextTooltip();
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearTimeout(initialDelay);
      setActiveTooltip(null);
      targetElementRef.current = null;
    };
  }, [location.pathname, tooltips, dismissedTooltips, enabled, isLoading, defaultDelay]);

  // Dismiss tooltip
  const dismissTooltip = useCallback(
    async (tooltipId: string, permanent: boolean = true) => {
      setActiveTooltip(null);
      targetElementRef.current = null;

      if (permanent) {
        const newDismissed = new Set(dismissedTooltips);
        newDismissed.add(tooltipId);
        setDismissedTooltips(newDismissed);

        // Save to IndexedDB
        try {
          if (IndexedDBStorage.isSupported()) {
            await indexedDBStorage.dismissTooltip(tooltipId);
          }
        } catch (error) {
          console.error('Failed to save dismissed tooltip:', error);
        }
      }
    },
    [dismissedTooltips]
  );

  // Calculate tooltip position
  const getTooltipPosition = useCallback((): React.CSSProperties => {
    if (!activeTooltip || !targetElementRef.current) {
      return {};
    }

    const targetRect = targetElementRef.current.getBoundingClientRect();
    const tooltipPlacement = activeTooltip.placement ?? 'top';
    const spacing = 12;
    let top = 0;
    let left = 0;

    switch (tooltipPlacement) {
      case 'top':
        top = targetRect.top - spacing;
        left = targetRect.left + targetRect.width / 2;
        return {
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        top = targetRect.bottom + spacing;
        left = targetRect.left + targetRect.width / 2;
        return {
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          transform: 'translate(-50%, 0)',
        };
      case 'left':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - spacing;
        return {
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + spacing;
        return {
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          transform: 'translate(0, -50%)',
        };
      default:
        return {};
    }
  }, [activeTooltip]);

  // Reset all tooltips (for testing or user reset)
  const resetAllTooltips = useCallback(async () => {
    try {
      if (indexedDBStorage.isSupported()) {
        await indexedDBStorage.resetAllTooltips();
      }
      setDismissedTooltips(new Set());
    } catch (error) {
      console.error('Failed to reset tooltips:', error);
    }
  }, []);

  if (!enabled || isLoading || !activeTooltip) {
    return null;
  }

  const position = getTooltipPosition();
  const showArrow = activeTooltip.showArrow !== false;

  return (
    <AnimatePresence>
      {activeTooltip && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed z-[9999] pointer-events-none"
          style={position}
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs pointer-events-auto">
            {/* Arrow */}
            {showArrow && (
              <div
                className={`absolute w-3 h-3 bg-white border-r border-b border-gray-200 ${
                  activeTooltip.placement === 'top'
                    ? 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45'
                    : activeTooltip.placement === 'bottom'
                    ? 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45'
                    : activeTooltip.placement === 'left'
                    ? 'right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45'
                    : 'left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45'
                }`}
              />
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              {activeTooltip.title && (
                <h4 className="text-sm font-semibold text-gray-900 mr-2">{activeTooltip.title}</h4>
              )}
              <button
                onClick={() => dismissTooltip(activeTooltip.id, true)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mt-1 -mr-1"
                aria-label="Dismiss tooltip"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="text-sm text-gray-700 mb-3">{activeTooltip.content}</div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <button
                onClick={() => dismissTooltip(activeTooltip.id, false)}
                className="hover:text-gray-700 transition-colors"
              >
                Maybe later
              </button>
              <button
                onClick={() => dismissTooltip(activeTooltip.id, true)}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-1"
              >
                Got it
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Export hook for programmatic control
export const useTooltipGuide = () => {
  const resetAllTooltips = useCallback(async () => {
    try {
      if (indexedDBStorage.isSupported()) {
        await indexedDBStorage.resetAllTooltips();
      }
    } catch (error) {
      console.error('Failed to reset tooltips:', error);
    }
  }, []);

  const resetTooltip = useCallback(async (tooltipId: string) => {
    try {
      if (indexedDBStorage.isSupported()) {
        await indexedDBStorage.resetTooltip(tooltipId);
      }
    } catch (error) {
      console.error('Failed to reset tooltip:', error);
    }
  }, []);

  return {
    resetAllTooltips,
    resetTooltip,
  };
};

export default TooltipGuide;
