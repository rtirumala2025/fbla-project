/**
 * Real-time subscription hook for Coach Panel.
 * Refreshes coach advice when pet stats change.
 */
import { useEffect, useRef } from 'react';
import { supabase, isSupabaseMock } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type CoachRefreshFn = () => Promise<void> | void;

/**
 * Subscribe to Supabase realtime changes for pet stats.
 * On any change, the provided refresh function is invoked to update coach advice.
 */
export const useCoachRealtime = (refresh: CoachRefreshFn, userId?: string | null): void => {
  const refreshRef = useRef<CoachRefreshFn>(refresh);
  
  // Update ref when refresh changes
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let channel: RealtimeChannel | null = null;
    let isActive = true;

    const handleRefresh = () => {
      if (!isActive) {
        return;
      }
      // Use the ref to get the latest refresh function
      void refreshRef.current();
    };

    const setupRealtime = async () => {
      if (isSupabaseMock()) {
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Supabase session retrieval failed', error);
        return;
      }

      const sessionUserId = data.session?.user?.id;
      if (!sessionUserId) {
        return;
      }

      // Subscribe to pet stats changes
      const realtimeChannel = supabase.channel(`coach-realtime-${sessionUserId}`);

      realtimeChannel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pets',
          filter: `user_id=eq.${sessionUserId}`,
        },
        (payload) => {
          // Only refresh if stats actually changed
          if (payload.new && (
            payload.new.health !== payload.old?.health ||
            payload.new.happiness !== payload.old?.happiness ||
            payload.new.energy !== payload.old?.energy ||
            payload.new.hunger !== payload.old?.hunger ||
            payload.new.cleanliness !== payload.old?.cleanliness ||
            payload.new.mood !== payload.old?.mood
          )) {
            handleRefresh();
          }
        },
      );

      channel = realtimeChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Coach realtime subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Coach realtime subscription error');
        }
      });
    };

    setupRealtime();

    return () => {
      isActive = false;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [userId]);
};

