/**
 * Unified global state store using Zustand
 * Normalizes pet, inventory, quests, coins, and profile state
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Pet, PetStats } from '../types/pet';
import type { Quest } from '../types/quests';
import type { FinanceSummary } from '../types/finance';

interface InventoryItem {
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
}

interface AppState {
  // Pet state
  pet: Pet | null;
  petStats: PetStats | null;
  
  // Profile/Coins state
  coins: number;
  xp: number;
  profileId: string | null;
  
  // Inventory state
  inventory: InventoryItem[];
  
  // Quests state
  activeQuests: {
    daily: Quest[];
    weekly: Quest[];
    event: Quest[];
  };
  completedQuestIds: Set<string>;
  
  // Loading states
  loading: {
    pet: boolean;
    profile: boolean;
    quests: boolean;
    inventory: boolean;
  };
  
  // Error states
  errors: {
    pet: string | null;
    profile: string | null;
    quests: string | null;
  };
  
  // Actions - Pet
  setPet: (pet: Pet | null) => void;
  updatePetStats: (stats: Partial<PetStats>) => void;
  setPetLoading: (loading: boolean) => void;
  setPetError: (error: string | null) => void;
  
  // Actions - Profile/Coins
  setCoins: (coins: number) => void;
  addCoins: (amount: number) => void;
  deductCoins: (amount: number) => void;
  setXP: (xp: number) => void;
  addXP: (amount: number) => void;
  setProfileId: (id: string | null) => void;
  setProfileLoading: (loading: boolean) => void;
  setProfileError: (error: string | null) => void;
  
  // Actions - Inventory
  setInventory: (inventory: InventoryItem[]) => void;
  addInventoryItem: (item: InventoryItem) => void;
  removeInventoryItem: (itemId: string, quantity?: number) => void;
  setInventoryLoading: (loading: boolean) => void;
  
  // Actions - Quests
  setActiveQuests: (quests: { daily: Quest[]; weekly: Quest[]; event: Quest[] }) => void;
  completeQuest: (questId: string, coinsAwarded: number, xpAwarded: number) => void;
  setQuestsLoading: (loading: boolean) => void;
  setQuestsError: (error: string | null) => void;
  
  // Actions - Reset
  reset: () => void;
}

const initialState = {
  pet: null,
  petStats: null,
  coins: 0,
  xp: 0,
  profileId: null,
  inventory: [],
  activeQuests: {
    daily: [],
    weekly: [],
    event: [],
  },
  completedQuestIds: new Set<string>(),
  loading: {
    pet: false,
    profile: false,
    quests: false,
    inventory: false,
  },
  errors: {
    pet: null,
    profile: null,
    quests: null,
  },
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Pet actions
        setPet: (pet) => set(
          { 
            pet, 
            petStats: pet?.stats || null,
            errors: { ...get().errors, pet: null },
          },
          false,
          'setPet'
        ),
        
        updatePetStats: (stats) => {
          const currentPet = get().pet;
          if (!currentPet) return;
          
          const updatedStats: PetStats = {
            ...currentPet.stats,
            ...stats,
            lastUpdated: new Date(),
          };
          
          // Clamp stats to valid range [0, 100]
          updatedStats.health = Math.max(0, Math.min(100, updatedStats.health));
          updatedStats.hunger = Math.max(0, Math.min(100, updatedStats.hunger));
          updatedStats.happiness = Math.max(0, Math.min(100, updatedStats.happiness));
          updatedStats.cleanliness = Math.max(0, Math.min(100, updatedStats.cleanliness));
          updatedStats.energy = Math.max(0, Math.min(100, updatedStats.energy));
          
          const updatedPet: Pet = {
            ...currentPet,
            stats: updatedStats,
            updatedAt: new Date(),
          };
          
          set(
            { pet: updatedPet, petStats: updatedStats },
            false,
            'updatePetStats'
          );
        },
        
        setPetLoading: (loading) => set(
          (state) => ({
            loading: { ...state.loading, pet: loading },
          }),
          false,
          'setPetLoading'
        ),
        
        setPetError: (error) => set(
          (state) => ({
            errors: { ...state.errors, pet: error },
          }),
          false,
          'setPetError'
        ),
        
        // Profile/Coins actions
        setCoins: (coins) => set(
          { coins: Math.max(0, coins) },
          false,
          'setCoins'
        ),
        
        addCoins: (amount) => set(
          (state) => ({ coins: state.coins + amount }),
          false,
          'addCoins'
        ),
        
        deductCoins: (amount) => set(
          (state) => ({ coins: Math.max(0, state.coins - amount) }),
          false,
          'deductCoins'
        ),
        
        setXP: (xp) => set(
          { xp: Math.max(0, xp) },
          false,
          'setXP'
        ),
        
        addXP: (amount) => set(
          (state) => ({ xp: state.xp + amount }),
          false,
          'addXP'
        ),
        
        setProfileId: (id) => set(
          { profileId: id },
          false,
          'setProfileId'
        ),
        
        setProfileLoading: (loading) => set(
          (state) => ({
            loading: { ...state.loading, profile: loading },
          }),
          false,
          'setProfileLoading'
        ),
        
        setProfileError: (error) => set(
          (state) => ({
            errors: { ...state.errors, profile: error },
          }),
          false,
          'setProfileError'
        ),
        
        // Inventory actions
        setInventory: (inventory) => set(
          { inventory },
          false,
          'setInventory'
        ),
        
        addInventoryItem: (item) => set(
          (state) => {
            const existing = state.inventory.findIndex(
              (i) => i.itemId === item.itemId
            );
            
            if (existing >= 0) {
              const updated = [...state.inventory];
              updated[existing] = {
                ...updated[existing],
                quantity: updated[existing].quantity + item.quantity,
              };
              return { inventory: updated };
            }
            
            return { inventory: [...state.inventory, item] };
          },
          false,
          'addInventoryItem'
        ),
        
        removeInventoryItem: (itemId, quantity = 1) => set(
          (state) => {
            const existing = state.inventory.findIndex(
              (i) => i.itemId === itemId
            );
            
            if (existing < 0) return state;
            
            const updated = [...state.inventory];
            const currentQuantity = updated[existing].quantity;
            
            if (currentQuantity <= quantity) {
              updated.splice(existing, 1);
            } else {
              updated[existing] = {
                ...updated[existing],
                quantity: currentQuantity - quantity,
              };
            }
            
            return { inventory: updated };
          },
          false,
          'removeInventoryItem'
        ),
        
        setInventoryLoading: (loading) => set(
          (state) => ({
            loading: { ...state.loading, inventory: loading },
          }),
          false,
          'setInventoryLoading'
        ),
        
        // Quests actions
        setActiveQuests: (quests) => set(
          { activeQuests: quests },
          false,
          'setActiveQuests'
        ),
        
        completeQuest: (questId, coinsAwarded, xpAwarded) => set(
          (state) => {
            const completedIds = new Set(state.completedQuestIds);
            completedIds.add(questId);
            
            // Update quest status in active quests
            const updateQuestStatus = (quests: Quest[]) =>
              quests.map((q) =>
                q.id === questId ? { ...q, status: 'completed' as const } : q
              );
            
            return {
              completedQuestIds: completedIds,
              activeQuests: {
                daily: updateQuestStatus(state.activeQuests.daily),
                weekly: updateQuestStatus(state.activeQuests.weekly),
                event: updateQuestStatus(state.activeQuests.event),
              },
              coins: state.coins + coinsAwarded,
              xp: state.xp + xpAwarded,
            };
          },
          false,
          'completeQuest'
        ),
        
        setQuestsLoading: (loading) => set(
          (state) => ({
            loading: { ...state.loading, quests: loading },
          }),
          false,
          'setQuestsLoading'
        ),
        
        setQuestsError: (error) => set(
          (state) => ({
            errors: { ...state.errors, quests: error },
          }),
          false,
          'setQuestsError'
        ),
        
        // Reset
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          // Only persist non-sensitive state
          coins: state.coins,
          xp: state.xp,
          inventory: state.inventory,
          completedQuestIds: Array.from(state.completedQuestIds),
        }),
      }
    ),
    { name: 'AppStore' }
  )
);
