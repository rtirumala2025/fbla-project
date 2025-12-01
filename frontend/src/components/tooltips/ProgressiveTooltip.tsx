/**
 * Progressive Tooltip System
 * Context-sensitive tooltips that appear as users navigate
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, HelpCircle } from 'lucide-react';
import { indexedDBStorage } from '../../utils/indexedDBStorage';

export interface TooltipConfig {
  id: string;
  target: string; // CSS selector
  title: string;
  content: React.ReactNode | string;
  route?: string | string[]; // Routes where this tooltip should appear
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  delay?: number; // Delay before showing (ms)
  priority?: number; // Higher priority tooltips show first
  showOnce?: boolean; // Only show once per session
  condition?: () => boolean | Promise<boolean>; // Conditional display
}

interface ProgressiveTooltipProps {
  tooltips: TooltipConfig[];
  enabled?: boolean;
  defaultDelay?: number;
  onDismiss?: (tooltipId: string) => void;
}

export const ProgressiveTooltip: React.FC<ProgressiveTooltipProps> = ({
  tooltips,
  enabled = true,
  defaultDelay = 1000,
  onDismiss,
}) => {
  const location = useLocation();
  const [activeTooltip, setActiveTooltip] = useState<TooltipConfig | null>(null);
  const [dismissedTooltips, setDismissedTooltips] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetElementRef = useRef<Element | null>(null);
  const positionRef = useRef<React.CSSProperties>({});

  // Load dismissed tooltips
  useEffect(() => {
    const loadDismissed = async () => {
      if (!indexedDBStorage.isSupported()) {
        setIsLoading(false);
        return;
      }

      try {
        const dismissed = new Set<string>();
        for (const tooltip of tooltips) {
          if (tooltip.showOnce) {
            const isDismissed = await indexedDBStorage.isTooltipDismissed(tooltip.id);
            if (isDismissed) {
              dismissed.add(tooltip.id);
            }
          }
        }
        setDismissedTooltips(dismissed);
      } catch (error) {
        console.error('Failed to load dismissed tooltips:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDismissed();
  }, [tooltips]);

  // Check for tooltips to show
  useEffect(() => {
    if (!enabled || isLoading) return;

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Find eligible tooltips for current route
    const eligibleTooltips = tooltips
      .filter((tooltip) => {
        // Skip if dismissed
        if (dismissedTooltips.has(tooltip.id)) return false;

        // Check route match
        if (tooltip.route) {
          const routes = Array.isArray(tooltip.route) ? tooltip.route : [tooltip.route];
          const matches = routes.some((route) => location.pathname.startsWith(route));
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0)); // Sort by priority

    if (eligibleTooltips.length === 0) {
      setActiveTooltip(null);
      return;
    }

    // Show first tooltip that has a visible target
    const showNextTooltip = async (index: number = 0) => {
      if (index >= eligibleTooltips.length) {
        setActiveTooltip(null);
        return;
      }

      const tooltip = eligibleTooltips[index];

      // Check condition if provided
      if (tooltip.condition) {
        try {
          const shouldShow = await tooltip.condition();
          if (!shouldShow) {
            showNextTooltip(index + 1);
            return;
          }
        } catch (error) {
          console.error(`Condition check failed for tooltip ${tooltip.id}:`, error);
          showNextTooltip(index + 1);
          return;
        }
      }

      // Find target element
      const targetElement = document.querySelector(tooltip.target);
      if (!targetElement) {
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
        showNextTooltip(index + 1);
        return;
      }

      // Wait for delay, then show tooltip
      const delay = tooltip.delay ?? defaultDelay;
      timeoutRef.current = setTimeout(() => {
        targetElementRef.current = targetElement;
        setActiveTooltip(tooltip);
        updatePosition(tooltip, targetElement);
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

  // Update tooltip position
  const updatePosition = useCallback((tooltip: TooltipConfig, element: Element) => {
    const rect = element.getBoundingClientRect();
    const placement = tooltip.placement || 'top';
    const spacing = 12;

    let top = 0;
    let left = 0;
    let transform = '';

    switch (placement) {
      case 'top':
        top = rect.top - spacing;
        left = rect.left + rect.width / 2;
        transform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        top = rect.bottom + spacing;
        left = rect.left + rect.width / 2;
        transform = 'translate(-50%, 0)';
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - spacing;
        transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + spacing;
        transform = 'translate(0, -50%)';
        break;
      case 'center':
        top = window.innerHeight / 2;
        left = window.innerWidth / 2;
        transform = 'translate(-50%, -50%)';
        break;
    }

    positionRef.current = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      transform,
    };
  }, []);

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
          if (indexedDBStorage.isSupported()) {
            await indexedDBStorage.dismissTooltip(tooltipId);
          }
        } catch (error) {
          console.error('Failed to save dismissed tooltip:', error);
        }
      }

      onDismiss?.(tooltipId);
    },
    [dismissedTooltips, onDismiss]
  );

  // Update position on scroll/resize
  useEffect(() => {
    if (!activeTooltip || !targetElementRef.current) return;

    const updatePos = () => {
      if (activeTooltip && targetElementRef.current) {
        updatePosition(activeTooltip, targetElementRef.current);
      }
    };

    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);

    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [activeTooltip, updatePosition]);

  if (!enabled || isLoading || !activeTooltip) {
    return null;
  }

  const placement = activeTooltip.placement || 'top';
  const showArrow = placement !== 'center';

  return (
    <>
      {/* Overlay for center placement */}
      {placement === 'center' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
        />
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {activeTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: placement === 'top' ? 10 : placement === 'bottom' ? -10 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed z-[9999] max-w-sm w-full mx-4 pointer-events-auto"
            style={positionRef.current}
          >
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Arrow */}
              {showArrow && (
                <div
                  className={`absolute w-3 h-3 bg-white border-r border-b border-gray-200 ${
                    placement === 'top'
                      ? 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45'
                      : placement === 'bottom'
                      ? 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45'
                      : placement === 'left'
                      ? 'right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45'
                      : 'left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45'
                  }`}
                />
              )}

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <h4 className="text-sm font-semibold text-gray-900">{activeTooltip.title}</h4>
                  </div>
                  <button
                    onClick={() => dismissTooltip(activeTooltip.id, true)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 -mt-1 -mr-1"
                    aria-label="Dismiss tooltip"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-sm text-gray-700 mb-3">
                  {typeof activeTooltip.content === 'string' ? (
                    <p>{activeTooltip.content}</p>
                  ) : (
                    activeTooltip.content
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => dismissTooltip(activeTooltip.id, false)}
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors px-2 py-1"
                  >
                    Maybe later
                  </button>
                  <button
                    onClick={() => dismissTooltip(activeTooltip.id, true)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                  >
                    Got it
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Highlight target element */}
      {activeTooltip && targetElementRef.current && placement !== 'center' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed z-[9997] pointer-events-none"
        >
          {(() => {
            const rect = targetElementRef.current!.getBoundingClientRect();
            return (
              <motion.div
                className="absolute border-2 border-indigo-500 rounded-lg"
                style={{
                  top: `${rect.top - 2}px`,
                  left: `${rect.left - 2}px`,
                  width: `${rect.width + 4}px`,
                  height: `${rect.height + 4}px`,
                }}
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(99,102,241,0.4)',
                    '0 0 0 4px rgba(99,102,241,0)',
                  ],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            );
          })()}
        </motion.div>
      )}
    </>
  );
};

export default ProgressiveTooltip;
