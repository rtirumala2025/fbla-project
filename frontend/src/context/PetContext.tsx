import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Pet, PetStats } from '@/types/pet';
import { supabase, isSupabaseMock, withTimeout } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/networkUtils';
import { saveService } from '../services/saveService';

interface PetContextType {
  pet: Pet | null;
  updatePetStats: (updates: Partial<PetStats>) => Promise<void>;
  feed: () => Promise<void>;
  play: () => Promise<void>;
  bathe: () => Promise<void>;
  rest: () => Promise<void>;
  loading: boolean;
  error: string | null;
  updating: boolean;
  createPet: (name: string, type: string, breed?: string) => Promise<void>;
  refreshPet: () => Promise<void>;
}

const PetContext = createContext<PetContextType | null>(null);

export const usePet = () => {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error('usePet must be used within a PetProvider');
  }
  return context;
};

export const PetProvider: React.FC<{ children: React.ReactNode; userId?: string | null }> = ({ 
  children, 
  userId 
}) => {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const { refreshUserState } = useAuth();

  // Load pet data from Supabase when userId changes
  const loadPet = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!userId) {
        setPet(null);
        setLoading(false);
        return;
      }
      
      logger.debug('Loading pet for user', { userId });
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const query = supabase
        .from('pets')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      const { data, error } = await withTimeout(
        query as unknown as Promise<any>,
        10000,
        'Load pet'
      ) as any;
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found (user has no pet yet)
        logger.error('Error loading pet', { userId, errorCode: error.code }, error);
        setError(getErrorMessage(error, 'Failed to load pet data'));
      } else if (data) {
        // Validate required fields
        if (!data.id || !data.name || !data.species) {
          logger.error('Invalid pet data from database', { userId, data });
          setError('Invalid pet data received');
          setLoading(false);
          return;
        }
        
        logger.debug('Pet loaded', { userId, petId: data.id, petName: data.name });
        // Map DB fields to Pet type with null safety
        // Note: age, level, and xp are computed fields (not in DB schema)
        // birthday may not exist in the actual schema
        let age = 0;
        if (data.birthday) {
          try {
            const birthday = new Date(data.birthday);
            const today = new Date();
            age = Math.max(0, today.getFullYear() - birthday.getFullYear());
          } catch (e) {
            // birthday field doesn't exist or is invalid
            age = 0;
          }
        }
        
        const loadedPet: Pet = {
          id: data.id,
          name: data.name,
          species: data.species as 'dog' | 'cat' | 'bird' | 'rabbit',
          breed: data.breed || 'Mixed',
          age: age, // Default to 0 if birthday doesn't exist
          level: 1, // Default level (not stored in DB)
          experience: 0, // Default XP (not stored in DB)
          ownerId: data.user_id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          stats: {
            health: data.health ?? 100,
            hunger: data.hunger ?? 50,
            happiness: data.happiness ?? 50,
            cleanliness: data.cleanliness ?? 50,
            energy: data.energy ?? 50,
            lastUpdated: new Date(data.updated_at),
          },
        };
        setPet(loadedPet);
      } else {
        logger.debug('No pet found for user', { userId });
        setPet(null);
      }
    } catch (err) {
      console.error('❌ Error loading pet:', err);
      
      // Retry logic for transient errors
      const maxRetries = 3;
      let retries = 0;
      let lastError = err;
      
      while (retries < maxRetries) {
        retries++;
        const delay = 100 * Math.pow(2, retries - 1); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
          if (!userId) {
            setPet(null);
            setLoading(false);
            return;
          }
          
          // Retry fetch
          const { data, error } = await supabase
            .from('pets')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (!error && data) {
            // Success - map and set pet
            // Note: age, level, and xp are computed fields (not in DB schema)
            // birthday may not exist in the actual schema
            let age = 0;
            if (data.birthday) {
              try {
                const birthday = new Date(data.birthday);
                const today = new Date();
                age = Math.max(0, today.getFullYear() - birthday.getFullYear());
              } catch (e) {
                // birthday field doesn't exist or is invalid
                age = 0;
              }
            }
            
            const loadedPet: Pet = {
              id: data.id,
              name: data.name,
              species: data.species as 'dog' | 'cat' | 'bird' | 'rabbit',
              breed: data.breed || 'Mixed',
              age: age, // Default to 0 if birthday doesn't exist
              level: 1, // Default level (not stored in DB)
              experience: 0, // Default XP (not stored in DB)
              ownerId: data.user_id,
              createdAt: new Date(data.created_at),
              updatedAt: new Date(data.updated_at),
              stats: {
                health: data.health ?? 100,
                hunger: data.hunger ?? 50,
                happiness: data.happiness ?? 50,
                cleanliness: data.cleanliness ?? 50,
                energy: data.energy ?? 50,
                lastUpdated: new Date(data.updated_at),
              },
            };
            setPet(loadedPet);
            setError(null);
            setLoading(false);
            return; // Success, exit
          }
          
          if (error && error.code !== 'PGRST116') {
            lastError = error;
          } else {
            // No pet found - not an error
            setPet(null);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (retryErr) {
          lastError = retryErr;
        }
      }
      
      // All retries failed
      setError('Failed to load pet data after retries');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPet();
  }, [userId, loadPet]); // Include loadPet to ensure latest version is used

  // Realtime subscription for pet changes
  useEffect(() => {
    if (!userId || isSupabaseMock()) {
      return;
    }

    const channel = supabase
      .channel(`pet-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pets',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          // Reload pet data from Supabase
          await loadPet();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [userId, loadPet]);

  const updatePetStats = useCallback(async (updates: Partial<PetStats>) => {
    if (!pet || !userId) return;
    
    setUpdating(true);
    
    // Store previous state for rollback
    const previousPet = pet;
    
    try {
      const now = new Date();
      const updatedStats: PetStats = {
        ...pet.stats,
        ...updates,
        lastUpdated: now,
      };
      
      // Ensure stats stay within bounds
      updatedStats.health = Math.max(0, Math.min(100, updatedStats.health));
      updatedStats.hunger = Math.max(0, Math.min(100, updatedStats.hunger));
      updatedStats.happiness = Math.max(0, Math.min(100, updatedStats.happiness));
      updatedStats.cleanliness = Math.max(0, Math.min(100, updatedStats.cleanliness));
      updatedStats.energy = Math.max(0, Math.min(100, updatedStats.energy));
      
      // Optimistic update
      const updatedPet: Pet = {
        ...pet,
        stats: updatedStats,
        updatedAt: now,
      };
      setPet(updatedPet);
      
      // Queue save using save service (non-blocking, debounced)
      logger.debug('Queueing pet stats update', { petId: pet.id, updates });
      
      await saveService.queueSave('pet', pet.id, {
        health: updatedStats.health,
        hunger: updatedStats.hunger,
        happiness: updatedStats.happiness,
        cleanliness: updatedStats.cleanliness,
        energy: updatedStats.energy,
        updated_at: now.toISOString(),
      });
      
      logger.debug('Pet stats update queued', { petId: pet.id });
    } catch (err) {
      console.error('❌ Error updating pet stats:', err);
      // Rollback on any error
      setPet(previousPet);
      throw new Error('Failed to update pet stats');
    } finally {
      setUpdating(false);
    }
  }, [pet, userId]);
  
  const createPet = useCallback(async (name: string, type: string, breed: string = 'Mixed') => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      logger.info('Creating pet in DB', { name, type, breed, userId });
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Normalize species to valid database values
      // Valid species: dog, cat, bird, rabbit, fox, dragon, panda
      const normalizeSpecies = (species: string): string => {
        const normalized = species.toLowerCase().trim();
        const validSpecies = ['dog', 'cat', 'bird', 'rabbit', 'fox', 'dragon', 'panda'];
        
        if (validSpecies.includes(normalized)) {
          return normalized;
        }
        
        // Fallback to dog if unknown species
        logger.warn(`Unknown species "${species}", defaulting to "dog"`);
        return 'dog';
      };
      
      const normalizedSpecies = normalizeSpecies(type);
      
      // Build pet data with only fields that definitely exist in the schema
      // Based on the error, birthday doesn't exist in the actual schema
      // Only include fields that are confirmed to exist
      const petData: any = {
        user_id: userId,
        name,
        species: normalizedSpecies,
        breed: breed,
        health: 100,
        hunger: 75,
        happiness: 80,
        cleanliness: 90,
        energy: 85,
      };
      
      // Don't include birthday or color_pattern - they may not exist in the actual schema
      // The schema cache error confirms birthday doesn't exist
      
      logger.debug('Pet data to insert', petData);
      
      const query = supabase
        .from('pets')
        .insert(petData)
        .select()
        .single();
      
      const { data, error } = await withTimeout(
        query as unknown as Promise<any>,
        15000,
        'Create pet'
      ) as any;
      
      if (error) {
        logger.error('Error creating pet', { userId, name, type, errorCode: error.code, errorDetails: error }, error);
        
        // Provide more specific error messages based on error type
        let errorMessage = 'Failed to create pet';
        
        // Extract error message from Supabase error object
        const errorDetails = error.details || error.hint || error.message || '';
        const errorCode = error.code;
        
        if (errorCode === '23505') {
          // Unique constraint violation - pet already exists for this user
          errorMessage = 'You already have a pet. Each user can only have one pet.';
        } else if (errorCode === '23503') {
          // Foreign key constraint violation
          errorMessage = 'Invalid user account. Please log in again.';
        } else if (errorCode === 'PGRST116') {
          // No rows returned
          errorMessage = 'Pet creation failed: No data returned from database.';
        } else if (errorCode === '42501') {
          // Insufficient privileges (RLS policy violation)
          errorMessage = 'Permission denied. Please ensure you are logged in and try again.';
        } else if (errorDetails.includes('timeout') || errorDetails.includes('timed out')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (errorDetails.includes('network') || errorDetails.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (errorDetails) {
          errorMessage = errorDetails;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(getErrorMessage(error, errorMessage));
      }
      
      if (!data) {
        logger.error('Pet creation returned no data', { userId, name, type });
        throw new Error('Pet created but no data returned from database');
      }
      
      logger.info('Pet created in DB', { petId: data.id, userId, name });
      
      // Map created pet to Pet type
      // Note: age, level, and xp are computed fields (not in DB schema)
      // birthday may not exist in the actual schema
      let age = 0;
      if (data.birthday) {
        try {
          const birthday = new Date(data.birthday);
          const today = new Date();
          age = Math.max(0, today.getFullYear() - birthday.getFullYear());
        } catch (e) {
          // birthday field doesn't exist or is invalid
          age = 0;
        }
      }
      
      const newPet: Pet = {
        id: data.id,
        name: data.name,
        species: data.species as 'dog' | 'cat' | 'bird' | 'rabbit',
        breed: data.breed,
        age: age, // Default to 0 if birthday doesn't exist
        level: 1, // Default level (not stored in DB)
        experience: 0, // Default XP (not stored in DB)
        ownerId: data.user_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        stats: {
          health: data.health ?? 100,
          hunger: data.hunger ?? 75,
          happiness: data.happiness ?? 80,
          cleanliness: data.cleanliness ?? 90,
          energy: data.energy ?? 85,
          lastUpdated: new Date(data.updated_at),
        },
      };
      
      setPet(newPet);
      
      // Refresh auth state to update hasPet flag
      // This ensures route guards recognize the user has completed onboarding
      console.log('🔄 Refreshing auth state after pet creation...');
      try {
        await refreshUserState();
        console.log('✅ Auth state refreshed successfully');
      } catch (refreshError) {
        console.error('❌ Error refreshing auth state:', refreshError);
        // Retry once after error
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          await refreshUserState();
          console.log('✅ Auth state refreshed on retry');
        } catch (retryError) {
          console.error('❌ Auth state refresh retry also failed:', retryError);
          console.warn('⚠️ Auth state refresh failed - state may be stale');
        }
      }
    } catch (err: any) {
      console.error('❌ Error creating pet:', err);
      
      // If error is already a well-formed Error with a message, use it
      if (err instanceof Error && err.message && err.message !== 'Failed to create pet') {
        throw err;
      }
      
      // Otherwise, provide a more specific error message
      let errorMessage = 'Failed to create pet';
      
      if (err?.code === '23505') {
        errorMessage = 'You already have a pet. Each user can only have one pet.';
      } else if (err?.code === '23503') {
        errorMessage = 'Invalid user account. Please log in again.';
      } else if (err?.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err?.message?.includes('network') || err?.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      throw new Error(errorMessage);
    }
  }, [userId, refreshUserState]);
  
  const feed = useCallback(async () => {
    if (!pet) return;
    
    await updatePetStats({
      hunger: Math.min(pet.stats.hunger + 30, 100),
      energy: Math.min(pet.stats.energy + 10, 100),
    });
  }, [pet, updatePetStats]);
  
  const play = useCallback(async () => {
    if (!pet) return;
    
    await updatePetStats({
      happiness: Math.min(pet.stats.happiness + 30, 100),
      energy: Math.max(pet.stats.energy - 20, 0),
      hunger: Math.max(pet.stats.hunger - 10, 0),
    });
  }, [pet, updatePetStats]);
  
  const bathe = useCallback(async () => {
    if (!pet) return;
    
    await updatePetStats({
      cleanliness: 100,
      happiness: Math.min(pet.stats.happiness + 10, 100),
    });
  }, [pet, updatePetStats]);
  
  const rest = useCallback(async () => {
    if (!pet) return;
    
    await updatePetStats({
      energy: 100,
      hunger: Math.max(pet.stats.hunger - 10, 0),
    });
  }, [pet, updatePetStats]);

  const value = useMemo(() => ({
    pet,
    loading,
    error,
    updating,
    updatePetStats,
    feed,
    play,
    bathe,
    rest,
    createPet,
    refreshPet: loadPet,
  }), [pet, loading, error, updating, updatePetStats, feed, play, bathe, rest, createPet, loadPet]);

  return (
    <PetContext.Provider value={value}>
      {children}
    </PetContext.Provider>
  );
};
