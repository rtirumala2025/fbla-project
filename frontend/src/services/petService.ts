import type { Database } from '../types/database.types';
import { supabase, withTimeout, withRetry } from '../lib/supabase';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/networkUtils';

type Pet = Database['public']['Tables']['pets']['Row'];
type PetInsert = Database['public']['Tables']['pets']['Insert'];
type PetUpdate = Database['public']['Tables']['pets']['Update'];

export const petService = {
  /**
   * Get user's pet
   */
  async getPet(userId: string): Promise<Pet | null> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const getPetOperation = async () => {
        const query = supabase
          .from('pets')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        const { data, error } = await withTimeout(
          query as unknown as Promise<any>,
          10000,
          'Get pet'
        ) as any;

        if (error) {
          // If no pet found, return null (user needs to create one)
          if (error.code === 'PGRST116') {
            return null;
          }
          logger.error('Error fetching pet', { userId, errorCode: error.code }, error);
          throw error;
        }

        return data;
      };

      return await withRetry(getPetOperation, 3, 1000, 'Get pet');
    } catch (err: any) {
      if (err.message?.includes('timed out')) {
        logger.error('Get pet request timed out', { userId }, err);
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw err;
    }
  },

  /**
   * Create a new pet for a user
   */
  async createPet(petData: PetInsert): Promise<Pet> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
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
        logger.error('Error creating pet', { petData, errorCode: error.code }, error);
        throw new Error(getErrorMessage(error, error.message || 'Failed to create pet'));
      }

      if (!data) {
        logger.error('Create pet returned no data', { petData });
        throw new Error('Pet created but no data returned from database');
      }

      logger.info('Pet created successfully', { petId: data.id, userId: petData.user_id });
      return data;
    } catch (err: any) {
      if (err.message?.includes('timed out')) {
        logger.error('Create pet request timed out', { petData }, err);
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw err;
    }
  },

  /**
   * Update pet stats
   */
  async updatePet(petId: string, updates: PetUpdate): Promise<Pet> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    if (!petId) {
      throw new Error('Pet ID is required');
    }

    try {
      const query = supabase
        .from('pets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', petId)
        .select()
        .single();
      
      const { data, error } = await withTimeout(
        query as unknown as Promise<any>,
        10000,
        'Update pet'
      ) as any;

      if (error) {
        logger.error('Error updating pet', { petId, updates, errorCode: error.code }, error);
        throw new Error(getErrorMessage(error, error.message || 'Failed to update pet'));
      }

      if (!data) {
        logger.error('Update pet returned no data', { petId, updates });
        throw new Error('Pet update succeeded but no data returned');
      }

      return data;
    } catch (err: any) {
      if (err.message?.includes('timed out')) {
        logger.error('Update pet request timed out', { petId }, err);
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw err;
    }
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
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    if (!petId) {
      throw new Error('Pet ID is required');
    }

    try {
      const query = supabase
        .from('pets')
        .select('age')
        .eq('id', petId)
        .single();
      
      const { data: pet, error: fetchError } = await withTimeout(
        query as unknown as Promise<any>,
        10000,
        'Get pet for age increment'
      ) as any;

      if (fetchError) {
        logger.error('Error fetching pet for age increment', { petId, errorCode: fetchError.code }, fetchError);
        throw new Error('Pet not found');
      }

      if (!pet || typeof pet.age !== 'number') {
        logger.error('Invalid pet data for age increment', { petId, pet });
        throw new Error('Invalid pet data');
      }

      return await this.updatePet(petId, {
        age: pet.age + 1,
      });
    } catch (err: any) {
      if (err.message?.includes('timed out')) {
        logger.error('Increment age request timed out', { petId }, err);
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw err;
    }
  },

  /**
   * Level up pet
   */
  async levelUp(petId: string): Promise<Pet> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    if (!petId) {
      throw new Error('Pet ID is required');
    }

    try {
      const query = supabase
        .from('pets')
        .select('level')
        .eq('id', petId)
        .single();
      
      const { data: pet, error: fetchError } = await withTimeout(
        query as unknown as Promise<any>,
        10000,
        'Get pet for level up'
      ) as any;

      if (fetchError) {
        logger.error('Error fetching pet for level up', { petId, errorCode: fetchError.code }, fetchError);
        throw new Error('Pet not found');
      }

      if (!pet || typeof pet.level !== 'number') {
        logger.error('Invalid pet data for level up', { petId, pet });
        throw new Error('Invalid pet data');
      }

      return await this.updatePet(petId, {
        level: pet.level + 1,
      });
    } catch (err: any) {
      if (err.message?.includes('timed out')) {
        logger.error('Level up request timed out', { petId }, err);
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      throw err;
    }
  },
};
