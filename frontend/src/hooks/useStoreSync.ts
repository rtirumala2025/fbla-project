/**
 * Hook to sync Zustand store with database
 * Ensures pet, profile, quests, and inventory stay in sync
 */
import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { usePet } from '../context/PetContext';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { fetchActiveQuests } from '../api/quests';

export function useStoreSync() {
  const { currentUser } = useAuth();
  const { pet, loading: petLoading } = usePet();
  const {
    setPet,
    setCoins,
    setXP,
    setProfileId,
    setActiveQuests,
    setPetLoading,
    setProfileLoading,
    setQuestsLoading,
  } = useAppStore();

  // Sync pet state
  useEffect(() => {
    if (pet) {
      setPet(pet);
    } else if (!petLoading) {
      setPet(null);
    }
  }, [pet, petLoading, setPet]);

  // Sync profile/coins state
  const syncProfile = useCallback(async () => {
    if (!currentUser?.uid) {
      setCoins(0);
      setXP(0);
      setProfileId(null);
      return;
    }

    setProfileLoading(true);
    try {
      const profile = await profileService.getProfile(currentUser.uid, false);
      if (profile) {
        setCoins(profile.coins || 0);
        // XP is stored on the pet, not the profile
        // We'll get it from the pet store if available
        setXP(0); // Default to 0, will be updated from pet state
        setProfileId(profile.id);
      }
    } catch (error) {
      console.error('Failed to sync profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [currentUser?.uid, setCoins, setXP, setProfileId, setProfileLoading]);

  // Sync quests
  const syncQuests = useCallback(async () => {
    if (!currentUser?.uid) return;

    setQuestsLoading(true);
    try {
      const quests = await fetchActiveQuests();
      setActiveQuests({
        daily: quests.daily,
        weekly: quests.weekly,
        event: quests.event,
      });
    } catch (error) {
      console.error('Failed to sync quests:', error);
    } finally {
      setQuestsLoading(false);
    }
  }, [currentUser?.uid, setActiveQuests, setQuestsLoading]);

  // Initial sync on mount
  useEffect(() => {
    syncProfile();
    syncQuests();
  }, [syncProfile, syncQuests]);

  // Periodic sync (every 30 seconds)
  useEffect(() => {
    if (!currentUser?.uid) return;

    const interval = setInterval(() => {
      syncProfile();
      syncQuests();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser?.uid, syncProfile, syncQuests]);

  return {
    syncProfile,
    syncQuests,
  };
}
