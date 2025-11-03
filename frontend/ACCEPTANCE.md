# Phase 2A Acceptance Checklist

Use this to verify the Companion Virtual Pet frontend:

## Screens
- [ ] Feed Screen: select food, cost vs. benefits, purchase updates stats
- [ ] Clean Screen: options and costs, success feedback
- [ ] Play Screen: activity grid and mini-game launcher
- [ ] Rest Screen: duration selector and background timer
- [ ] Health Check: report and treatments
- [ ] Budget Dashboard: charts, filters, table, CSV export
- [ ] Earn Money: chores with cooldowns, mini-games tab, achievements list
- [ ] Settings & Help: toggles, export data, reset progress, FAQ

## Analytics
- [ ] Summary cards compute income/expenses/net
- [ ] Pie (categories) and Bar (time series) render mock data
- [ ] Transaction table sorts and exports CSV

## Mini-Games
- [ ] Fetch, Puzzle, Reaction, Dream World render and complete
- [ ] Skip for demo works

## Accessibility
- [ ] All actionable elements reachable by keyboard
- [ ] Reduced motion respected (OS-level)
- [ ] High-contrast toggle works in Settings

## Integration
- [ ] USE_MOCK toggles mock vs Supabase
- [ ] Transactions update budget views

## Commands
```bash
cd frontend
npm install
npm run start
# Visit /dashboard, /budget, /earn, /actions/*, /settings, /help
```
