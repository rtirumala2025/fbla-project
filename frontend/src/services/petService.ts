import { Pet, PetStats, UserData, Transaction, ShopItem } from '../types/pet';

class PetServiceError extends Error {
  constructor(message: string, public code?: string, public originalError?: unknown) {
    super(message);
    this.name = 'PetServiceError';
  }
}

// Local storage keys
const STORAGE_KEYS = {
  USERS: 'pet_app_users',
  PETS: 'pet_app_pets',
  TRANSACTIONS: 'pet_app_transactions',
};

// Helper functions for localStorage
const getStorageData = <T>(key: string): Record<string, T> => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return {};
  }
};

const setStorageData = <T>(key: string, data: Record<string, T>): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
    throw new PetServiceError('Failed to save data');
  }
};

/**
 * Creates a new user profile in localStorage
 * @param userId - The user's unique ID
 * @param email - The user's email address
 * @param displayName - The user's display name
 * @returns The created user data
 * @throws {PetServiceError} If the operation fails
 */
export const createUserProfile = async (
  userId: string, 
  email: string, 
  displayName: string
): Promise<UserData> => {
  if (!userId || !email) {
    throw new PetServiceError('User ID and email are required');
  }

  try {
    const users = getStorageData<UserData>(STORAGE_KEYS.USERS);
    
    // If user already exists, return existing data
    if (users[userId]) {
      return users[userId];
    }

    const now = new Date();
    const initialUserData: UserData = {
      id: userId,
      email,
      displayName: displayName || email.split('@')[0],
      coins: 100, // Starting coins
      inventory: {
        food: {},
        toys: {},
        medicine: {},
      },
      currentPetId: null,
      transactions: [],
      createdAt: now,
      updatedAt: now,
    };

    users[userId] = initialUserData;
    setStorageData(STORAGE_KEYS.USERS, users);
    
    return initialUserData;
  } catch (error) {
    throw new PetServiceError(
      `Failed to create user profile: ${error}`,
      'creation-failed',
      error
    );
  }
};

/**
 * Retrieves user data from localStorage
 * @param userId - The user's unique ID
 * @returns The user data or null if not found
 * @throws {PetServiceError} If the operation fails
 */
export const getUserData = async (userId: string): Promise<UserData | null> => {
  if (!userId) {
    throw new PetServiceError('User ID is required');
  }

  try {
    const users = getStorageData<UserData>(STORAGE_KEYS.USERS);
    return users[userId] || null;
  } catch (error) {
    throw new PetServiceError(
      `Failed to get user data: ${error}`,
      'fetch-failed',
      error
    );
  }
};

/**
 * Creates a new pet and associates it with a user
 * @param userId - The owner's user ID
 * @param petData - The pet data to create
 * @returns The created pet with its ID
 * @throws {PetServiceError} If the operation fails
 */
export const createPet = async (
  userId: string, 
  petData: Omit<Pet, 'id' | 'stats' | 'createdAt' | 'updatedAt' | 'ownerId' | 'level' | 'experience'>
): Promise<Pet> => {
  if (!userId) {
    throw new PetServiceError('User ID is required');
  }
  if (!petData.name || !petData.species || !petData.breed) {
    throw new PetServiceError('Pet name, species, and breed are required');
  }

  try {
    const initialStats: PetStats = {
      health: 100,
      hunger: 75,
      happiness: 80,
      cleanliness: 90,
      energy: 85,
      lastUpdated: new Date(),
    };

    const now = new Date();
    const petId = `pet-${Date.now()}`;
    
    const newPet: Pet = {
      id: petId,
      ...petData,
      stats: initialStats,
      ownerId: userId,
      level: 1,
      experience: 0,
      age: 0, // Age in days
      createdAt: now,
      updatedAt: now,
    };

    // Save pet to storage
    const pets = getStorageData<Pet>(STORAGE_KEYS.PETS);
    pets[petId] = newPet;
    setStorageData(STORAGE_KEYS.PETS, pets);
    
    // Update user's current pet reference
    const users = getStorageData<UserData>(STORAGE_KEYS.USERS);
    if (users[userId]) {
      users[userId].currentPetId = petId;
      users[userId].updatedAt = now;
      setStorageData(STORAGE_KEYS.USERS, users);
    }
    
    return newPet;
  } catch (error) {
    throw new PetServiceError(
      `Failed to create pet: ${error}`,
      'creation-failed',
      error
    );
  }
};

/**
 * Retrieves a pet by its ID
 * @param petId - The pet's unique ID
 * @returns The pet data or null if not found
 * @throws {PetServiceError} If the operation fails
 */
export const getPet = async (petId: string): Promise<Pet | null> => {
  if (!petId) {
    throw new PetServiceError('Pet ID is required');
  }

  try {
    const pets = getStorageData<Pet>(STORAGE_KEYS.PETS);
    return pets[petId] || null;
  } catch (error) {
    throw new PetServiceError(
      `Failed to get pet: ${error}`,
      'fetch-failed',
      error
    );
  }
};

/**
 * Updates a pet's stats
 * @param petId - The pet's unique ID
 * @param stats - The stats to update
 * @throws {PetServiceError} If the operation fails
 */
export const updatePetStats = async (
  petId: string, 
  stats: Partial<PetStats>
): Promise<void> => {
  if (!petId) {
    throw new PetServiceError('Pet ID is required');
  }
  
  // Validate stat values (0-100)
  const statEntries = Object.entries(stats);
  for (const [key, value] of statEntries) {
    if (key !== 'lastUpdated' && (typeof value === 'number' && (value < 0 || value > 100))) {
      throw new PetServiceError(`Invalid value for ${key}: must be between 0 and 100`);
    }
  }

  try {
    const pets = getStorageData<Pet>(STORAGE_KEYS.PETS);
    const pet = pets[petId];
    
    if (!pet) {
      throw new PetServiceError('Pet not found', 'not-found');
    }
    
    pets[petId] = {
      ...pet,
      stats: {
        ...pet.stats,
        ...stats,
        lastUpdated: new Date(),
      },
      updatedAt: new Date(),
    };
    
    setStorageData(STORAGE_KEYS.PETS, pets);
  } catch (error) {
    throw new PetServiceError(
      `Failed to update pet stats: ${error}`,
      'update-failed',
      error
    );
  }
};

/**
 * Purchases an item from the shop
 * @param userId - The user's unique ID
 * @param item - The item to purchase
 * @returns The transaction details
 * @throws {PetServiceError} If the operation fails
 */
export const purchaseItem = async (
  userId: string, 
  item: { 
    id: string; 
    type: 'food' | 'toys' | 'medicine'; 
    price: number; 
    quantity: number;
    name?: string;
  }
): Promise<Transaction> => {
  if (!userId) {
    throw new PetServiceError('User ID is required');
  }
  
  if (!item.id || !item.type || item.price <= 0 || item.quantity <= 0) {
    throw new PetServiceError('Invalid item data');
  }

  try {
    const users = getStorageData<UserData>(STORAGE_KEYS.USERS);
    const userData = users[userId];
    
    if (!userData) {
      throw new PetServiceError('User not found', 'not-found');
    }
    
    const totalCost = item.price * item.quantity;
    
    if (userData.coins < totalCost) {
      throw new PetServiceError('Insufficient funds', 'insufficient-funds');
    }
    
    // Create a deep copy of the inventory to avoid mutation
    const inventoryUpdate = {
      food: { ...userData.inventory.food },
      toys: { ...userData.inventory.toys },
      medicine: { ...userData.inventory.medicine },
    };
    
    // Update the inventory
    const currentCount = inventoryUpdate[item.type][item.id] || 0;
    inventoryUpdate[item.type][item.id] = currentCount + item.quantity;
    
    // Create transaction record
    const transactionRecord: Transaction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'expense',
      amount: totalCost,
      description: `Purchased ${item.quantity}x ${item.name || item.id}`,
      category: `shop.${item.type}`,
      date: new Date(),
      itemId: item.id,
      itemType: item.type,
      quantity: item.quantity,
    };
    
    // Update the user data
    users[userId] = {
      ...userData,
      coins: userData.coins - totalCost,
      inventory: inventoryUpdate,
      transactions: [...(userData.transactions || []), transactionRecord],
      updatedAt: new Date(),
    };
    
    setStorageData(STORAGE_KEYS.USERS, users);
    
    return transactionRecord;
  } catch (error) {
    throw new PetServiceError(
      `Failed to purchase item: ${error}`,
      'purchase-failed',
      error
    );
  }
};
