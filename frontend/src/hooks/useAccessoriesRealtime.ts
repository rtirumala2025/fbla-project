/**
 * useAccessoriesRealtime Hook
 * Subscribes to Supabase realtime changes for user_accessories table
 * Provides real-time updates when accessories are equipped/unequipped
 */
import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { isSupabaseMock, supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import type { AccessoryEquipResponse } from '../types/accessories';

export type AccessoriesRefreshFn = (accessories: AccessoryEquipResponse[]) => void;

/**
 * Subscribe to Supabase realtime changes for the pet's accessories.
 * On any change, the provided callback is invoked with the updated accessories list.
 */
export const useAccessoriesRealtime = (
  petId: string | null,
  callback: AccessoriesRefreshFn
): void => {
  const callbackRef = useRef(callback);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!petId || isSupabaseMock()) {
      return;
    }

    let isActive = true;
    let channel: RealtimeChannel | null = null;

    const setupRealtime = async () => {
      try {
        // Get initial data
        const { data: initialData, error: initialError } = await supabase
          .from('user_accessories')
          .select('*')
          .eq('pet_id', petId);

        if (initialError) {
          return;
        }

        if (initialData && isActive) {
          const accessories: AccessoryEquipResponse[] = initialData.map((item) => ({
            accessory_id: item.accessory_id,
            pet_id: item.pet_id,
            equipped: item.equipped,
            equipped_color: item.equipped_color,
            equipped_slot: item.equipped_slot,
            applied_mood: item.applied_mood || 'happy',
            updated_at: item.updated_at,
          }));
          callbackRef.current(accessories);
        }

        // Setup realtime subscription
        channel = supabase.channel(`accessories-realtime-${petId}`);

        channel
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_accessories',
              filter: `pet_id=eq.${petId}`,
            },
            async (payload) => {
              if (!isActive) return;

              try {
                logger.debug('Accessories realtime change detected', {
                  petId,
                  event: payload.eventType,
                });

                // Fetch updated accessories
                const { data, error } = await supabase
                  .from('user_accessories')
                  .select('*')
                  .eq('pet_id', petId);

                if (error) {
                  logger.error('Failed to fetch updated accessories', { petId, errorCode: error.code }, error);
                  return;
                }

                if (data && isActive) {
                  const accessories: AccessoryEquipResponse[] = data.map((item) => ({
                    accessory_id: item.accessory_id,
                    pet_id: item.pet_id,
                    equipped: item.equipped,
                    equipped_color: item.equipped_color,
                    equipped_slot: item.equipped_slot,
                    applied_mood: item.applied_mood || 'happy',
                    updated_at: item.updated_at,
                  }));
                  callbackRef.current(accessories);
                  logger.debug('Accessories updated via realtime', {
                    petId,
                    count: accessories.length,
                  });
                }
              } catch (error) {
                logger.error('Error in accessories realtime callback', { petId }, error instanceof Error ? error : new Error(String(error)));
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              logger.info('Subscribed to accessories realtime channel', {
                petId,
                channel: `accessories-realtime-${petId}`,
              });
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              logger.error('Accessories realtime channel error', { petId, status });
              // Attempt to resubscribe after delay
              setTimeout(() => {
                if (isActive && channelRef.current) {
                  logger.info('Attempting to resubscribe to accessories realtime', { petId });
                  setupRealtime();
                }
              }, 5000);
            }
          });

        channelRef.current = channel;
      } catch (error) {
        // Setup error - continue silently
      }
    };

    setupRealtime();

    return () => {
      isActive = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [petId]);
};

export default useAccessoriesRealtime;
