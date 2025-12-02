# Data Models - FBLA Virtual Pet Companion

**Version:** 1.0.0  
**Last Updated:** January 2025

---

## Table of Contents

1. [Database Overview](#database-overview)
2. [Core Tables](#core-tables)
3. [Pet System Tables](#pet-system-tables)
4. [Financial System Tables](#financial-system-tables)
5. [Quest System Tables](#quest-system-tables)
6. [Social System Tables](#social-system-tables)
7. [Game & Analytics Tables](#game--analytics-tables)
8. [Relationships & Constraints](#relationships--constraints)
9. [Row-Level Security](#row-level-security)
10. [Indexes & Performance](#indexes--performance)

---

## Database Overview

The database uses **PostgreSQL** hosted on Supabase with:
- **Row-Level Security (RLS)** for data isolation
- **Foreign key constraints** for referential integrity
- **Indexes** for query optimization
- **Triggers** for automated updates
- **Real-time subscriptions** via Supabase Realtime

### Schema Organization

- **Core:** User authentication, profiles, preferences
- **Pets:** Pet entities, stats, inventory
- **Finance:** Wallets, transactions, shop items, goals
- **Quests:** Quest definitions and progress tracking
- **Social:** Friends, leaderboards, public profiles
- **Games:** Mini-game scores and analytics
- **Analytics:** User activity and reporting

---

## Core Tables

### `users`

Application users table synced with Supabase Auth.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | User identifier (linked to auth.users.id) |
| `auth_user_id` | UUID | UNIQUE, FK → auth.users | Supabase Auth user ID |
| `email` | TEXT | NOT NULL, UNIQUE | User email address |
| `password_hash` | TEXT | NOT NULL | Hashed password |
| `created_at` | TIMESTAMPTZ | NOT NULL | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Triggers:**
- Auto-syncs with `auth.users` table
- Updates `updated_at` on modification

**RLS:** Managed via service role, authenticated users can read own record

---

### `profiles`

User profile information and coin balance.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Profile identifier |
| `user_id` | UUID | NOT NULL, UNIQUE, FK → users | Owner user ID |
| `username` | TEXT | NOT NULL, UNIQUE | Display username |
| `avatar_url` | TEXT | NULL | Avatar image URL |
| `title` | TEXT | NULL | User title/badge |
| `bio` | TEXT | NULL | User biography |
| `coins` | INTEGER | NOT NULL, DEFAULT 100 | Current coin balance |
| `badges` | JSONB | NOT NULL, DEFAULT '[]' | Achievement badges array |
| `created_at` | TIMESTAMPTZ | NOT NULL | Profile creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Relationships:**
- One-to-one with `users`
- One-to-many with `pets`

**RLS Policies:**
- Users can read/write own profile
- Public profiles readable by authenticated users

---

### `user_preferences`

User application preferences and accessibility settings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Preference identifier |
| `user_id` | UUID | NOT NULL, UNIQUE, FK → users | Owner user ID |
| `sound` | BOOLEAN | NOT NULL, DEFAULT TRUE | Sound effects enabled |
| `music` | BOOLEAN | NOT NULL, DEFAULT TRUE | Background music enabled |
| `notifications` | BOOLEAN | NOT NULL, DEFAULT TRUE | Push notifications enabled |
| `reduced_motion` | BOOLEAN | NOT NULL, DEFAULT FALSE | Reduced animations |
| `high_contrast` | BOOLEAN | NOT NULL, DEFAULT FALSE | High contrast mode |
| `created_at` | TIMESTAMPTZ | NOT NULL | Preference creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**RLS:** Users can only access own preferences

---

## Pet System Tables

### `pets`

Pet entities with stats and metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Pet identifier |
| `user_id` | UUID | NOT NULL, UNIQUE, FK → users | Owner user ID |
| `name` | TEXT | NOT NULL | Pet name |
| `species` | TEXT | NOT NULL | Species (dog, cat, bird, rabbit, dragon) |
| `breed` | TEXT | NOT NULL | Specific breed |
| `color_pattern` | TEXT | NOT NULL | Color/pattern description |
| `birthday` | DATE | NOT NULL | Pet birthday |
| `hunger` | INTEGER | NOT NULL, DEFAULT 70, CHECK (0-100) | Hunger stat (0-100) |
| `happiness` | INTEGER | NOT NULL, DEFAULT 70, CHECK (0-100) | Happiness stat (0-100) |
| `cleanliness` | INTEGER | NOT NULL, DEFAULT 70, CHECK (0-100) | Cleanliness stat (0-100) |
| `energy` | INTEGER | NOT NULL, DEFAULT 70, CHECK (0-100) | Energy stat (0-100) |
| `health` | INTEGER | NOT NULL, DEFAULT 80, CHECK (0-100) | Health stat (0-100) |
| `level` | INTEGER | NOT NULL, DEFAULT 1 | Pet level |
| `xp` | INTEGER | NOT NULL, DEFAULT 0 | Experience points |
| `evolution_stage` | TEXT | NOT NULL, DEFAULT 'egg' | Evolution stage |
| `mood` | ENUM | NOT NULL, DEFAULT 'happy' | Current mood |
| `last_fed` | TIMESTAMPTZ | NULL | Last feeding timestamp |
| `last_played` | TIMESTAMPTZ | NULL | Last play timestamp |
| `last_bathed` | TIMESTAMPTZ | NULL | Last bathing timestamp |
| `last_slept` | TIMESTAMPTZ | NULL | Last rest timestamp |
| `diary` | JSONB | NOT NULL, DEFAULT '[]' | Diary entries array |
| `traits` | JSONB | NOT NULL, DEFAULT '{}' | Personality traits |
| `created_at` | TIMESTAMPTZ | NOT NULL | Pet creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Relationships:**
- One-to-one with `users`
- One-to-many with `pet_inventory`
- One-to-many with `pet_diary_entries`

**Mood Enum Values:**
- `ecstatic`, `happy`, `content`, `sleepy`, `anxious`, `distressed`, `sad`, `moody`

**Evolution Stages:**
- `egg` → `juvenile` → `adult` → `legendary`

**RLS Policies:**
- Users can read/write own pets
- Public pet data readable by authenticated users

---

### `pet_inventory`

Items owned by pets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Inventory item identifier |
| `pet_id` | UUID | NOT NULL, FK → pets | Owner pet ID |
| `user_id` | UUID | NOT NULL, FK → users | Owner user ID |
| `item_id` | TEXT | NOT NULL | Item identifier |
| `item_name` | TEXT | NOT NULL | Item display name |
| `quantity` | INTEGER | NOT NULL, DEFAULT 1 | Quantity owned |
| `category` | TEXT | NULL | Item category |
| `created_at` | TIMESTAMPTZ | NOT NULL | Item acquisition timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Unique Constraint:** `(user_id, item_id)`

**RLS:** Users can only access own pet inventory

---

### `pet_diary_entries`

Pet diary/log entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Diary entry identifier |
| `pet_id` | UUID | NOT NULL, FK → pets | Pet ID |
| `user_id` | UUID | NOT NULL, FK → users | Owner user ID |
| `mood` | TEXT | NOT NULL | Mood at entry time |
| `note` | TEXT | NULL | Diary note text |
| `created_at` | TIMESTAMPTZ | NOT NULL | Entry creation timestamp |

**RLS:** Users can only access own pet diary entries

---

## Financial System Tables

### `finance_wallets`

User coin wallets with balance tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Wallet identifier |
| `user_id` | UUID | NOT NULL, UNIQUE, FK → users | Owner user ID |
| `balance` | INTEGER | NOT NULL, DEFAULT 0 | Current coin balance |
| `currency` | TEXT | NOT NULL, DEFAULT 'COIN' | Currency type |
| `lifetime_earned` | INTEGER | NOT NULL, DEFAULT 0 | Total coins earned |
| `lifetime_spent` | INTEGER | NOT NULL, DEFAULT 0 | Total coins spent |
| `donation_total` | INTEGER | NOT NULL, DEFAULT 0 | Total donated |
| `active_goal_id` | UUID | NULL, FK → finance_goals | Active savings goal |
| `last_allowance_at` | TIMESTAMPTZ | NULL | Last allowance timestamp |
| `goals_snapshot` | JSONB | NULL | Goals summary |
| `created_at` | TIMESTAMPTZ | NOT NULL | Wallet creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Relationships:**
- One-to-one with `users`
- One-to-many with `finance_transactions`
- One-to-many with `finance_goals`
- One-to-many with `finance_inventory`

**RLS:** Users can only access own wallet

---

### `finance_goals`

Savings goals for financial education.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Goal identifier |
| `wallet_id` | UUID | NOT NULL, FK → finance_wallets | Owner wallet ID |
| `user_id` | UUID | NOT NULL, FK → users | Owner user ID |
| `name` | TEXT | NOT NULL | Goal name |
| `target_amount` | INTEGER | NOT NULL | Target coin amount |
| `current_amount` | INTEGER | NOT NULL, DEFAULT 0 | Current saved amount |
| `status` | TEXT | NOT NULL, DEFAULT 'active' | Goal status |
| `deadline` | TIMESTAMPTZ | NULL | Goal deadline |
| `completed_at` | TIMESTAMPTZ | NULL | Completion timestamp |
| `notifications` | JSONB | NULL | Notification settings |
| `created_at` | TIMESTAMPTZ | NOT NULL | Goal creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Status Values:**
- `active`, `completed`, `cancelled`

**RLS:** Users can only access own goals

---

### `finance_transactions`

Transaction history for financial tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Transaction identifier |
| `wallet_id` | UUID | NOT NULL, FK → finance_wallets | Wallet ID |
| `user_id` | UUID | NOT NULL, FK → users | Owner user ID |
| `item_id` | TEXT | NULL | Related item ID |
| `item_name` | TEXT | NULL | Item display name |
| `amount` | INTEGER | NOT NULL | Transaction amount (positive/negative) |
| `transaction_type` | TEXT | NOT NULL, CHECK | Transaction type |
| `category` | TEXT | NOT NULL | Transaction category |
| `description` | TEXT | NULL | Transaction description |
| `metadata` | JSONB | NULL | Additional metadata |
| `balance_after` | INTEGER | NULL | Wallet balance after transaction |
| `related_goal_id` | UUID | NULL, FK → finance_goals | Related goal |
| `related_shop_item_id` | UUID | NULL, FK → finance_shop_items | Shop item |
| `created_at` | TIMESTAMPTZ | NOT NULL | Transaction timestamp |

**Transaction Types:**
- `income`, `expense`, `purchase`, `reward`, `donation`, `allowance`

**RLS:** Users can only access own transactions

---

### `finance_shop_items`

Shop catalog items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Item identifier |
| `sku` | TEXT | NOT NULL, UNIQUE | Stock keeping unit |
| `name` | TEXT | NOT NULL | Item name |
| `description` | TEXT | NULL | Item description |
| `category` | TEXT | NOT NULL, DEFAULT 'general' | Item category |
| `price` | INTEGER | NOT NULL | Price in coins |
| `stock` | INTEGER | NOT NULL, DEFAULT 0 | Available stock |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Item active status |
| `emoji` | TEXT | NULL | Item emoji icon |
| `species_tags` | TEXT[] | DEFAULT '{}' | Compatible species |
| `metadata` | JSONB | NULL | Additional metadata |
| `created_at` | TIMESTAMPTZ | NOT NULL | Item creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Categories:**
- `food`, `toy`, `medicine`, `accessory`, `energy`, `general`

**RLS:** All authenticated users can read, only service role can write

---

### `finance_inventory`

User inventory of purchased items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Inventory entry identifier |
| `wallet_id` | UUID | NOT NULL, FK → finance_wallets | Owner wallet ID |
| `user_id` | UUID | NOT NULL, FK → users | Owner user ID |
| `item_id` | TEXT | NOT NULL | Item identifier |
| `item_name` | TEXT | NOT NULL | Item display name |
| `category` | TEXT | NULL | Item category |
| `quantity` | INTEGER | NOT NULL, DEFAULT 0 | Quantity owned |
| `shop_item_id` | UUID | NULL, FK → finance_shop_items | Shop item reference |
| `created_at` | TIMESTAMPTZ | NOT NULL | Item acquisition timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Unique Constraint:** `(user_id, item_id)`

**RLS:** Users can only access own inventory

---

## Quest System Tables

### `quests`

Quest catalog definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Quest identifier |
| `quest_key` | TEXT | NOT NULL, UNIQUE | Quest key (for referencing) |
| `description` | TEXT | NOT NULL | Quest description |
| `quest_type` | TEXT | NOT NULL, CHECK | Quest type |
| `difficulty` | TEXT | NOT NULL, CHECK | Quest difficulty |
| `rewards` | JSONB | NOT NULL | Rewards configuration |
| `target_value` | INTEGER | NOT NULL, DEFAULT 1 | Target value for completion |
| `icon` | TEXT | NULL | Quest icon |
| `start_at` | TIMESTAMPTZ | NULL | Quest start time |
| `end_at` | TIMESTAMPTZ | NULL | Quest end time |
| `created_at` | TIMESTAMPTZ | NOT NULL | Quest creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Quest Types:**
- `daily`, `weekly`, `event`

**Difficulties:**
- `easy`, `normal`, `hard`, `heroic`

**Rewards JSONB Structure:**
```json
{
  "coins": 50,
  "xp": 100,
  "items": ["item_id_1", "item_id_2"]
}
```

**RLS:** All authenticated users can read, only service role can write

---

### `user_quests`

User quest progress tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Progress identifier |
| `user_id` | UUID | NOT NULL, FK → users | Owner user ID |
| `quest_id` | UUID | NOT NULL, FK → quests | Quest identifier |
| `status` | TEXT | NOT NULL, DEFAULT 'pending', CHECK | Quest status |
| `progress` | INTEGER | NOT NULL, DEFAULT 0, CHECK (>= 0) | Current progress |
| `target_value` | INTEGER | NOT NULL, DEFAULT 1, CHECK (> 0) | Target for completion |
| `last_progress_at` | TIMESTAMPTZ | NULL | Last progress update |
| `completed_at` | TIMESTAMPTZ | NULL | Completion timestamp |
| `claimed_at` | TIMESTAMPTZ | NULL | Reward claim timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL | Progress creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Unique Constraint:** `(user_id, quest_id)`

**Status Values:**
- `pending`, `in_progress`, `completed`, `claimed`

**RLS:** Users can only access own quest progress

---

## Social System Tables

### `friend_requests`

Friend request system.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Request identifier |
| `sender_id` | UUID | NOT NULL, FK → users | Sender user ID |
| `receiver_id` | UUID | NOT NULL, FK → users | Receiver user ID |
| `status` | TEXT | NOT NULL, DEFAULT 'pending', CHECK | Request status |
| `created_at` | TIMESTAMPTZ | NOT NULL | Request creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Unique Constraint:** `(sender_id, receiver_id)`

**Status Values:**
- `pending`, `accepted`, `declined`, `blocked`

**RLS:** Users can read requests where they are sender/receiver

---

### `leaderboard_entries`

Leaderboard rankings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Entry identifier |
| `user_id` | UUID | NOT NULL, FK → users | User ID |
| `category` | TEXT | NOT NULL | Leaderboard category |
| `score` | INTEGER | NOT NULL | User score |
| `rank` | INTEGER | NULL | Current rank |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Categories:**
- `coins`, `care_streak`, `quests_completed`, `evolution_stage`

**RLS:** All authenticated users can read

---

## Game & Analytics Tables

### `game_scores`

Mini-game score tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Score identifier |
| `user_id` | UUID | NOT NULL, FK → users | Player user ID |
| `game_type` | TEXT | NOT NULL | Game type identifier |
| `score` | INTEGER | NOT NULL | Game score |
| `level` | INTEGER | NULL | Game level achieved |
| `coins_earned` | INTEGER | DEFAULT 0 | Coins awarded |
| `xp_earned` | INTEGER | DEFAULT 0 | XP awarded |
| `metadata` | JSONB | NULL | Game-specific metadata |
| `created_at` | TIMESTAMPTZ | NOT NULL | Score timestamp |

**RLS:** Users can read own scores, public high scores readable

---

### `analytics_events`

User activity tracking for analytics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Event identifier |
| `user_id` | UUID | NOT NULL, FK → users | User ID |
| `event_type` | TEXT | NOT NULL | Event type |
| `event_data` | JSONB | NOT NULL | Event data payload |
| `created_at` | TIMESTAMPTZ | NOT NULL | Event timestamp |

**Event Types:**
- `pet_action`, `shop_purchase`, `quest_completed`, `game_played`, `login`

**RLS:** Users can read own events, aggregated data accessible

---

## Relationships & Constraints

### Entity Relationships

```
users (1) ── (1) profiles
users (1) ── (1) finance_wallets
users (1) ── (1) pets
users (1) ── (1) user_preferences

pets (1) ── (*) pet_inventory
pets (1) ── (*) pet_diary_entries

finance_wallets (1) ── (*) finance_transactions
finance_wallets (1) ── (*) finance_goals
finance_wallets (1) ── (*) finance_inventory

quests (1) ── (*) user_quests
users (1) ── (*) user_quests

users (1) ── (*) friend_requests (as sender)
users (1) ── (*) friend_requests (as receiver)
```

### Foreign Key Constraints

All foreign keys use:
- `ON DELETE CASCADE` for dependent records
- `ON DELETE SET NULL` for optional references
- Deferrable constraints where needed for transaction ordering

### Check Constraints

- Stat values constrained to 0-100 range
- Enum-like values enforced via CHECK constraints
- Positive quantities and amounts enforced

---

## Row-Level Security

### RLS Policy Patterns

**Own Data Access:**
```sql
CREATE POLICY "users_select_own"
ON table_name FOR SELECT
USING (auth.uid() = user_id);
```

**Own Data Modification:**
```sql
CREATE POLICY "users_modify_own"
ON table_name FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Public Read:**
```sql
CREATE POLICY "public_read"
ON table_name FOR SELECT
TO authenticated
USING (true);
```

### RLS Coverage

- ✅ All user-specific tables have RLS enabled
- ✅ Policies enforce user data isolation
- ✅ Service role bypasses RLS for admin operations
- ✅ Public data (shop items, quests) readable by all authenticated users

---

## Indexes & Performance

### Primary Indexes

All tables have primary key indexes (automatic)

### Foreign Key Indexes

```sql
CREATE INDEX idx_pets_user_id ON pets(user_id);
CREATE INDEX idx_finance_wallets_user_id ON finance_wallets(user_id);
CREATE INDEX idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX idx_finance_transactions_user_id ON finance_transactions(user_id);
```

### Composite Indexes

```sql
-- Quest lookups by user and status
CREATE INDEX idx_user_quests_user_status ON user_quests(user_id, status);

-- Transaction history ordered by date
CREATE INDEX idx_transactions_user_date ON finance_transactions(user_id, created_at DESC);

-- Active quest window
CREATE INDEX idx_quests_active_window ON quests(start_at, end_at);
```

### Query Optimization

- Indexes on frequently filtered columns
- Composite indexes for multi-column queries
- Partial indexes for status-based queries
- Covering indexes for common SELECT patterns

---

**Document Status:** ✅ Complete  
**Review Date:** January 2025
