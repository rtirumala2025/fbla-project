# Live Demo Script – Virtual Pet Companion

> **Duration:** ~6 minutes (ideal for a 7-minute presentation with Q&A buffer)  
> **Participants:** 2 presenters recommended (Driver + Narrator)  
> **Setup:** Use seeded account from `scripts/seed_competition_data.sql` for predictable data.

---

## Segment 0 – Pre-Demo Checklist (0:00)
- Ensure frontend and backend are running (or deployed versions loaded).
- Log in with the demo account (e.g., `fbla-demo@example.com`).
- Reset pet stats using the seed script if needed.
- Open tabs:
  1. Dashboard (`/dashboard`)
  2. Finance analytics (`/analytics`)
  3. Mini-game (Memory Match `/minigames/memory`)
- Have backup video link from `docs/demo-video.mp4` ready (replace with narrated export).

---

## Segment 1 – Welcome & Vision (0:00 – 0:45)
- **Narrator:** “Welcome! We built Virtual Pet Companion to make financial literacy engaging. Students care for a pet, budget coins, and receive AI coaching tailored to their habits.”
- Mention tech stack succinctly (React, FastAPI, Supabase, AI services).

---

## Segment 2 – Onboarding Snapshot (0:45 – 1:30)
- **Driver:** Briefly show the onboarding flow screenshots or re-run the flow with a secondary account:
  - Species selection
  - Breed customization
  - Name confirmation
- **Narrator:** Highlight 1:1 Supabase profiles + auto-generated coins.
- Optional: show Supabase Table Editor snapshot (preloaded in a separate window).

---

## Segment 3 – Care Loop in Action (1:30 – 3:00)
- **Driver:** Return to dashboard. Hover over stat meters (hunger, happiness, cleanliness, energy).
- Trigger a **Feed** action:
  - Select premium meal from inventory.
  - Point out animated reaction and coin deduction.
- Trigger a **Play** action:
  - Launch quick mini-overlay, show happiness increase, energy decrease.
- Open **AI Insights Sidebar** (if available):
  - Read the top mood summary and recommendation.
- **Narrator:** Explain AI service (deterministic personality + mood scoring) and how diary entries store actions.

---

## Segment 4 – Finance & Analytics (3:00 – 4:15)
- **Driver:** Navigate to `/analytics`.
  - Show coin balance and lifetime stats.
  - Scroll through leaderboard and CSV export button.
- Click “Export CSV” (download prompt to prove feature).
- **Narrator:** Mention `finance_service.py`, budget warnings, and how Supabase `transactions` table feeds charts. Reference alignment with FBLA financial education goals.

---

## Segment 5 – Mini-Game Spotlight (4:15 – 5:00)
- **Driver:** Switch to Memory Match game.
  - Play one quick round (match two cards).
  - Point out earned coins and XP.
- **Narrator:** Connect game difficulty scaling to AI recommendations, reinforcing habit loops.

---

## Segment 6 – Next-Gen Lab Preview (5:00 – 5:30)
- **Driver:** Open `/nextgen`.
  - Highlight voice command prototype tile and AR/weather concept cards.
- **Narrator:** “These represent our roadmap—expanding into voice control, AR sessions, and social pings so students can collaborate.”

---

## Segment 7 – Wrap-Up & Call-to-Action (5:30 – 6:00)
- **Narrator:** Summarize outcomes (financial vocabulary, routine building, analytics reflection).
- Invite questions about accessibility (color-blind mode toggle), AI integrations, or classroom usage.
- Mention supporting docs: `README.md`, `docs/user-manual.md`, coverage report, and seed script.

---

## Backup Plan
- If live services fail, play the recorded walkthrough stored at `docs/demo-video.mp4`.
- Have static screenshots in the slide deck to narrate the experience.

---

### Presenter Tips
- Use the **Narration** notes in `docs/presentation-deck.md` to stay synchronized with slides.
- Keep the cursor movement deliberate; zoom in on charts if judges are distant.
- Practice the flow twice with the seeded account to ensure consistent stats.

