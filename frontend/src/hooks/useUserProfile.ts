/**
 * useUserProfile Hook
 * 
 * Centralized hook for checking user profile and pet existence in Supabase.
 * This is the single source of truth for determining if a user has completed onboarding.
 * 
 * Returns:
 * - hasProfile: Whether user has a profile in the profiles table
 * - hasPet: Whether user has a pet in the pets table
 * - loading: Whether the check is in progress
 * - error: Any error that occurred during the check
 */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { petService } from '../services/petService';
import { profileService } from '../services/profileService';

interface UseUserProfileResult {
  hasProfile: boolean;
  hasPet: boolean;
  loading: boolean;
  error: string | null;
}

export const useUserProfile = (userId: string | null): UseUserProfileResult => {
  const [hasProfile, setHasProfile] = useState(false);
  const [hasPet, setHasPet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setHasProfile(false);
      setHasPet(false);
      setLoading(false);
      return;
    }

    const checkUserProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check for profile
        const profile = await profileService.getProfile(userId);
        setHasProfile(profile !== null);

        // Check for pet
        const pet = await petService.getPet(userId);
        setHasPet(pet !== null);
      } catch (err: any) {
        console.error('Error checking user profile:', err);
        setError(err.message || 'Failed to check user profile');
        // On error, assume user doesn't have profile/pet (safer for onboarding)
        setHasProfile(false);
        setHasPet(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserProfile();
  }, [userId]);

  return { hasProfile, hasPet, loading, error };
};

