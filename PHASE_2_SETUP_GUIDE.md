# 🚀 Phase 2: Supabase Integration - Complete Setup Guide

This guide provides step-by-step instructions to complete the Supabase + Backend integration for the Companion Virtual Pet App.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Database Setup](#supabase-database-setup)
3. [Environment Variables](#environment-variables)
4. [NPM Dependencies](#npm-dependencies)
5. [Backend Setup](#backend-setup)
6. [Frontend Integration Examples](#frontend-integration-examples)
7. [Testing](#testing)

---

## 1. Prerequisites

✅ Supabase account created
✅ New Supabase project created
✅ Node.js and Python installed

---

## 2. Supabase Database Setup

### Step 2.1: Create Tables

Go to your Supabase Dashboard → SQL Editor and execute the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  coins INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(username)
);

-- =====================================================
-- PETS TABLE
-- =====================================================
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species TEXT NOT NULL,
  breed TEXT NOT NULL,
  age INTEGER NOT NULL DEFAULT 1,
  level INTEGER NOT NULL DEFAULT 1,
  health DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  hunger DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  happiness DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  cleanliness DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  energy DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- SHOP_ITEMS TABLE
-- =====================================================
CREATE TABLE shop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  species TEXT[] NOT NULL DEFAULT ARRAY['dog', 'cat', 'bird', 'rabbit'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PET_INVENTORY TABLE
-- =====================================================
CREATE TABLE pet_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pet_id, item_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_pet_inventory_pet_id ON pet_inventory(pet_id);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pet_inventory_updated_at BEFORE UPDATE ON pet_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 2.2: Insert Sample Shop Items

```sql
INSERT INTO shop_items (name, category, price, emoji, description, species) VALUES
  ('Dog Food', 'food', 10, '🍖', 'Nutritious meal', ARRAY['dog']),
  ('Cat Food', 'food', 10, '🐟', 'Tasty fish', ARRAY['cat']),
  ('Bird Seed', 'food', 8, '🌾', 'Premium seeds', ARRAY['bird']),
  ('Rabbit Food', 'food', 8, '🥕', 'Fresh veggies', ARRAY['rabbit']),
  ('Ball', 'toy', 15, '⚽', 'Fun toy', ARRAY['dog', 'cat', 'rabbit']),
  ('Feather Toy', 'toy', 12, '🪶', 'Interactive play', ARRAY['cat', 'bird']),
  ('Chew Toy', 'toy', 18, '🦴', 'Durable chew', ARRAY['dog', 'rabbit']),
  ('Medicine', 'medicine', 25, '💊', 'Health boost', ARRAY['dog', 'cat', 'bird', 'rabbit']),
  ('Vitamins', 'medicine', 20, '💉', 'Daily vitamins', ARRAY['dog', 'cat', 'bird', 'rabbit']),
  ('Energy Drink', 'energy', 15, '⚡', 'Instant energy boost', ARRAY['dog', 'cat', 'bird', 'rabbit']),
  ('Power Potion', 'energy', 18, '🧪', 'Maximum energy', ARRAY['dog', 'cat', 'bird', 'rabbit']);
```

### Step 2.3: Row Level Security (RLS) Policies

Execute these SQL commands to enable RLS and create policies:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_inventory ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- PETS POLICIES
-- =====================================================
CREATE POLICY "Users can view own pet"
  ON pets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pet"
  ON pets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pet"
  ON pets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own pet"
  ON pets FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- SHOP_ITEMS POLICIES (Public read-only)
-- =====================================================
CREATE POLICY "Anyone can view shop items"
  ON shop_items FOR SELECT
  USING (true);

-- =====================================================
-- TRANSACTIONS POLICIES
-- =====================================================
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- PET_INVENTORY POLICIES
-- =====================================================
CREATE POLICY "Users can view own pet inventory"
  ON pet_inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_inventory.pet_id
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own pet inventory"
  ON pet_inventory FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_inventory.pet_id
      AND pets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own pet inventory"
  ON pet_inventory FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id = pet_inventory.pet_id
      AND pets.user_id = auth.uid()
    )
  );
```

---

## 3. Environment Variables

### Frontend (.env)

Create `/frontend/.env`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:8000
```

### Backend (.env)

Create `/backend/.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
OPENAI_API_KEY=your-openai-key-here
PORT=8000
```

**Where to find keys:**
- Supabase Dashboard → Settings → API
- `anon` key = public key for frontend
- `service_role` key = private key for backend

---

## 4. NPM Dependencies

### Install Frontend Dependencies

```bash
cd frontend
npm install @supabase/supabase-js axios
npm install --save-dev @types/node
```

### Install Backend Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## 5. Backend Setup

### Run Backend Server

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python server.py
```

Server runs at: http://localhost:8000
API Docs at: http://localhost:8000/docs

---

## 6. Frontend Integration Examples

### Example: Update Dashboard.tsx to use Supabase

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { petService } from '../services/petService';
import { shopService } from '../services/shopService';
import { useToast } from '../contexts/ToastContext';

export const Dashboard = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  // Load pet data on mount
  useEffect(() => {
    if (currentUser) {
      loadPetData();
      loadBalance();
    }
  }, [currentUser]);

  const loadPetData = async () => {
    try {
      setLoading(true);
      const petData = await petService.getPet(currentUser!.uid);
      
      if (!petData) {
        // No pet yet - redirect to onboarding
        toast.info('Create your first pet!');
        navigate('/onboarding/species');
        return;
      }
      
      setPet(petData);
    } catch (error) {
      toast.error('Failed to load pet data');
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const coins = await shopService.getUserBalance(currentUser!.uid);
      setBalance(coins);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleFeed = async () => {
    try {
      const updatedPet = await petService.updatePetStats(pet.id, {
        hunger: Math.min(100, pet.hunger + 30),
        health: Math.min(100, pet.health + 5),
      });
      setPet(updatedPet);
      toast.success(`Fed ${pet.name}!`);
      
      // Deduct coins
      await shopService.addCoins(currentUser!.uid, -10, 'Feed pet');
      setBalance(prev => prev - 10);
    } catch (error) {
      toast.error('Failed to feed pet');
    }
  };

  // ... rest of component
};
```

### Example: Update Shop.tsx

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { shopService } from '../services/shopService';
import { useToast } from '../contexts/ToastContext';

export const Shop = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [balance, setBalance] = useState(0);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    loadShopData();
  }, [currentUser]);

  const loadShopData = async () => {
    try {
      const [shopItems, userBalance] = await Promise.all([
        shopService.getShopItems(),
        shopService.getUserBalance(currentUser!.uid),
      ]);
      setItems(shopItems);
      setBalance(userBalance);
    } catch (error) {
      toast.error('Failed to load shop');
    }
  };

  const handlePurchase = async () => {
    try {
      const result = await shopService.purchaseItems(
        currentUser!.uid,
        cart
      );
      
      setBalance(result.newBalance);
      setCart([]);
      toast.success(`Purchase successful! 🎉`);
    } catch (error) {
      toast.error('Purchase failed: ' + error.message);
    }
  };

  // ... rest of component
};
```

### Example: Update ProfilePage.tsx

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { petService } from '../services/petService';
import { useToast } from '../contexts/ToastContext';

export const ProfilePage = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      const [profileData, petData] = await Promise.all([
        profileService.getProfile(currentUser!.uid),
        petService.getPet(currentUser!.uid),
      ]);
      setProfile(profileData);
      setPet(petData);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await profileService.updateUsername(currentUser!.uid, tempUsername);
      toast.success('Profile updated! 🎉');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  // ... rest of component
};
```

---

## 7. Testing

### Test Authentication Flow

1. Start frontend: `npm start`
2. Navigate to Register page
3. Create account with email/password
4. Check Supabase Dashboard → Authentication → Users
5. Verify profile created in profiles table

### Test Pet Creation

1. After signup, complete onboarding flow
2. Check pets table in Supabase
3. Verify pet data persists after refresh

### Test Shop

1. Add items to cart
2. Click purchase
3. Verify:
   - Coins deducted in profiles table
   - Transaction recorded in transactions table
   - Toast notification shows success

### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# AI response
curl -X POST http://localhost:8000/api/ai/pet-response \
  -H "Content-Type: application/json" \
  -d '{"pet_name":"Buddy","pet_mood":"happy"}'
```

---

## 8. Troubleshooting

### Common Issues

**Issue: "Missing Supabase environment variables"**
- Solution: Ensure `.env` file exists and has correct keys

**Issue: "Row Level Security policy violation"**
- Solution: Check RLS policies are correctly set up
- Try disabling RLS temporarily for testing: `ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;`

**Issue: "CORS error from backend"**
- Solution: Check backend CORS settings include frontend URL

**Issue: "Cannot find module '@supabase/supabase-js'"**
- Solution: Run `npm install @supabase/supabase-js`

---

## 9. Next Steps (Phase 3)

- ✅ Real OpenAI integration for AI companion
- ✅ Real-time stat decay with Supabase Realtime
- ✅ Achievements and leaderboards
- ✅ Advanced analytics dashboard
- ✅ Pet evolution system
- ✅ Social features (visit friend's pets)

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Query for data fetching](https://tanstack.com/query/latest)

---

**🎉 Phase 2 Complete!** Your app now has full Supabase integration with persistent data and a lightweight backend API.

