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

  async incrementQuantity(params: {
    userId: string;
    itemId: string;
    quantity: number;
    itemName: string;
    category?: string | null;
    shopItemId?: string | null;
  }): Promise<InventoryRow> {
    const { userId, itemId, quantity, itemName, category = null, shopItemId = null } = params;

    if (quantity <= 0) {
      throw new Error('Quantity increment must be positive');
    }

    const existing = await this.getItem(userId, itemId);
    if (existing) {
      const newQuantity = existing.quantity + quantity;

      const query = supabase
        .from('finance_inventory')
        .update({
          quantity: newQuantity,
          item_name: itemName,
          category,
          shop_item_id: shopItemId,
        })
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select('*')
        .single();

      const { data, error } = await withTimeout(query as unknown as Promise<any>, 10000, 'Increment inventory item') as any;

      if (error) {
        console.error('❌ inventoryService.incrementQuantity update failed:', error);
        throw error;
      }

      return data as InventoryRow;
    }

    const { data: walletId, error: walletError } = await withTimeout(
      supabase.rpc('ensure_finance_wallet', { p_user_id: userId }) as unknown as Promise<any>,
      10000,
      'Ensure finance wallet'
    ) as any;

    if (walletError) {
      console.error('❌ inventoryService.incrementQuantity ensure_finance_wallet failed:', walletError);
      throw walletError;
    }

    if (!walletId) {
      throw new Error('Failed to ensure finance wallet');
    }

    const insertQuery = supabase
      .from('finance_inventory')
      .insert({
        wallet_id: walletId,
        user_id: userId,
        item_id: itemId,
        item_name: itemName,
        category,
        quantity,
        shop_item_id: shopItemId,
      })
      .select('*')
      .single();

    const { data, error } = await withTimeout(insertQuery as unknown as Promise<any>, 10000, 'Insert inventory item') as any;

    if (error) {
      console.error('❌ inventoryService.incrementQuantity insert failed:', error);
      throw error;
    }

    return data as InventoryRow;
  },

  async decrementQuantity(params: {
    userId: string;
    itemId: string;
    quantity: number;
  }): Promise<InventoryRow> {
    const { userId, itemId, quantity } = params;

    if (quantity <= 0) {
      throw new Error('Quantity decrement must be positive');
    }

    const existing = await this.getItem(userId, itemId);
    if (!existing) {
      throw new Error('Inventory item not found');
    }

    const newQuantity = existing.quantity - quantity;
    if (newQuantity < 0) {
      throw new Error('Insufficient inventory quantity');
    }

    const query = supabase
      .from('finance_inventory')
      .update({ quantity: newQuantity })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .select('*')
      .single();

    const { data, error } = await withTimeout(query as unknown as Promise<any>, 10000, 'Decrement inventory item') as any;

    if (error) {
      console.error('❌ inventoryService.decrementQuantity failed:', error);
      throw error;
    }

    return data as InventoryRow;
  },
};
