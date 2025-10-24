import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Pet, PetStats } from '@/types/pet';

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
}

const PetContext = createContext<PetContextType | null>(null);

// In-memory storage for demo purposes
const STORAGE_KEY = 'virtual_pet_data';

const getStoredPet = (userId: string): Pet | null => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return null;
    
    const data = JSON.parse(storedData);
    return data[userId] || null;
  } catch (error) {
    console.error('Error reading pet data:', error);
    return null;
  }
};

const storePet = (userId: string, pet: Pet | null) => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    const data = storedData ? JSON.parse(storedData) : {};
    
    if (pet) {
      data[userId] = pet;
    } else {
      delete data[userId];
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error storing pet data:', error);
  }
};

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

  // Load pet data when userId changes
  useEffect(() => {
    const loadPet = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!userId) {
          setPet(null);
          return;
        }
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const storedPet = getStoredPet(userId);
        setPet(storedPet);
      } catch (err) {
        console.error('Error loading pet:', err);
        setError('Failed to load pet data');
      } finally {
        setLoading(false);
      }
    };
    
    loadPet();
  }, [userId]);

  const updatePetStats = useCallback(async (updates: Partial<PetStats>) => {
    if (!pet || !userId) return;
    
    try {
      const now = new Date();
      const updatedStats: PetStats = {
        ...pet.stats,
        ...updates,
        lastUpdated: now,
      };
      
      // Ensure stats stay within bounds
      Object.keys(updatedStats).forEach(key => {
        if (key === 'lastUpdated') return;
        const statKey = key as keyof PetStats;
        const value = updatedStats[statKey];
        if (typeof value === 'number') {
          if (value > 100) updatedStats[statKey] = 100 as any;
          if (value < 0) updatedStats[statKey] = 0 as any;
        }
      });
      
      const updatedPet: Pet = {
        ...pet,
        stats: updatedStats,
        updatedAt: now,
      };
      
      setPet(updatedPet);
      storePet(userId, updatedPet);
    } catch (err) {
      console.error('Error updating pet stats:', err);
      throw new Error('Failed to update pet stats');
    }
  }, [pet, userId]);
  
  const createPet = useCallback(async (name: string, type: string) => {
    if (!userId) throw new Error('User not authenticated');
    
    try {
      const now = new Date();
      const newPet: Pet = {
        id: `pet-${Date.now()}`,
        name,
        species: type as 'dog' | 'cat' | 'bird' | 'rabbit',
        breed: 'Mixed',
        age: 0,
        level: 1,
        experience: 0,
        ownerId: userId,
        createdAt: now,
        updatedAt: now,
        stats: {
          health: 100,
          hunger: 50,
          happiness: 50,
          cleanliness: 50,
          energy: 50,
          lastUpdated: now,
        },
      };
      
      setPet(newPet);
      storePet(userId, newPet);
    } catch (err) {
      console.error('Error creating pet:', err);
      throw new Error('Failed to create pet');
    }
  }, [userId]);
  
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
  };

  return (
    <PetContext.Provider value={value}>
      {!loading && children}
    </PetContext.Provider>
  );
};
