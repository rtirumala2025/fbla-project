# Game Logic - FBLA Virtual Pet Companion

**Version:** 1.0.0  
**Last Updated:** January 2025

---

## Table of Contents

1. [Pet Care System](#pet-care-system)
2. [Stat Management](#stat-management)
3. [Evolution System](#evolution-system)
4. [Quest System](#quest-system)
5. [Financial System](#financial-system)
6. [Reward System](#reward-system)
7. [Game Loop](#game-loop)
8. [AI Companion](#ai-companion)

---

## Pet Care System

### Core Actions

The pet care system provides four primary actions that affect pet stats:

#### 1. Feed Action

**Purpose:** Restore hunger and happiness

**Mechanics:**
- Base hunger increase: +30 points
- Happiness bonus: +5 points
- Cost: 10 coins (basic food)
- Cooldown: 5 minutes

**Implementation:**
```python
hunger = min(100, current_hunger + 30)
happiness = min(100, current_happiness + 5)
coins = max(0, current_coins - 10)
```

**Shop Items:**
- Basic Food (10 coins): +30 hunger
- Premium Food (25 coins): +40 hunger, +10 happiness
- Treat (5 coins): +15 hunger, +20 happiness

#### 2. Play Action

**Purpose:** Increase happiness and bond with pet

**Mechanics:**
- Base happiness increase: +25 points
- Energy decrease: -15 points (pet gets tired)
- Cost: FREE
- Cooldown: 3 minutes

**Game Types:**
- Fetch: Quick action, standard rewards
- Puzzle: Mental stimulation, +XP bonus
- Memory Match: Focus training, +happiness bonus

**Implementation:**
```python
happiness = min(100, current_happiness + 25)
energy = max(0, current_energy - 15)
```

#### 3. Bathe Action

**Purpose:** Improve cleanliness and health

**Mechanics:**
- Base cleanliness increase: +40 points
- Health bonus: +5 points
- Cost: 15 coins
- Cooldown: 10 minutes

**Implementation:**
```python
cleanliness = min(100, current_cleanliness + 40)
health = min(100, current_health + 5)
coins = max(0, current_coins - 15)
```

#### 4. Rest Action

**Purpose:** Restore energy and health

**Mechanics:**
- Base energy increase: +35 points
- Health bonus: +5 points
- Hunger decrease: -5 points (pet needs food after rest)
- Cost: FREE
- Duration: Variable (1-8 hours)

**Implementation:**
```python
energy = min(100, current_energy + 35)
health = min(100, current_health + 5)
hunger = max(0, current_hunger - 5)
```

---

## Stat Management

### Stat Categories

Pets have five core stats, each ranging from 0 to 100:

1. **Health** (0-100)
   - Overall pet wellbeing
   - Affected by all actions
   - Critical threshold: < 30 (pet becomes sick)

2. **Hunger** (0-100)
   - Need for food
   - Decays over time
   - Critical threshold: < 20 (pet is starving)

3. **Happiness** (0-100)
   - Emotional wellbeing
   - Affected by play and social interactions
   - Critical threshold: < 25 (pet is sad)

4. **Cleanliness** (0-100)
   - Hygiene level
   - Decays slowly over time
   - Critical threshold: < 30 (pet is dirty)

5. **Energy** (0-100)
   - Activity capacity
   - Depleted by play, restored by rest
   - Critical threshold: < 20 (pet is exhausted)

### Stat Decay System

Stats automatically decrease over time based on decay rates:

**Decay Rates (per hour):**
- Health: -1 (if other stats low)
- Hunger: -5 points/hour
- Happiness: -2 points/hour
- Cleanliness: -3 points/hour
- Energy: -4 points/hour (if active)

**Decay Calculation:**
```python
# Decay rates adjusted by pet personality and care history
base_decay_rate = {
    'hunger': 5,
    'happiness': 2,
    'cleanliness': 3,
    'energy': 4
}

# Personality modifiers
personality_modifier = {
    'playful': {'happiness': 0.8, 'energy': 1.2},
    'calm': {'happiness': 0.6, 'energy': 0.8},
    'active': {'hunger': 1.2, 'energy': 1.3}
}

# Calculate actual decay
decay = base_decay_rate * personality_modifier * time_elapsed
```

### Stat Clamping

All stats are clamped to valid ranges:
- Minimum: 0
- Maximum: 100
- Automatic clamping on all updates

---

## Evolution System

### Evolution Stages

Pets progress through four evolution stages:

1. **Egg** (Initial Stage)
   - Starting stage for all new pets
   - Basic stats: All 70-80
   - No special abilities

2. **Juvenile** (Level 5+)
   - Unlocks at level 5 with 500 XP
   - Enhanced stat bonuses
   - Access to more shop items

3. **Adult** (Level 15+)
   - Unlocks at level 15 with 2000 XP
   - Maximum stat efficiency
   - Access to all features

4. **Legendary** (Level 30+)
   - Unlocks at level 30 with 5000 XP
   - Special appearance
   - Bonus rewards from actions

### Evolution Triggers

Evolution occurs when:
1. Pet reaches required level
2. Pet accumulates required XP
3. All stats are above 50 (healthy state)
4. Pet is not sick

**Evolution Process:**
```python
if pet.level >= evolution_requirements[stage]['level']:
    if pet.xp >= evolution_requirements[stage]['xp']:
        if all_stats_above_threshold(pet, 50):
            evolve_pet(pet, next_stage)
            award_evolution_rewards(pet)
```

### Level Progression

**XP Sources:**
- Care actions: +10 XP each
- Quest completion: Variable (50-200 XP)
- Mini-games: +5-25 XP based on score
- Daily login: +20 XP

**Level Requirements:**
- Level 1-5: 100 XP per level
- Level 6-15: 200 XP per level
- Level 16-30: 500 XP per level
- Level 31+: 1000 XP per level

---

## Quest System

### Quest Types

#### Daily Quests

**Reset Time:** Midnight UTC

**Examples:**
- Feed your pet 3 times (Reward: 50 coins, 100 XP)
- Complete 2 play sessions (Reward: 30 coins, 50 XP)
- Maintain happiness above 80 (Reward: 40 coins, 75 XP)

**Reset Logic:**
```python
# Calculate next reset
now = datetime.now(timezone.utc)
tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)

# Reset daily quests
if now >= reset_time:
    reset_daily_quests(user_id)
```

#### Weekly Quests

**Reset Time:** Monday 00:00 UTC

**Examples:**
- Complete 10 care actions (Reward: 150 coins, 300 XP)
- Earn 500 coins (Reward: 200 coins, 400 XP)
- Reach level 10 (Reward: 250 coins, 500 XP)

#### Event Quests

**Duration:** Variable (seasonal events, special occasions)

**Examples:**
- Holiday event: Collect special items
- Limited-time challenge: Achieve specific goals

### Quest Progress Tracking

**Status States:**
1. `pending` - Quest not started
2. `in_progress` - Progress made, not complete
3. `completed` - Goal achieved, reward available
4. `claimed` - Reward collected

**Progress Updates:**
```python
# Update quest progress
user_quest = get_user_quest(user_id, quest_id)
user_quest.progress += increment
user_quest.last_progress_at = now()

# Check completion
if user_quest.progress >= user_quest.target_value:
    user_quest.status = 'completed'
    user_quest.completed_at = now()
```

### Quest Completion

**Completion Flow:**
1. Player completes objective
2. Backend validates completion
3. Quest status set to `completed`
4. Rewards added to pending pool
5. Player claims rewards
6. Quest status set to `claimed`

**Reward Calculation:**
```python
rewards = quest.rewards
coins_awarded = rewards.get('coins', 0)
xp_awarded = rewards.get('xp', 0)
items_awarded = rewards.get('items', [])

# Apply rewards
wallet.balance += coins_awarded
pet.xp += xp_awarded
inventory.add_items(items_awarded)
```

---

## Financial System

### Coin Economy

**Income Sources:**
- Daily login bonus: 20 coins
- Quest completion: 30-250 coins
- Mini-game rewards: 5-50 coins
- Streak bonuses: 10-100 coins

**Expense Categories:**
- Food: 5-25 coins
- Toys: 10-50 coins
- Medicine: 15-40 coins
- Accessories: 20-100 coins

### Budget Management

**Budget Advisor AI:**
- Analyzes spending patterns
- Provides recommendations
- Forecasts future expenses
- Suggests savings goals

**Spending Limits:**
- Cannot spend more than balance
- Validation on all purchases
- Transaction history tracking

### Savings Goals

**Goal Types:**
- Short-term: < 7 days (smaller amounts)
- Medium-term: 7-30 days (medium amounts)
- Long-term: 30+ days (large amounts)

**Goal Mechanics:**
```python
# Create goal
goal = SavingsGoal(
    name="Premium Accessory",
    target_amount=500,
    deadline=datetime.now() + timedelta(days=14)
)

# Track progress
goal.current_amount = wallet.balance
progress_percentage = (goal.current_amount / goal.target_amount) * 100

# Check completion
if goal.current_amount >= goal.target_amount:
    goal.status = 'completed'
    goal.completed_at = now()
```

---

## Reward System

### Reward Types

1. **Coins**
   - Primary currency
   - Used for shop purchases
   - Accumulated through gameplay

2. **Experience Points (XP)**
   - Level progression
   - Evolution requirements
   - Unlocks new features

3. **Items**
   - Shop items
   - Special accessories
   - Consumable items

4. **Achievements**
   - Badges for milestones
   - Displayed on profile
   - Social recognition

### Reward Calculation

**Multiplier System:**
- Base reward: Quest-defined amount
- Difficulty multiplier: Easy (1.0x), Normal (1.2x), Hard (1.5x), Heroic (2.0x)
- Streak bonus: +10% per day (max 50%)
- Evolution bonus: +25% for legendary pets

**Formula:**
```python
base_reward = quest.rewards['coins']
difficulty_mult = {'easy': 1.0, 'normal': 1.2, 'hard': 1.5, 'heroic': 2.0}[quest.difficulty]
streak_mult = 1.0 + min(0.5, streak_days * 0.1)
evolution_mult = 1.25 if pet.evolution_stage == 'legendary' else 1.0

final_reward = base_reward * difficulty_mult * streak_mult * evolution_mult
```

---

## Game Loop

### Frontend Game Loop

**Update Frequency:** Every 30 seconds

**Process:**
1. Check elapsed time since last update
2. Calculate stat decay based on time
3. Update pet stats in database
4. Check for quest progress updates
5. Trigger notifications if thresholds crossed
6. Sync with global state store

**Implementation:**
```typescript
setInterval(() => {
  const elapsedMinutes = (Date.now() - lastUpdate) / 60000;
  
  // Calculate decay
  const decay = calculateDecay(elapsedMinutes, pet);
  
  // Update stats
  updatePetStats({
    hunger: Math.max(0, pet.hunger - decay.hunger),
    happiness: Math.max(0, pet.happiness - decay.happiness),
    cleanliness: Math.max(0, pet.cleanliness - decay.cleanliness),
    energy: Math.max(0, pet.energy - decay.energy)
  });
  
  // Check notifications
  checkStatThresholds(pet);
  
  // Sync with backend
  syncPetState(pet);
}, 30000); // 30 seconds
```

### Backend Scheduled Tasks

**Daily Reset (Midnight UTC):**
- Reset daily quests
- Calculate daily login bonuses
- Update leaderboards
- Generate daily summaries

**Hourly Tasks:**
- Clean up expired sessions
- Process pending notifications
- Update analytics aggregations

---

## AI Companion

### Mood Calculation

**Mood Determination:**
```python
# Weighted average of stats
stat_weights = {
    'happiness': 0.3,
    'health': 0.25,
    'hunger': 0.2,
    'cleanliness': 0.15,
    'energy': 0.1
}

mood_score = sum(stat * weight for stat, weight in stat_weights.items())

# Map to mood enum
if mood_score >= 85:
    mood = 'ecstatic'
elif mood_score >= 70:
    mood = 'happy'
elif mood_score >= 50:
    mood = 'content'
elif mood_score >= 30:
    mood = 'anxious'
else:
    mood = 'distressed'
```

### Health Forecasting

**Forecast Factors:**
1. Current stat levels
2. Decay rates
3. Recent care actions
4. Pet age and evolution stage

**Risk Assessment:**
- Low risk: All stats > 50, stable trends
- Medium risk: Some stats < 50, declining trends
- High risk: Critical stats < 30, rapid decline

### Personalized Recommendations

**Recommendation Types:**
1. **Immediate Actions:** Critical stat warnings
2. **Optimization:** Efficient care strategies
3. **Long-term:** Evolution and progression goals
4. **Social:** Friend interactions, leaderboard competition

---

**Document Status:** ✅ Complete  
**Review Date:** January 2025
