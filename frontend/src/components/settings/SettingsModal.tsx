import { AnimatePresence, motion } from 'framer-motion';
import { X, Moon, Sun, Eye, Ear, Volume2, VolumeX } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSoundPreferences } from '../../contexts/SoundContext';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onToggleAmbientSound?: () => void;
  ambientSoundEnabled?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  onToggleAmbientSound,
  ambientSoundEnabled = true,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const { theme, toggleTheme, colorBlindMode, toggleColorBlindMode } = useTheme();
  const {
    effectsEnabled,
    ambientEnabled,
    toggleEffects,
    toggleAmbient,
    setAmbientEnabled,
  } = useSoundPreferences();

  const resolvedAmbientEnabled = typeof ambientSoundEnabled === 'boolean' ? ambientSoundEnabled : ambientEnabled;

  useEffect(() => {
    if (typeof ambientSoundEnabled === 'boolean') {
      setAmbientEnabled(ambientSoundEnabled);
    }
  }, [ambientSoundEnabled, setAmbientEnabled]);

  const handleAmbientToggle = () => {
    if (onToggleAmbientSound) {
      onToggleAmbientSound();
    } else {
      toggleAmbient();
    }
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      if (event.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            event.preventDefault();
          }
        } else if (document.activeElement === last) {
          first.focus();
          event.preventDefault();
        }
      }
    };

    const previouslyFocused = document.activeElement as HTMLElement | null;

    window.addEventListener('keydown', handleKeyDown);
    queueMicrotask(() => closeButtonRef.current?.focus());

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 18, stiffness: 220 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            aria-describedby="settings-modal-description"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="settings-modal-title" className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Personalize your space
                </h2>
                <p id="settings-modal-description" className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Tailor the dashboard look, feel, and accessibility to match how you care for your companion.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white"
                aria-label="Close settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6">
              <section aria-labelledby="appearance-heading" className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Sun className="h-5 w-5 text-amber-500 dark:hidden" aria-hidden="true" />
                  <Moon className="hidden h-5 w-5 text-indigo-400 dark:block" aria-hidden="true" />
                  <div>
                    <h3 id="appearance-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Appearance
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark themes anytime.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:border-indigo-200 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
                    aria-pressed={theme === 'dark'}
                    aria-label="Toggle dark mode"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Moon className="h-4 w-4" aria-hidden="true" /> Dark mode on
                      </>
                    ) : (
                      <>
                        <Sun className="h-4 w-4" aria-hidden="true" /> Light mode on
                      </>
                    )}
                  </button>
                </div>
              </section>

              <section aria-labelledby="accessibility-heading" className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                  <div>
                    <h3 id="accessibility-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Accessibility
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Boost color contrast with a texture overlay that works for common color vision needs.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleColorBlindMode}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:border-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                    aria-pressed={colorBlindMode}
                    aria-label="Toggle color blind friendly mode"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    {colorBlindMode ? 'Color friendly textures on' : 'Enable color friendly textures'}
                  </button>
                </div>
              </section>

              <section aria-labelledby="audio-heading" className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <Ear className="h-5 w-5 text-sky-500" aria-hidden="true" />
                  <div>
                    <h3 id="audio-heading" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                      Audio experience
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Instantly toggle reaction sounds and ambient music cues.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleEffects}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    aria-pressed={effectsEnabled}
                    aria-label={effectsEnabled ? 'Mute sound effects' : 'Enable sound effects'}
                  >
                    {effectsEnabled ? (
                      <>
                        <Volume2 className="h-4 w-4" aria-hidden="true" />
                        Sound effects on
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-4 w-4" aria-hidden="true" />
                        Sound effects muted
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleAmbientToggle}
                    className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition hover:border-sky-200 focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
                    aria-pressed={resolvedAmbientEnabled}
                    aria-label="Toggle ambient audio"
                  >
                    {resolvedAmbientEnabled ? 'Mute ambience' : 'Enable ambience'}
                  </button>
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;

