# Virtual Pet Frontend - Phase 2

## Run locally
```bash
cd frontend
npm install
npm run dev
```

## Tests
```bash
npm run test
npm run lint
```

## Mocks vs Real Supabase

**Without `.env` file:** The app falls back to a lightweight mock Supabase client. Database operations won't work, but the UI is fully functional for demo/demo purposes.

**To connect to real Supabase:** Create a `.env` file in the `frontend` directory with:
```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_USE_MOCK=false
```

Set `VITE_SUPABASE_USE_MOCK=true` only when you intentionally want to run offline with seeded data. Then restart the dev server: `npm run dev`.

Example Supabase queries used in services:
```ts
// Select user transactions
const { data } = await supabase.from('transactions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Insert a transaction (triggers can update balance)
await supabase.from('transactions').insert({
  user_id: userId,
  item_id: 'reward',
  item_name: 'Completed Chore: Wash Dishes',
  amount: 15,
  transaction_type: 'reward',
});

// Update pet stats
await supabase.from('pets')
  .update({ hunger: 80, updated_at: new Date().toISOString() })
  .eq('id', petId)
  .select()
  .single();

// Read single row
const { data: profile } = await supabase.from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();
```

## Feature map
- BudgetDashboard: `src/pages/budget/BudgetDashboard.tsx`
- Action screens: `src/pages/{feed,clean,play,rest,health}`
- Earn: `src/pages/earn/EarnMoneyScreen.tsx`
- Mini-games: `src/pages/minigames/*`
- Settings: `src/pages/settings/SettingsScreen.tsx`
- Help: `src/pages/help/HelpScreen.tsx`

Refer to `frontend/ACCEPTANCE.md` for judge checklist.
