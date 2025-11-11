import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Pet, PetSpecies, PetStats } from '@/types/pet';
import { supabase, isSupabaseMock } from '../lib/supabase';

interface PetContextType {
  pet: Pet | null;
  updatePetStats: (updates: Partial<PetStats>) => Promise<void>;
  feed: () => Promise<void>;
  play: () => Promise<void>;
  bathe: () => Promise<void>;
  rest: () => Promise<void>;
  loading: boolean;
  error: string | null;
  createPet: (name: string, type: string) => Promise<void>;
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
  const usingMock = isSupabaseMock();

  const buildDemoPet = useCallback((): Pet => {
    const now = new Date();
    return {
      id: 'demo-pet',
      ownerId: userId ?? 'demo-user',
      name: 'Nova',
      species: 'fox',
      breed: 'Arctic',
      age: 2,
      level: 7,
      experience: 1450,
      color_pattern: 'snowfall',
      birthday: now.toISOString(),
      stats: {
        health: 92,
        hunger: 48,
        happiness: 88,
        cleanliness: 76,
        energy: 67,
        hygiene: 72,
        mood: 'playful',
        level: 7,
        xp: 1450,
        is_sick: false,
        lastUpdated: now,
      },
      createdAt: now,
      updatedAt: now,
      diary: [
        {
          id: 'demo-entry-1',
          mood: 'excited',
          note: 'Nova mastered a new trick and earned bonus XP!',
          created_at: now.toISOString(),
        },
      ],
      seasonal_state: null,
    };
  }, [userId]);

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

        if (usingMock) {
          const demoPet = buildDemoPet();
          setPet(demoPet);
          setLoading(false);
          return;
        }
        
      console.log('🔵 Loading pet for user:', userId);
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found (user has no pet yet)
        console.error('❌ Error loading pet:', error);
        setError('Failed to load pet data');
      } else if (data) {
        console.log('✅ Pet loaded:', data.name);
        // Map DB fields to Pet type
        const loadedPet: Pet = {
          id: data.id,
          ownerId: data.user_id,
          name: data.name,
          species: data.species as PetSpecies,
          breed: data.breed || 'Mixed',
          color_pattern: data.color_pattern,
          birthday: data.birthday,
          age: data.age ?? 0,
          level: data.level ?? 1,
          experience: data.xp ?? 0,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at ?? data.created_at),
          stats: {
            health: data.health ?? 100,
            hunger: data.hunger ?? 50,
            happiness: data.happiness ?? 50,
            cleanliness: data.cleanliness ?? 60,
            energy: data.energy ?? 50,
            lastUpdated: data.updated_at ? new Date(data.updated_at) : new Date(data.created_at),
            hygiene: data.cleanliness ?? 60,
            mood: data.happiness && data.hunger ? (data.happiness > 70 && data.hunger < 40 ? 'playful' : 'calm') : undefined,
            level: data.level ?? 1,
            xp: data.xp ?? 0,
            is_sick: (data.health ?? 0) < 40,
          },
          diary: [],
        };
        setPet(loadedPet);
      } else {
        console.log('📝 No pet found for user');
        setPet(null);
      }
      } catch (err) {
      console.error('❌ Error loading pet:', err);
        setError('Failed to load pet data');
      } finally {
        setLoading(false);
      }
  }, [userId, usingMock, buildDemoPet]);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  useEffect(() => {
    if (!userId || isSupabaseMock()) {
      return;
    }
    const channel = supabase
      .channel(`public:pets:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pets',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void loadPet();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadPet]);

  const updatePetStats = useCallback(async (updates: Partial<PetStats>) => {
    if (!pet || !userId) return;
    
    try {
      const now = new Date();
      const updatedStats: PetStats = {
        ...pet.stats,
        ...updates,
        lastUpdated: now,
      };
      
      (['health', 'hunger', 'happiness', 'cleanliness', 'energy'] as const).forEach((key) => {
        const currentValue = updatedStats[key];
        if (typeof currentValue === 'number') {
          const clamped = Math.min(100, Math.max(0, currentValue));
          updatedStats[key] = clamped;
        }
      });
      
      // Optimistic update
      const updatedPet: Pet = {
        ...pet,
        stats: updatedStats,
        updatedAt: now,
      };
      setPet(updatedPet);

      if (usingMock) {
        return;
      }
      
      // Persist to database
      console.log('🔵 PetContext: Updating pet stats in DB', {
        petId: pet.id,
        updates,
        newStats: {
          health: updatedStats.health,
          hunger: updatedStats.hunger,
          happiness: updatedStats.happiness,
          cleanliness: updatedStats.cleanliness,
          energy: updatedStats.energy,
        }
      });
      const { error } = await supabase
        .from('pets')
        .update({
          health: updatedStats.health,
          hunger: updatedStats.hunger,
          happiness: updatedStats.happiness,
          cleanliness: updatedStats.cleanliness,
          energy: updatedStats.energy,
          updated_at: now.toISOString(),
        })
        .eq('id', pet.id)
        .eq('user_id', userId);
      
      if (error) {
        console.error('❌ PetContext: Error updating pet stats:', error);
        console.error('Error details:', { code: error.code, message: error.message, details: error.details });
        throw new Error(`Failed to update pet stats: ${error.message}`);
      } else {
        console.log('✅ PetContext: Pet stats updated in DB successfully');
      }
    } catch (err: any) {
      console.error('❌ PetContext: Error updating pet stats:', err);
      console.error('Error details:', { message: err.message, stack: err.stack });
      // Reload pet to revert optimistic update
      console.log('🔄 PetContext: Reloading pet to revert optimistic update');
      await loadPet();
      throw new Error(`Failed to update pet stats: ${err.message || 'Unknown error'}`);
    }
  }, [pet, userId, loadPet, usingMock]);
  
  const createPet = useCallback(async (name: string, type: string) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      console.log('🔵 Creating pet in DB:', { name, type, userId });
      const now = new Date();

      if (usingMock) {
        const baseDemoPet = buildDemoPet();
        const demoPet = {
          ...baseDemoPet,
          name,
          species: type as PetSpecies,
          stats: {
            ...baseDemoPet.stats,
            happiness: 85,
            energy: 80,
          },
          updatedAt: now,
        };
        setPet(demoPet);
        return;
      }
      
      const { data, error } = await supabase
        .from('pets')
        .insert({
          user_id: userId,
          name,
          species: type,
          breed: 'Mixed',
          color_pattern: null,
          birthday: null,
          age: 0,
          level: 1,
          health: 100,
          hunger: 75,
          happiness: 80,
          cleanliness: 90,
          energy: 85,
          xp: 0,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error creating pet:', error);
        throw new Error(error.message || 'Failed to create pet');
      }
      
      console.log('✅ Pet created in DB:', data);
      
      // Map created pet to Pet type
      const newPet: Pet = {
        id: data.id,
        name: data.name,
        species: data.species as 'dog' | 'cat' | 'bird' | 'rabbit',
        breed: data.breed,
        age: data.age,
        level: data.level,
        experience: data.xp,
        ownerId: data.user_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        stats: {
          health: data.health,
          hunger: data.hunger,
          happiness: data.happiness,
          cleanliness: data.cleanliness,
          energy: data.energy,
          lastUpdated: new Date(data.updated_at),
        },
      };
      
      setPet(newPet);
    } catch (err: any) {
      console.error('❌ Error creating pet:', err);
      throw new Error(err.message || 'Failed to create pet');
    }
  }, [userId, buildDemoPet, usingMock]);
  
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

  const value = {
    pet,
    loading,
    error,
    updatePetStats,
    feed,
    play,
    bathe,
    rest,
    createPet,
    refreshPet: loadPet,
  };

  return (
    <PetContext.Provider value={value}>
      {children}
    </PetContext.Provider>
  );
};
