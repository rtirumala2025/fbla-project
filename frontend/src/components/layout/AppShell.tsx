import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  Command,
  Menu,
  Search,
  Settings2,
  Volume2,
  VolumeX,
  WifiOff,
  Wifi,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSoundPreferences } from '../../contexts/SoundContext';
import { primaryNav, secondaryNav } from '../../config/appNavigation';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import SettingsModal from '../settings/SettingsModal';

interface AppShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  ambientSoundEnabled?: boolean;
  onToggleAmbientSound?: () => void;
}

const linkBaseStyles =
  'group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:ring-offset-slate-900';

export const AppShell: React.FC<AppShellProps> = ({
  title,
  subtitle,
  actions,
  children,
  ambientSoundEnabled,
  onToggleAmbientSound,
}) => {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const { effectsEnabled, toggleEffects } = useSoundPreferences();
  const { offline, lastSyncedAt } = useOfflineStatus();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : false));
  const [isDesktop, setIsDesktop] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth >= 1024 : false));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();

  const formattedSyncTime = useMemo(() => {
    if (!lastSyncedAt) return null;
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(lastSyncedAt);
  }, [lastSyncedAt]);

  const navItems = useMemo(() => [...primaryNav, ...secondaryNav], []);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative flex min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && !isDesktop && (
          <motion.div
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white/95 px-4 py-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 lg:static lg:translate-x-0"
        initial={{ x: -320 }}
        animate={{ x: isDesktop || sidebarOpen ? 0 : -320 }}
        transition={{ type: 'spring', damping: 20, stiffness: 180 }}
        aria-label="Primary navigation"
      >
        <div className="flex items-center justify-between px-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Companion OS</p>
            <h1 className="text-lg font-black text-slate-900 dark:text-white">Pet Command Center</h1>
          </div>
          <button
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 flex-1 space-y-6 overflow-y-auto pb-6">
          <div>
            <p className="px-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Care</p>
            <ul className="mt-3 space-y-2">
              {primaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `${linkBaseStyles} ${
                          isActive
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 ring-offset-slate-100 dark:ring-offset-slate-900'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                        }`
                      }
                      aria-label={item.ariaLabel ?? item.label}
                      onClick={() => {
                        if (!isDesktop) setSidebarOpen(false);
                      }}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100 group-hover:text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200 dark:group-hover:bg-indigo-500/20">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="px-2 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Insights & extras
            </p>
            <ul className="mt-3 space-y-2">
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `${linkBaseStyles} ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 ring-offset-slate-100 dark:bg-slate-700 dark:ring-offset-slate-900'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                        }`
                      }
                      aria-label={item.ariaLabel ?? item.label}
                      onClick={() => {
                        if (!isDesktop) setSidebarOpen(false);
                      }}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-slate-200 group-hover:text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="mt-auto rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-800 shadow-inner dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
          <p className="font-semibold">Signed in as</p>
          <p className="truncate text-xs text-indigo-600/80 dark:text-indigo-200/70">{currentUser?.email}</p>
          <p className="mt-2 text-xs text-indigo-500/80">
            Theme: <span className="font-semibold capitalize">{theme}</span>
          </p>
        </div>
      </motion.aside>

      {/* Content area */}
      <div className="relative flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 lg:hidden dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
              aria-label="Toggle navigation"
              aria-expanded={sidebarOpen}
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <span className="text-sm font-semibold text-slate-400">Now viewing</span>
              <div className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                {navItems.find((item) => item.to === location.pathname)?.label ?? title}
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="relative hidden max-w-sm flex-1 sm:flex">
              <label htmlFor="dashboard-search" className="sr-only">
                Search dashboard
              </label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="dashboard-search"
                type="search"
                placeholder="Find activities, stats, or tips"
                className="h-10 w-full rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div
              className={`hidden items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold sm:flex ${
                offline
                  ? 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
              }`}
              role="status"
              aria-live="polite"
            >
              {offline ? <WifiOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Wifi className="h-3.5 w-3.5" aria-hidden="true" />}
              {offline ? 'Offline mode' : 'Synced'}
              {!offline && formattedSyncTime && <span className="text-emerald-500/80">• {formattedSyncTime}</span>}
            </div>

            <button
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
              onClick={toggleEffects}
              aria-label={effectsEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
              aria-pressed={effectsEnabled}
            >
              {effectsEnabled ? <Volume2 className="h-5 w-5" aria-hidden="true" /> : <VolumeX className="h-5 w-5" aria-hidden="true" />}
            </button>

            <button
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5" />
            </button>

            <button
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open quick settings"
            >
              <Settings2 className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main
          className="relative flex-1 overflow-y-auto px-6 pb-16 pt-10"
          id="main-dashboard-content"
          tabIndex={-1}
          aria-labelledby="dashboard-heading"
        >
          <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Dashboard</p>
              <h2 id="dashboard-heading" className="text-3xl font-black text-slate-900 dark:text-white">
                {title}
              </h2>
              {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          </div>

          {children}
        </main>

        <div className="pointer-events-none absolute bottom-6 right-6 hidden items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-500 shadow backdrop-blur sm:flex dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
          <Command className="h-3.5 w-3.5" aria-hidden="true" />
          Shift + /
          <span aria-hidden="true">to view shortcuts</span>
        </div>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        ambientSoundEnabled={ambientSoundEnabled}
        onToggleAmbientSound={onToggleAmbientSound}
      />
    </div>
  );
};

export default AppShell;

