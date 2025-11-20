/**
 * useAccessoriesRealtime Hook
 * Subscribes to Supabase realtime changes for user_accessories table
 * Provides real-time updates when accessories are equipped/unequipped
 */
import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { isSupabaseMock, supabase } from '../lib/supabase';
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
      console.log('⚠️ useAccessoriesRealtime: Skipping realtime (no petId or mock mode)');
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
          console.error('❌ useAccessoriesRealtime: Failed to load initial accessories', initialError);
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
          console.log('✅ useAccessoriesRealtime: Initial accessories loaded', {
            petId,
            count: accessories.length,
          });
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

              console.log('🔄 useAccessoriesRealtime: Change detected', {
                event: payload.eventType,
                payload: payload.new || payload.old,
              });

              // Fetch updated accessories
              const { data, error } = await supabase
                .from('user_accessories')
                .select('*')
                .eq('pet_id', petId);

              if (error) {
                console.error('❌ useAccessoriesRealtime: Failed to fetch updated accessories', error);
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
                console.log('✅ useAccessoriesRealtime: Accessories updated via realtime', {
                  petId,
                  count: accessories.length,
                });
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ useAccessoriesRealtime: Subscribed to realtime channel', {
                petId,
                channel: `accessories-realtime-${petId}`,
              });
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ useAccessoriesRealtime: Channel error');
            }
          });

        channelRef.current = channel;
      } catch (error) {
        console.error('❌ useAccessoriesRealtime: Setup error', error);
      }
    };

    setupRealtime();

    return () => {
      isActive = false;
      if (channelRef.current) {
        console.log('🔵 useAccessoriesRealtime: Unsubscribing from realtime', { petId });
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [petId]);
};

export default useAccessoriesRealtime;
