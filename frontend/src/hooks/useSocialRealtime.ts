/**
 * useSocialRealtime Hook
 * Subscribes to Supabase realtime changes for social tables (friends, public_profiles)
 */
import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { isSupabaseMock, supabase } from '../lib/supabase';

export interface SocialRefreshOptions {
  silent?: boolean;
}

export type SocialRefreshFn = (options?: SocialRefreshOptions) => Promise<void> | void;

/**
 * Subscribe to Supabase realtime changes for social tables.
 * On any change, the provided refresh function is invoked.
 */
export const useSocialRealtime = (refresh: SocialRefreshFn): void => {
  const refreshRef = useRef<SocialRefreshFn>(refresh);
  
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let isActive = true;

    const handleRefresh = () => {
      if (!isActive) {
        return;
      }
      void refreshRef.current({ silent: true });
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

      const userId = data.session?.user?.id;
      if (!userId) {
        return;
      }

      // Subscribe to friends table changes where user is involved
      const realtimeChannel = supabase.channel(`social-realtime-${userId}`);

      // Listen for changes to friends table where user_id or friend_id matches
      realtimeChannel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `user_id=eq.${userId}`,
        },
        handleRefresh,
      );

      realtimeChannel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `friend_id=eq.${userId}`,
        },
        handleRefresh,
      );

      // Listen for changes to public_profiles (for leaderboard updates)
      realtimeChannel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'public_profiles',
        },
        handleRefresh,
      );

      channel = realtimeChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Social realtime subscribed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Social realtime channel error');
        }
      });
    };

    setupRealtime();

    return () => {
      isActive = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);
};

