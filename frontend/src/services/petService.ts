import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Pet = Database['public']['Tables']['pets']['Row'];
type PetInsert = Database['public']['Tables']['pets']['Insert'];
type PetUpdate = Database['public']['Tables']['pets']['Update'];

export const petService = {
  /**
   * Get user's pet
   */
  async getPet(userId: string): Promise<Pet | null> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no pet found, return null (user needs to create one)
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching pet:', error);
      throw error;
    }

    return data;
  },

  /**
   * Create a new pet for a user
   */
  async createPet(petData: PetInsert): Promise<Pet> {
    const { data, error } = await supabase
      .from('pets')
      .insert(petData)
      .select()
      .single();

    if (error) {
      console.error('Error creating pet:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update pet stats
   */
  async updatePet(petId: string, updates: PetUpdate): Promise<Pet> {
    const { data, error } = await supabase
      .from('pets')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', petId)
      .select()
      .single();

    if (error) {
      console.error('Error updating pet:', error);
      throw error;
    }

    return data;
  },

  /**
   * Update pet stats atomically (with incrementing age)
   */
  async updatePetStats(
    petId: string,
    stats: {
      health?: number;
      hunger?: number;
      happiness?: number;
      cleanliness?: number;
      energy?: number;
    }
  ): Promise<Pet> {
    return await this.updatePet(petId, stats);
  },

  /**
   * Increment pet age (called daily or on specific triggers)
   */
  async incrementAge(petId: string): Promise<Pet> {
    const { data: pet } = await supabase
      .from('pets')
      .select('age')
      .eq('id', petId)
      .single();

    if (!pet) {
      throw new Error('Pet not found');
    }

    return await this.updatePet(petId, {
      age: pet.age + 1,
    });
  },

  /**
   * Level up pet
   */
  async levelUp(petId: string): Promise<Pet> {
    const { data: pet } = await supabase
      .from('pets')
      .select('level')
      .eq('id', petId)
      .single();

    if (!pet) {
      throw new Error('Pet not found');
    }

    return await this.updatePet(petId, {
      level: pet.level + 1,
    });
  },
};
