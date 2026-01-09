# Virtual Pet Companion – User Manual

> **Version:** 1.0 (November 2025)  
> **Audience:** FBLA judges, student presenters, and demo participants  
> **How to share:** Export this Markdown to PDF (e.g., `npx @marp-team/marp-cli docs/user-manual.md --pdf`) or print directly from Cursor.

---

## Table of Contents
1. [Welcome](#welcome)
2. [System Requirements](#system-requirements)
3. [Getting Started](#getting-started)
4. [Home & Navigation](#home--navigation)
5. [Caring for Your Pet](#caring-for-your-pet)
6. [AI Companion Features](#ai-companion-features)
7. [Finance & Budgeting](#finance--budgeting)
8. [Mini-Games & Challenges](#mini-games--challenges)
9. [Analytics & Reports](#analytics--reports)
10. [Accessibility & Inclusivity](#accessibility--inclusivity)
11. [Next-Gen Innovation Lab](#next-gen-innovation-lab)
12. [Troubleshooting & FAQs](#troubleshooting--faqs)
13. [Glossary](#glossary)

---

## Welcome
The Virtual Pet Companion blends fun pet care with real-world financial literacy. Students adopt a digital friend, earn and spend coins responsibly, and receive AI-powered coaching that adapts to their play style.

This guide walks end-users through the full experience—from signing up to advanced analytics—so you can comfortably present or evaluate the app during FBLA competition.

---

## System Requirements
- Modern desktop browser (Chrome, Edge, Safari, Firefox) with JavaScript enabled.
- Optional microphone for voice command prototypes (Next-Gen Lab).
- Stable internet connection to sync with Supabase (works offline in limited mode).
- Screen reader support tested on macOS VoiceOver and NVDA.

---

## Getting Started
1. **Visit the app** using the deployment URL or `http://localhost:5173` in development.
2. **Create an account** via Email/Password or Supabase magic link (if enabled).
3. **Verify your email** (Supabase handles this automatically).
4. **Complete onboarding:**
   - Choose species and breed.
   - Customize colors and name.
   - Confirm starting personality quiz (optional).
5. **Land on the dashboard** where your pet is animated and core stats are visible.

---

## Home & Navigation
- **Header Bar:** Displays coins, notifications, theme toggle, and quick actions.
- **Floating Action Buttons:** Shortcuts to feed, play, clean, and rest screens.
- **Sidebar / Drawer:** Access shop, analytics, mini-games, settings, and help.
- **Status Chips:** Live meters for hunger, happiness, cleanliness, energy, and health.
- **Toast Notifications:** Provide instant feedback (e.g., “+15 coins earned!”).

---

## Caring for Your Pet
Each care action adjusts multiple stats and leaves a record in the AI diary.

| Action | Description | Impact | Cooldown |
| ------ | ----------- | ------ | -------- |
| Feed   | Serve meals or treats selected from inventory. | Increases hunger, happiness. | 5 minutes |
| Play   | Launch quick activities (fetch, puzzles). | Boosts happiness, can lower energy. | 3 minutes |
| Clean  | Bathe or groom. | Raises cleanliness and health. | 10 minutes |
| Rest   | Put pet to sleep or schedule naps. | Restores energy; slight hunger loss. | Dynamic |

Tips:
- Combine actions with shop purchases (e.g., vitamins) to supercharge recovery.
- Keep an eye on the AI recommendations sidebar for mood-specific advice.

---

## Pet Emotion System

### Overview

Your virtual pet's emotional state changes based on how well you care for them. The emotion system teaches you about responsibility and the importance of consistent care.

### Understanding Emotions

Your pet displays 6 different emotional states based on their care statistics:

#### 1. Ecstatic 😄
- **When:** Average of all stats is 80 or higher
- **Visual Indicators:** Jumping, wagging tail, bright vibrant colors, high energy
- **Meaning:** Your pet is extremely well cared for! Excellent job!
- **How to Achieve:** Keep all stats (hunger, happiness, hygiene, energy, health) above 75

#### 2. Happy 😊  
- **When:** Average of all stats is between 60-79
- **Visual Indicators:** Smiling, relaxed posture, normal colors
- **Meaning:** Your pet is content and well-maintained
- **How to Achieve:** Regular feeding, playing, and cleaning

#### 3. Content 😐
- **When:** Average of all stats is between 40-59
- **Visual Indicators:** Neutral expression, calm demeanor
- **Meaning:** Your pet's needs are being met at a basic level
- **How to Achieve:** Occasional care, minimum maintenance

#### 4. Anxious 😟
- **When:** Average of all stats is between 25-39
- **Visual Indicators:** Worried expression, lower energy, muted colors
- **Meaning:** Your pet is starting to feel neglected
- **Action Needed:** Increase care frequency immediately

#### 5. Distressed 😢
- **When:** Average of all stats is below 25
- **Visual Indicators:** Sad appearance, drooping posture, dull colors, low activity
- **Meaning:** Severe neglect - your pet needs immediate attention
- **Action Needed:** Focus on raising all stats above 40

#### 6. Sick/Ill 🤒
- **When:** ANY single stat drops to 20 or below
- **Visual Indicators:** Lying down, weak movements, concerned appearance
- **Meaning:** Critical condition - one or more needs are severely lacking
- **Action Needed:** Immediate vet visit recommended, address the lowest stat first

### Care Stats Explained

Your pet has 5 core statistics that determine their emotional state:

| Stat | Range | What It Represents | How to Improve |
|------|-------|-------------------|----------------|
| **Hunger** | 0-100 | How well-fed your pet is | Feed your pet ($5 per feeding, +30 points) |
| **Happiness** | 0-100 | Your pet's joy and contentment | Play with your pet (Free, +20 points) |
| **Hygiene** | 0-100 | Cleanliness and grooming | Clean your pet ($3 per bath, +30 points) |
| **Energy** | 0-100 | Rest and vitality levels | Let your pet rest (Free, +25 points) |
| **Health** | 0-100 | Overall physical wellness | Visit the vet ($25 per visit, +30 points) |

### Stat Decay

**Important:** Stats naturally decrease over time to simulate real pet needs:
- Hunger decreases by 5 points per hour
- Happiness decreases by 3 points per hour
- Hygiene decreases by 2 points per hour
- Energy decreases by 4 points per hour (when active)
- Health remains stable unless other stats are very low

### Financial Impact on Care

Every care action costs money, teaching you about the financial responsibility of pet ownership:

| Care Action | Cost | Primary Benefit | Secondary Effects |
|-------------|------|-----------------|-------------------|
| **Feed** | $5 | Hunger +30 | Energy +10, prevents illness |
| **Play** | $0 | Happiness +20 | Energy -5, bonds with pet |
| **Clean** | $3 | Hygiene +30 | Happiness +5, prevents illness |
| **Rest** | $0 | Energy +25 | Slight happiness increase |
| **Vet Visit** | $25 | Health +30 | Comprehensive checkup, prevents serious illness |

### Emotional Care Strategy

**Best Practices for Happy Pet:**

1. **Balanced Care:** Don't focus on just one stat. A pet with 100 hunger but 0 hygiene will still be "Sick"
2. **Budget Wisely:** Keep at least $25 for emergency vet visits
3. **Daily Routine:** Feed and clean daily, play frequently, rest when energy is low
4. **Monitor Visual Cues:** Watch your pet's appearance and emotion for early warning signs
5. **Preventive Care:** It's cheaper to maintain stats than to fix neglect

**Warning Signs:**
- If ANY stat drops below 30, take immediate action
- If multiple stats are below 50, your pet will become anxious
- Sick pets may require multiple care actions to recover

### Examples

**Scenario 1: Well-Cared Pet**
- Stats: Hunger 85, Happiness 90, Hygiene 80, Energy 95, Health 100
- Average: 90
- Emotion: **Ecstatic** 😄
- Cost: ~$15/day in care

**Scenario 2: Neglected Pet**  
- Stats: Hunger 15, Happiness 30, Hygiene 25, Energy 40, Health 35
- Average: 29 | Critical Stat: Hunger (15)
- Emotion: **Sick** 🤒
- Needed: Immediate feed ($5) + Vet visit ($25) = $30 to recover

**Scenario 3: Budget Emergency**
- Balance: $2
- Pet Stats: All declining
- Problem: Can't afford food ($5) or cleaning ($3)
- Solution: Play (free) and Rest (free) until you earn more coins

### Learning Objective

This emotion system teaches:
- **Responsibility:** Consistent care prevents emergencies
- **Financial Planning:** Budgeting for ongoing and unexpected costs
- **Cause and Effect:** Your actions directly impact your pet's wellbeing
- **Priority Management:** Identifying urgent needs vs. routine care

By understanding how your pet's emotions work, you can provide better care while learning valuable life skills about responsibility and budgeting!

---

## AI Companion Features
The AI service observes stats, diary entries, and care history to guide players.

- **Mood Analysis:** Scores happiness, health, energy, cleanliness, and hunger to classify the current mood (Happy, Hungry, Tired, Sad, Sick).
- **Personality Profile:** Deterministically assigns traits (e.g., Playful, Gentle) that tweak stat decay rates.
- **Notifications:** Issues warnings for low stats or congratulates strong routines.
- **Natural Language Commands:** Enter phrases like “Give Luna a long nap” to trigger recommended actions.
- **Health Forecast:** Predicts upcoming risks with a short summary and contributing factors.
- **Mini-Game Difficulty:** Suggests gentle, standard, or advanced challenges based on care performance.

All AI insights are generated locally through the `app/services/ai_service.py` stubs and can be swapped with a live OpenRouter integration for extended demos.

---

## Finance & Budgeting
Students learn real budgeting by earning and spending responsibly.

- **Wallet Overview:** Displays balance, lifetime earned/spent, and budget warnings.
- **Earn Screen (`/earn`):** Complete chores, lessons, or streaks for coins. Each activity includes a description reinforcing financial vocabulary (allowance, income, savings).
- **Shop (`/shop`):** Buy consumables, toys, and health items. Categories correspond to Needs vs Wants for easy discussion with judges.
- **Inventory:** Track owned items and their quantities. Use items during care actions.
- **Transactions Ledger:** Filterable list of expenses/income with timestamps.
- **Leaderboard:** Friendly competition showing top savers and care scores (aggregated from transaction metadata).

Encourage players to set weekly savings goals and monitor the AI “budget warnings” for coaching moments.

---

## Mini-Games & Challenges
Mini-games reinforce decision making and reaction skills while rewarding coins.

- **Fetch Game:** Timed clicks to catch treats; showcases adaptive difficulty.
- **Puzzle Game:** Drag-and-drop logic puzzles that emphasize planning.
- **Reaction Game:** Reflex challenge with progressive speed.
- **Memory Match:** Card-matching exercise to improve focus.
- **DreamWorld:** Guided meditation for mindful rest; pairs with energy restoration.
- **NextGen Hub:** Prototype space for future AR, weather-based care, and social play.

Each mini-game grants coins, experience points (XP), and diary entries consumed by AI analytics.

---

## Analytics & Reports
Navigate to `/analytics` to review dashboards:

- **Daily Overview:** Line and bar charts for stat changes, coins earned/spent.
- **Weekly Summary:** AI-generated suggestions, goal progress, and streak badges.
- **CSV Export:** Download data for spreadsheets or judge review.
- **AI Insights Panel:** Summaries pulled from mood, personality, and care-style analysis.
- **Health Timeline:** Visualizes how rest, play, and nutrition interact over time.

Pro Tip: Demonstrate exporting CSV, then open it in a spreadsheet to show real-world applicability.

---

## Accessibility & Inclusivity
- **Theme Toggle:** Light/Dark and high contrast modes.
- **Color-Blind Safe Palette:** Verified with Tetracolor and WCAG AA compliance.
- **Keyboard Navigation:** All interactive elements include focus rings and shortcuts (documented on `/help`).
- **Reduced Motion:** Disables parallax and intense animations for sensitive users.
- **Screenshots & Audio:** Tooltips provide text equivalents for sound cues.

---

## Next-Gen Innovation Lab
Discuss these future-facing concepts during your presentation:

- **Voice Commands:** Prototype interface for “Hey Companion, feed Spark!” (integrates with AI parser).
- **AR Sessions:** Placeholder cards for projecting pets into augmented reality.
- **Weather Reactions:** Pulls live weather (mocked) to influence pet mood.
- **Social Pings:** Concept for exchanging care packages with classmates.

These features demonstrate vision beyond the core requirement and invite judge questions.

---

## Troubleshooting & FAQs
**Q: My stats are not updating.**  
A: Ensure you are online. If the offline banner is visible, stats cache locally and sync once reconnected.

**Q: I forgot my password.**  
A: Use Supabase’s password reset link from the login page.

**Q: The AI responses feel repetitive.**  
A: That’s expected with the deterministic stub. Enable OpenRouter in `.env` for live responses.

**Q: Why is the shop empty?**  
A: Run the seed script (`scripts/seed_competition_data.sql`) or confirm Supabase migrations were executed.

**Q: Can multiple pets be managed?**  
A: Currently limited to one pet per profile to simplify analytics. Roadmap includes multi-pet support.

---

## Glossary
- **Coins:** In-app currency earned via activities and spent in the shop.
- **XP (Experience Points):** Progress measure unlocking achievements.
- **RLS (Row Level Security):** Supabase feature ensuring users access only their data.
- **Supabase:** Backend-as-a-service providing Postgres, auth, and storage.
- **OpenRouter:** Optional AI gateway for advanced language model responses.

---

**Need presenter tips?** Pair this manual with `docs/presentation-deck.md` and `docs/demo-script.md` to deliver a confident FBLA demo. Good luck! 🎉

