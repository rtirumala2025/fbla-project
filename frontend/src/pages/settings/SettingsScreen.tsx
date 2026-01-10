import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useSoundPreferences } from '../../contexts/SoundContext';
import { useTheme } from '../../contexts/ThemeContext';
import { indexedDBStorage } from '../../utils/indexedDBStorage';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();
  const { effectsEnabled, ambientEnabled, setEffectsEnabled, setAmbientEnabled } = useSoundPreferences();
  const { theme, toggleTheme, colorBlindMode, toggleColorBlindMode } = useTheme();
  const [sound, setSound] = useState(true);
  const [music, setMusic] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    isDangerous: false,
  });

  // Load preferences from database on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔵 Loading user preferences for:', currentUser.uid);
        const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', currentUser.uid)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows, which is okay (first time)
          console.error('❌ Error loading preferences:', error);
        } else if (data) {
          console.log('✅ Loaded preferences:', data);
          setSound(data.sound ?? true);
          setMusic(data.music ?? true);
          setNotifications(data.notifications ?? true);
          setReducedMotion(data.reduced_motion ?? false);
          setHighContrast(data.high_contrast ?? false);
          setEffectsEnabled(data.sound ?? true);
          setAmbientEnabled(data.music ?? true);
        } else {
          console.log('📝 No preferences found, using defaults');
          setEffectsEnabled(true);
          setAmbientEnabled(true);
        }
      } catch (error) {
        console.error('❌ Failed to load preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [currentUser?.uid, setAmbientEnabled, setEffectsEnabled]);

  useEffect(() => {
    setSound(effectsEnabled);
  }, [effectsEnabled]);

  useEffect(() => {
    setMusic(ambientEnabled);
  }, [ambientEnabled]);

  // Apply high contrast mode
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  // Track if we've shown an error to avoid spam
  const hasShownSaveError = useRef(false);

  // Save preference to database
  const savePreference = async (key: string, value: boolean) => {
    if (!currentUser?.uid) return;

    try {
      console.log(`🔵 Saving preference: ${key} = ${value}`);
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: currentUser.uid,
          [key]: value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('❌ Error saving preference:', error);
        // Only show error once to avoid spam
        if (!hasShownSaveError.current) {
          toast.error('Unable to save settings. Changes are saved locally.');
          hasShownSaveError.current = true;
          // Reset after 5 seconds
          setTimeout(() => {
            hasShownSaveError.current = false;
          }, 5000);
        }
      } else {
        console.log('✅ Preference saved');
        hasShownSaveError.current = false; // Reset on success
      }
    } catch (error: any) {
      console.error('❌ Failed to save preference:', error);
      // Only show error once to avoid spam
      if (!hasShownSaveError.current) {
        toast.error('Unable to save settings. Changes are saved locally.');
        hasShownSaveError.current = true;
        setTimeout(() => {
          hasShownSaveError.current = false;
        }, 5000);
      }
    }
  };

  const exportData = async () => {
    // In real app, fetch from contexts/Supabase; here we export minimal profile
    const data = { profile: currentUser, settings: { sound, music, notifications, reducedMotion, highContrast } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'virtual-pet-export.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const resetProgress = async () => {
    if (!currentUser) return;

    setConfirmModal({
      isOpen: true,
      title: 'Reset Progress',
      message: 'Are you sure you want to reset all progress? This action cannot be undone.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await supabase.from('pets').delete().eq('user_id', currentUser.uid);
          await supabase.from('transactions').delete().eq('user_id', currentUser.uid);
          await supabase.from('profiles').update({ coins: 100 }).eq('user_id', currentUser.uid);
          toast.success('Progress reset');
        } catch (e: any) {
          toast.error(e.message || 'Failed to reset');
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen px-6 pb-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 pb-10">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="mb-4">← Back</button>
        <h1 className="text-3xl font-black text-charcoal mb-4">Settings & Help</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="ds-card p-4">
            <h2 className="text-lg font-bold mb-2">Game Settings</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sound}
                  onChange={e => {
                    const newValue = e.target.checked;
                    setSound(newValue);
                    setEffectsEnabled(newValue);
                    savePreference('sound', newValue);
                  }}
                />
                Sound effects
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={music}
                  onChange={e => {
                    const newValue = e.target.checked;
                    setMusic(newValue);
                    setAmbientEnabled(newValue);
                    savePreference('music', newValue);
                  }}
                />
                Music
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={e => {
                    const newValue = e.target.checked;
                    setNotifications(newValue);
                    savePreference('notifications', newValue);
                  }}
                />
                Notifications
              </label>
            </div>
          </div>
          <div className="ds-card p-4">
            <h2 className="text-lg font-bold mb-2">Appearance</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={theme === 'dark'}
                  onChange={() => toggleTheme()}
                />
                Dark mode
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={colorBlindMode}
                  onChange={() => toggleColorBlindMode()}
                />
                Color blind mode
              </label>
            </div>
          </div>
          <div className="ds-card p-4">
            <h2 className="text-lg font-bold mb-2">Accessibility</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={e => {
                    const newValue = e.target.checked;
                    setReducedMotion(newValue);
                    savePreference('reduced_motion', newValue);
                  }}
                />
                Reduced motion
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={e => {
                    const newValue = e.target.checked;
                    setHighContrast(newValue);
                    savePreference('high_contrast', newValue);
                  }}
                />
                High contrast
              </label>
            </div>
          </div>
          <div className="ds-card p-4">
            <h2 className="text-lg font-bold mb-2">Help & Tutorial</h2>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">Get help with the game or restart the tutorial.</p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors"
                  onClick={() => navigate('/help')}
                >
                  📖 View Help & FAQ
                </button>
                <button
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-400 transition-colors"
                  onClick={() => {
                    // Clear tutorial progress to restart
                    indexedDBStorage.clearTutorialProgress('main-onboarding-tutorial').then(() => {
                      toast.success('Tutorial will restart on your next visit to the Dashboard!');
                    }).catch(() => {
                      toast.info('Navigate to the Pet Game to see the tutorial restart button.');
                    });
                  }}
                >
                  🔄 Restart Tutorial
                </button>
              </div>
            </div>
          </div>

          <div className="ds-card p-4 border-l-4 border-yellow-400">
            <h2 className="text-lg font-bold mb-2">Competition Demo Mode</h2>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-3">
                Reset your account to a clean "Demo State" for presentation.
                <br />
                <span className="font-semibold text-red-500">Warning: This will reset your balance, pet stats, and transaction history.</span>
              </p>
              <button
                className="px-4 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-400 transition-colors shadow-sm flex items-center gap-2"
                onClick={() => {
                  if (!currentUser) return;

                  setConfirmModal({
                    isOpen: true,
                    title: 'Reset to Demo State',
                    message: 'Are you sure? This will reset your data for the demo. This action cannot be undone.',
                    isDangerous: true,
                    onConfirm: async () => {
                      toast.info('Resetting to Demo State...', 2000);
                      try {
                        // 1. Reset Wallet Balance to 150 coins
                        const { data: wallet } = await supabase
                          .from('finance_wallets')
                          .select('id')
                          .eq('user_id', currentUser.uid)
                          .single();

                        if (wallet) {
                          await supabase
                            .from('finance_wallets')
                            .update({
                              balance: 150,
                              lifetime_earned: 200,
                              lifetime_spent: 50,
                              updated_at: new Date().toISOString()
                            })
                            .eq('id', wallet.id);

                          // 2. Clear Transactions & Add Sample History
                          await supabase.from('finance_transactions').delete().eq('wallet_id', wallet.id);

                          const now = new Date();
                          const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
                          const twoDaysAgo = new Date(now); twoDaysAgo.setDate(now.getDate() - 2);

                          // Use the transactions view which has the INSTEAD OF trigger
                          await supabase.from('transactions').insert([
                            {
                              user_id: currentUser.uid,
                              amount: 200,
                              item_name: 'Initial Allowance',
                              item_id: 'demo_allowance',
                              transaction_type: 'allowance'
                            },
                            {
                              user_id: currentUser.uid,
                              amount: -15,
                              item_name: 'Pet Food Bundle',
                              item_id: 'demo_food',
                              transaction_type: 'expense'
                            },
                            {
                              user_id: currentUser.uid,
                              amount: -35,
                              item_name: 'New Toys',
                              item_id: 'demo_toys',
                              transaction_type: 'expense'
                            }
                          ]);
                        } else {
                          // Create wallet if it doesn't exist
                          await supabase.from('finance_wallets').insert({
                            user_id: currentUser.uid,
                            balance: 150,
                            lifetime_earned: 200,
                            lifetime_spent: 50
                          });
                        }

                        // 3. Reset Pet Stats to 75% using correct column names
                        await supabase
                          .from('pets')
                          .update({
                            hunger: 75,
                            happiness: 75,
                            cleanliness: 75,
                            energy: 75,
                            health: 80,
                            updated_at: new Date().toISOString()
                          })
                          .eq('user_id', currentUser.uid);

                        toast.success('Demo State Active! Balance 150 coins, Stats 75%');

                        // Force a reload to refresh everything
                        setTimeout(() => window.location.reload(), 1500);

                      } catch (error) {
                        console.error('Demo reset failed:', error);
                        toast.error('Failed to reset state.');
                      }
                    }
                  });
                }}
              >
                ✨ Reset to Demo State
              </button>
            </div>
          </div>
          <div className="ds-card p-4">
            <h2 className="text-lg font-bold mb-2">Data</h2>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={exportData}>Export Data</button>
              <button className="px-3 py-2 rounded-pet border border-red-300 text-red-700" onClick={resetProgress}>Reset Progress</button>
            </div>
          </div>

          {import.meta.env.DEV && (
            <div className="ds-card p-4 border-l-4 border-indigo-400">
              <h2 className="text-lg font-bold mb-2">Developer Tools</h2>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  Tools for testing account management.
                </p>
                <button
                  className="w-full px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors shadow-sm flex items-center justify-center gap-2"
                  onClick={() => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Clear All Data',
                      message: 'Clear ALL local data (including IndexedDB) and hard reload? This should only be used if the app is broken.',
                      isDangerous: true,
                      onConfirm: async () => {
                        toast.info('Clearing all data...');

                        // Clear Supabase auth
                        await supabase.auth.signOut();

                        // Clear Storage
                        localStorage.clear();
                        sessionStorage.clear();

                        // Clear IndexedDB
                        if (window.indexedDB) {
                          const databases = await window.indexedDB.databases();
                          databases.forEach(db => {
                            if (db.name) window.indexedDB.deleteDatabase(db.name);
                          });
                        }

                        // Redirect to login
                        window.location.href = '/login';
                      }
                    });
                  }}
                >
                  💣 Clear All Data & Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={confirmModal.isDangerous}
      />
    </div >
  );
};

export default SettingsScreen;


