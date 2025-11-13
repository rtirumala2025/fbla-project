# Frontend Rebuild Plan

**Status:** In Progress  
**Strategy:** Incremental, safe rebuild with frequent commits

## Rebuild Order (Dependency-Based)

### Phase 1: Foundation Layer
1. **Type Definitions** (10 files)
   - `types/accessories.ts`
   - `types/analytics.ts`
   - `types/art.ts`
   - `types/events.ts`
   - `types/finance.ts`
   - `types/game.ts`
   - `types/nextGen.ts`
   - `types/quests.ts`
   - `types/social.ts`
   - `types/sync.ts`

2. **Utils**
   - `utils/authHelpers.ts`

### Phase 2: API & Data Layer
3. **API Clients** (11 files)
   - `api/httpClient.ts` (base client - must be first)
   - `api/accessories.ts`
   - `api/analytics.ts`
   - `api/art.ts`
   - `api/finance.ts`
   - `api/games.ts`
   - `api/nextGen.ts`
   - `api/pets.ts`
   - `api/quests.ts`
   - `api/social.ts`
   - `api/sync.ts`

### Phase 3: State Management
4. **Contexts** (4 files)
   - `contexts/ThemeContext.tsx`
   - `contexts/SoundContext.tsx`
   - `contexts/SyncContext.tsx`
   - `contexts/SupabaseContext.tsx`

5. **Hooks** (9 files)
   - `hooks/useAuthActions.ts`
   - `hooks/useFinanceRealtime.ts`
   - `hooks/useMiniGameRound.ts`
   - `hooks/useOfflineCache.ts`
   - `hooks/useOfflineStatus.ts`
   - `hooks/useProfile.ts`
   - `hooks/useSeasonalExperience.ts`
   - `hooks/useSound.ts`
   - `hooks/useSyncManager.ts`

6. **Services**
   - `services/seasonalService.ts`

### Phase 4: UI Components
7. **Core Components** (3 files)
   - `components/ErrorBoundary.tsx`
   - `components/DemoMode.tsx`
   - `components/DemoModeBanner.tsx`

8. **UI Components** (5 files)
   - `components/ui/AchievementPopup.tsx`
   - `components/ui/NotificationCenter.tsx`
   - `components/ui/ProgressBar.tsx`
   - `components/ui/Skeleton.tsx`
   - `components/ui/SyncStatusIndicator.tsx`

9. **Feature Components** (22 files)
   - Analytics: `ExpensePieChart.tsx`, `TrendChart.tsx`
   - Coach: `CoachPanel.tsx`
   - Events: `EventCalendar.tsx`, `SeasonalBanner.tsx`
   - Finance: `FinancePanel.tsx`
   - Layout: `AppShell.tsx`
   - Mini-games: `DailyChallengeCard.tsx`, `GameLeaderboardPanel.tsx`, `GameResultOverlay.tsx`, `GameRewardsSummary.tsx`
   - Pets: `AnimatedPetSprite.tsx`, `PetAIDashboard.tsx`, `PetBubbleMenu.tsx`, `PetCarePanel.tsx`, `PetCustomizationForm.tsx`
   - Quests: `QuestBoard.tsx`, `QuestCard.tsx`
   - Settings: `SettingsModal.tsx`
   - Social: `FriendList.tsx`, `LeaderboardPanel.tsx`, `PublicProfileGrid.tsx`
   - Sync: `SyncBridge.tsx`, `SyncConflictBanner.tsx`

### Phase 5: Pages
10. **Pages** (8 files)
    - `pages/analytics/AnalyticsDashboard.tsx`
    - `pages/events/EventCalendarPage.tsx`
    - `pages/finance/WalletPage.tsx`
    - `pages/minigames/MemoryMatchGame.tsx`
    - `pages/nextgen/NextGenHub.tsx`
    - `pages/pets/AvatarStudio.tsx`
    - `pages/quests/QuestDashboard.tsx`
    - `pages/social/SocialHub.tsx`

### Phase 6: Configuration & Entry
11. **Config & Providers**
    - `config/appNavigation.ts`
    - `providers/AppProviders.tsx`

12. **Entry Point & Testing**
    - `main.tsx` (if needed - currently using index.js)
    - `setupTests.ts`

## Commit Strategy

- Commit after each logical group (e.g., all types, all API clients)
- Test build after each commit
- Run frontend dev server to verify no runtime errors
- After every 2-3 commits, run full test suite

## Testing Checklist

After each phase:
- [ ] `npm run build` succeeds
- [ ] `npm start` runs without errors
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Existing features still work

