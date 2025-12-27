import { supabase, withTimeout } from '../lib/supabase';

type InventoryRow = {
  id: string;
  user_id: string;
  item_id: string;
  item_name: string;
  category: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  wallet_id: string;
  shop_item_id: string | null;
};

export const inventoryService = {
  async listInventory(userId: string): Promise<InventoryRow[]> {
    const query = supabase
      .from('finance_inventory')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    const { data, error } = await withTimeout(query as unknown as Promise<any>, 10000, 'List inventory') as any;

    if (error) {
      console.error('❌ inventoryService.listInventory failed:', error);
      throw error;
    }

    return (data || []) as InventoryRow[];
  },

  async getItem(userId: string, itemId: string): Promise<InventoryRow | null> {
    const query = supabase
      .from('finance_inventory')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();

    const { data, error } = await withTimeout(query as unknown as Promise<any>, 10000, 'Get inventory item') as any;

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('❌ inventoryService.getItem failed:', error);
      throw error;
    }

    return data as InventoryRow;
  },
};
