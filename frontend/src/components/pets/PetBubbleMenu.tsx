import { AnimatePresence, motion } from 'framer-motion';
import { Command } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

export interface PetBubbleAction {
  id: string;
  label: string;
  description: string;
  shortcut: string;
  icon: React.ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  busy?: boolean;
}

interface PetBubbleMenuProps {
  actions: PetBubbleAction[];
  onToggleHelp?: () => void;
}

export const PetBubbleMenu: React.FC<PetBubbleMenuProps> = ({ actions, onToggleHelp }) => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [keyboardHintVisible, setKeyboardHintVisible] = useState(true);

  const shortcutMap = useMemo(() => {
    return actions.reduce<Record<string, PetBubbleAction>>((acc, action) => {
      acc[action.shortcut.toLowerCase()] = action;
      return acc;
    }, {});
  }, [actions]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;

      const key = event.key.toLowerCase();
      const normalized = event.shiftKey ? `shift+${key}` : key;

      if (normalized === '?' || (event.shiftKey && key === '/')) {
        event.preventDefault();
        setShowShortcuts((prev) => !prev);
        onToggleHelp?.();
        return;
      }

      const action = shortcutMap[normalized];
      if (action && !action.disabled) {
        event.preventDefault();
        action.onSelect();
        setKeyboardHintVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcutMap, onToggleHelp]);

  useEffect(() => {
    if (!keyboardHintVisible) return;
    const timer = window.setTimeout(() => setKeyboardHintVisible(false), 6000);
    return () => window.clearTimeout(timer);
  }, [keyboardHintVisible]);

  return (
    <div className="relative">
      <nav
        aria-label="Pet care quick actions"
        className="flex flex-wrap justify-center gap-3 rounded-full border border-slate-200 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80"
      >
        {actions.map((action) => (
          <motion.button
            key={action.id}
            onClick={() => {
              if (!action.disabled) {
                action.onSelect();
                setKeyboardHintVisible(false);
              }
            }}
            className={`group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
              action.disabled
                ? 'cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-200 dark:hover:bg-indigo-500/20'
            }`}
            type="button"
            disabled={action.disabled}
            aria-disabled={action.disabled}
            aria-busy={action.busy}
            aria-label={`${action.label}${action.disabled ? ' (unavailable)' : ''}`}
            aria-keyshortcuts={action.shortcut}
            whileTap={{ scale: action.disabled ? 1 : 0.97 }}
          >
            <span aria-hidden="true" className="text-base leading-none">
              {action.icon}
            </span>
            <span className="leading-none">{action.label}</span>

            <span
              className="inline-flex items-center gap-1 rounded-full border border-indigo-100 bg-white/90 px-2 py-0.5 text-xs font-medium text-indigo-600 shadow-sm dark:border-indigo-500/30 dark:bg-slate-950/40 dark:text-indigo-200"
              aria-hidden="true"
            >
              <Command className="h-3 w-3" />
              {action.shortcut.replace('Shift+', '⇧')}
            </span>

            <span className="sr-only">{action.description}</span>
          </motion.button>
        ))}
        <button
          type="button"
          onClick={() => setShowShortcuts((prev) => !prev)}
          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500"
          aria-expanded={showShortcuts}
          aria-controls="pet-action-shortcuts"
        >
          <span aria-hidden="true">?</span>
          <span className="sr-only">Toggle keyboard shortcut help</span>
        </button>
      </nav>

      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            id="pet-action-shortcuts"
            className="absolute left-1/2 z-20 mt-4 w-max -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-2xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            role="status"
            aria-live="polite"
          >
            <p className="mb-2 font-semibold text-slate-800 dark:text-slate-100">Keyboard navigation</p>
            <ul className="space-y-1">
              {actions.map((action) => (
                <li key={action.id} className="flex items-center gap-2">
                  <span className="inline-flex min-w-[3rem] justify-center rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {action.shortcut.replace('Shift+', '⇧')}
                  </span>
                  <span>{action.label}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {keyboardHintVisible && (
          <motion.div
            className="absolute -top-12 left-1/2 w-max -translate-x-1/2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            role="status"
            aria-live="polite"
          >
            Tip: Press ⇧ + / to view shortcuts
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PetBubbleMenu;

