/**
 * useProfile Hook
 * Manages user profile data and updates
 */
import { useCallback, useEffect, useState } from 'react';
import { profileService } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdateInput = Database['public']['Tables']['profiles']['Update'];

export const useProfile = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfile(currentUser.uid);
      setProfile(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateProfile = useCallback(async (input: ProfileUpdateInput) => {
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    const updated = await profileService.updateProfile(currentUser.uid, input);
    setProfile(updated);
    return updated;
  }, [currentUser]);

  return {
    profile,
    loading,
    error,
    refresh,
    updateProfile,
  };
};

