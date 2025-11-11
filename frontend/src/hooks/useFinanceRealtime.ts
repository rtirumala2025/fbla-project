import { useEffect } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { isSupabaseMock, supabase } from '../lib/supabase';

export interface FinanceRefreshOptions {
  silent?: boolean;
}

export type FinanceRefreshFn = (options?: FinanceRefreshOptions) => Promise<void> | void;

/**
 * Subscribe to Supabase realtime changes for the authenticated user's finance tables.
 * On any change, the provided refresh function is invoked with `{ silent: true }`
 * so callers can update UI without triggering loading spinners.
 */
export const useFinanceRealtime = (refresh: FinanceRefreshFn): void => {
  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let isActive = true;

    const handleRefresh = () => {
      if (!isActive) {
        return;
      }
      void refresh({ silent: true });
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

      const tables = [
        { table: 'finance_wallets', filter: `user_id=eq.${userId}` },
        { table: 'finance_transactions', filter: `user_id=eq.${userId}` },
        { table: 'finance_goals', filter: `user_id=eq.${userId}` },
        { table: 'finance_inventory', filter: `user_id=eq.${userId}` },
      ];

      const realtimeChannel = supabase.channel(`finance-realtime-${userId}`);

      tables.forEach(({ table, filter }) => {
        realtimeChannel.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter,
          },
          handleRefresh,
        );
      });

      channel = realtimeChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          handleRefresh();
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
  }, [refresh]);
};


