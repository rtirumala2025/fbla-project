# Frontend Features Lost Due to Revert

**Analysis Date:** Current  
**Reference Commit:** e07415f (Last Full-Feature Commit)  
**Current Branch:** main (HEAD 50e66e8)

This document lists all frontend features and components that existed in commit `e07415f` but are missing in the current main branch.

---

## Pages

- `pages/analytics/AnalyticsDashboard.tsx`
- `pages/events/EventCalendarPage.tsx`
- `pages/finance/WalletPage.tsx`
- `pages/minigames/MemoryMatchGame.tsx`
- `pages/nextgen/NextGenHub.tsx`
- `pages/pets/AvatarStudio.tsx`
- `pages/quests/QuestDashboard.tsx`
- `pages/social/SocialHub.tsx`

---

## Components

### Core Components
- `components/DemoMode.tsx`
- `components/DemoModeBanner.tsx`
- `components/ErrorBoundary.tsx`

### Analytics Components
- `components/analytics/ExpensePieChart.tsx`
- `components/analytics/TrendChart.tsx`

### Coach Components
- `components/coach/CoachPanel.tsx`

### Event Components
- `components/events/EventCalendar.tsx`
- `components/events/SeasonalBanner.tsx`

### Finance Components
- `components/finance/FinancePanel.tsx`

### Layout Components
- `components/layout/AppShell.tsx`

### Mini-Game Components
- `components/minigames/DailyChallengeCard.tsx`
- `components/minigames/GameLeaderboardPanel.tsx`
- `components/minigames/GameResultOverlay.tsx`
- `components/minigames/GameRewardsSummary.tsx`

### Pet Components
- `components/pets/AnimatedPetSprite.tsx`
- `components/pets/PetAIDashboard.tsx`
- `components/pets/PetBubbleMenu.tsx`
- `components/pets/PetCarePanel.tsx`
- `components/pets/PetCustomizationForm.tsx`

### Quest Components
- `components/quests/QuestBoard.tsx`
- `components/quests/QuestCard.tsx`

### Settings Components
- `components/settings/SettingsModal.tsx`

### Social Components
- `components/social/FriendList.tsx`
- `components/social/LeaderboardPanel.tsx`
- `components/social/PublicProfileGrid.tsx`

### Sync Components
- `components/sync/SyncBridge.tsx`
- `components/sync/SyncConflictBanner.tsx`

### UI Components
- `components/ui/AchievementPopup.tsx`
- `components/ui/NotificationCenter.tsx`
- `components/ui/ProgressBar.tsx`
- `components/ui/Skeleton.tsx`
- `components/ui/SyncStatusIndicator.tsx`

---

## Hooks

- `hooks/useAuthActions.ts`
- `hooks/useFinanceRealtime.ts`
- `hooks/useMiniGameRound.ts`
- `hooks/useOfflineCache.ts`
- `hooks/useOfflineStatus.ts`
- `hooks/useProfile.ts`
- `hooks/useSeasonalExperience.ts`
- `hooks/useSound.ts`
- `hooks/useSyncManager.ts`

---

## Contexts

- `contexts/SoundContext.tsx`
- `contexts/SupabaseContext.tsx`
- `contexts/SyncContext.tsx`
- `contexts/ThemeContext.tsx`

---

## API Clients

- `api/accessories.ts`
- `api/analytics.ts`
- `api/art.ts`
- `api/finance.ts`
- `api/games.ts`
- `api/httpClient.ts`
- `api/nextGen.ts`
- `api/pets.ts`
- `api/quests.ts`
- `api/social.ts`
- `api/sync.ts`

---

## Additional Files

### Configuration
- `config/appNavigation.ts`

### Providers
- `providers/AppProviders.tsx`

### Services
- `services/seasonalService.ts`

### Types
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

### Utils
- `utils/authHelpers.ts`

### Entry Point
- `main.tsx`

### Testing
- `setupTests.ts`

---

## Summary Statistics

- **Total Missing Files:** 78
- **Pages:** 8
- **Components:** 30
- **Hooks:** 9
- **Contexts:** 4
- **API Clients:** 11
- **Additional Files:** 16

---

## Notes

- All file paths are relative to `frontend/src/`
- This analysis focuses only on frontend features
- Configuration and build files are included only if directly tied to feature functionality
- Some files may have been refactored or merged into other files rather than completely removed

