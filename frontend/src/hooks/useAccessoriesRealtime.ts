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
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isSettingUpRef = useRef(false);
  const fetchInFlightRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const pendingFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const cleanup = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pendingFetchRef.current) {
        clearTimeout(pendingFetchRef.current);
        pendingFetchRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
      isSettingUpRef.current = false;
      fetchInFlightRef.current = false;
      reconnectAttemptRef.current = 0;
    };

    const fetchAccessories = async () => {
      if (!isActive) return;

      const now = Date.now();
      const minIntervalMs = 250;

      if (fetchInFlightRef.current) return;

      if (now - lastFetchAtRef.current < minIntervalMs) {
        if (!pendingFetchRef.current) {
          pendingFetchRef.current = setTimeout(() => {
            pendingFetchRef.current = null;
            fetchAccessories();
          }, minIntervalMs - (now - lastFetchAtRef.current));
        }
        return;
      }

      fetchInFlightRef.current = true;
      lastFetchAtRef.current = now;

      try {
        const { data, error } = await supabase
          .from('user_accessories')
          .select('*')
          .eq('pet_id', petId);

        if (!isActive) return;

        if (error) {
          logger.error('Failed to fetch accessories', { petId, errorCode: error.code }, error);
          return;
        }

        if (data) {
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
        }
      } catch (error) {
        logger.error(
          'Error fetching accessories',
          { petId },
          error instanceof Error ? error : new Error(String(error))
        );
      } finally {
        fetchInFlightRef.current = false;
      }
    };

    const setupRealtime = async () => {
      if (!isActive || isSettingUpRef.current) return;
      isSettingUpRef.current = true;

      try {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
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

                await fetchAccessories();
              } catch (error) {
                logger.error('Error in accessories realtime callback', { petId }, error instanceof Error ? error : new Error(String(error)));
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              reconnectAttemptRef.current = 0;
              logger.info('Subscribed to accessories realtime channel', {
                petId,
                channel: `accessories-realtime-${petId}`,
              });
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              logger.error('Accessories realtime channel error', { petId, status });

              if (reconnectTimeoutRef.current) return;

              const attempt = reconnectAttemptRef.current;
              const delayMs = Math.min(30000, 1000 * Math.pow(2, attempt));
              reconnectAttemptRef.current = attempt + 1;

              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null;
                if (!isActive) return;
                logger.info('Attempting to resubscribe to accessories realtime', { petId, attempt: attempt + 1 });
                setupRealtime();
              }, delayMs);
            }
          });

        channelRef.current = channel;

        await fetchAccessories();
      } catch (error) {
        // Setup error - continue silently
      } finally {
        isSettingUpRef.current = false;
      }
    };

    setupRealtime();

    return () => {
      isActive = false;
      cleanup();
    };
  }, [petId]);
};

export default useAccessoriesRealtime;
