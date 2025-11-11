export interface PetStats {
  health: number;
  hunger: number;
  happiness: number;
  cleanliness: number;
  energy: number;
  lastUpdated: Date;
}

export interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit';
  breed: string;
  age: number; // in days
  level: number;
  experience: number;
  stats: PetStats;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserData {
  id: string;
  email: string;
  displayName: string;
  coins: number;
  inventory: {
    food: { [itemId: string]: number };
    toys: { [itemId: string]: number };
    medicine: { [itemId: string]: number };
  };
  currentPetId: string | null;
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
  itemId?: string;
  itemType?: 'food' | 'toys' | 'medicine';
  quantity?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'food' | 'toy' | 'medicine';
  effect: {
    stat: keyof PetStats;
    value: number;
  };
  icon: string;
  forSpecies?: ('dog' | 'cat' | 'bird' | 'rabbit')[];
}
