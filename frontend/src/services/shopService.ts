import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type ShopItem = Database['public']['Tables']['shop_items']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Insert'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export const shopService = {
  /**
   * Get all shop items
   */
  async getShopItems(): Promise<ShopItem[]> {
    const { data, error } = await supabase
      .from('shop_items')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching shop items:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Get user's coin balance
   */
  async getUserBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('profiles')
      .select('coins')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }

    return data?.coins || 0;
  },

  /**
   * Purchase items (atomic transaction)
   */
  async purchaseItems(
    userId: string,
    items: Array<{ id: string; name: string; price: number }>
  ): Promise<{ success: boolean; newBalance: number }> {
    try {
      // Calculate total cost
      const totalCost = items.reduce((sum, item) => sum + item.price, 0);

      // Get current balance
      const currentBalance = await this.getUserBalance(userId);

      // Check if user has enough coins
      if (currentBalance < totalCost) {
        throw new Error('Insufficient funds');
      }

      // Deduct coins from profile
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .update({ coins: currentBalance - totalCost })
        .eq('user_id', userId)
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      // Record transactions
      const transactions: Transaction[] = items.map((item) => ({
        user_id: userId,
        item_id: item.id,
        item_name: item.name,
        amount: -item.price,
        transaction_type: 'purchase',
      }));

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert(transactions);

      if (transactionError) {
        // Rollback balance change if transaction recording fails
        await supabase
          .from('profiles')
          .update({ coins: currentBalance })
          .eq('user_id', userId);
        
        throw transactionError;
      }

      return {
        success: true,
        newBalance: updatedProfile.coins,
      };
    } catch (error) {
      console.error('Error processing purchase:', error);
      throw error;
    }
  },

  /**
   * Add coins to user balance (rewards, etc.)
   */
  async addCoins(userId: string, amount: number, reason: string): Promise<number> {
    const currentBalance = await this.getUserBalance(userId);
    const newBalance = currentBalance + amount;

    const { data, error } = await supabase
      .from('profiles')
      .update({ coins: newBalance })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Record transaction
    await supabase.from('transactions').insert({
      user_id: userId,
      item_id: 'reward',
      item_name: reason,
      amount: amount,
      transaction_type: 'reward',
    });

    return data.coins;
  },

  /**
   * Get user's transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    return data || [];
  },
};

