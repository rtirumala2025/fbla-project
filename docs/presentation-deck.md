# FBLA Presentation Deck – Virtual Pet Companion

> Use this outline with Google Slides, PowerPoint, or Marp. Each top-level heading (`##`) represents a slide.  
> Suggested timing: 7 minutes total.

---

## Slide 1 – Title & Team
- Project: Virtual Pet Companion – Financial Literacy Through Gameplay
- Team Members: *Add names*
- FBLA Intro to Programming • November 2025
- QR code / short link to live demo

## Slide 2 – Problem & Vision
- Students struggle to connect daily habits with budgeting concepts.
- Traditional lessons lack engagement or personalization.
- Our solution: gamified pet care + real-world finance scenarios + AI coaching.

## Slide 3 – Feature Snapshot
- Adopt & customize animated pets.
- Real-time stat management (hunger, happiness, cleanliness, energy, health).
- Mini-games & shop with balanced economy.
- AI mood insights, health forecasts, and spending advice.
- Accessibility-first design (color-blind, reduced motion, keyboard nav).

## Slide 4 – Architecture Overview
- React + Vite frontend with Supabase JS.
- FastAPI backend exposing domain routers.
- Supabase Postgres for auth, pets, and transactions.
- AI service layer ready for OpenRouter integration.
- Callout: see `docs/architecture-diagram.mmd`.

## Slide 5 – Supabase Data Model
- Profiles (username, coins) auto-created via trigger.
- Pets table with mood/XP stats (1:1 per profile).
- Transactions, inventory, and shop tables for economy.
- RLS policies enforce per-user access.
- Callout: `docs/supabase-erd.mmd`.

## Slide 6 – Demo Highlights
- Onboarding → Dashboard animations.
- Care loop (feed/play/clean/rest) with AI reactions.
- Finance dashboard & CSV export.
- Mini-game quick showcase (Memory Match).
- NextGen Lab (voice, AR, weather concepts).

## Slide 7 – Impact & Outcomes
- Reinforces budgeting vocabulary (income, expense, savings).
- Encourages routine building via streaks and notifications.
- Analytics turn gameplay into reflective learning moments.
- Designed to scale into classroom challenges with leaderboards.

## Slide 8 – Accessibility & Inclusion
- Dual themes + color-blind palette + high contrast.
- Keyboard-first navigation and descriptive tooltips.
- Screen-reader friendly headings and ARIA labels.
- Offline banner + caching for limited connectivity environments.

## Slide 9 – Testing & Quality
- Backend: pytest suites covering AI, finance, pets, analytics.
- Frontend: ESLint, unit tests, and Playwright smoke path.
- Automated coverage report (`reports/test-coverage.md`).
- Seed script ensures consistent judge-ready data.

## Slide 10 – Roadmap & Call-to-Action
- Upcoming: multi-pet families, classroom challenges, mobile PWA.
- AI: live LLM personalities via OpenRouter.
- Hardware: IoT badge for real-world habit tracking.
- Ask judges: feedback on curriculum alignment and partnership ideas.

---

### Presenter Notes
- Pair this deck with `docs/demo-script.md`.
- Embed screenshots/gifs for care loop, analytics, and mini-games.
- Leave time for Q&A; reference user manual for detailed answers.

