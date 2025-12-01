import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useSoundPreferences } from '../../contexts/SoundContext';
import { useTheme } from '../../contexts/ThemeContext';

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
    if (!window.confirm('Are you sure you want to reset all progress?')) return;
    // Example: delete pet and transactions; keep profile with starting coins
    try {
      await supabase.from('pets').delete().eq('user_id', currentUser.uid);
      await supabase.from('transactions').delete().eq('user_id', currentUser.uid);
      await supabase.from('profiles').update({ coins: 100 }).eq('user_id', currentUser.uid);
      toast.success('Progress reset');
    } catch (e: any) {
      toast.error(e.message || 'Failed to reset');
    }
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
            <h2 className="text-lg font-bold mb-2">Data</h2>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={exportData}>Export Data</button>
              <button className="px-3 py-2 rounded-pet border border-red-300 text-red-700" onClick={resetProgress}>Reset Progress</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;


