/**
 * Dashboard Page
 * Main dashboard view for the virtual pet application
 */
import { usePet } from '../context/PetContext';
import { useFinancial } from '../context/FinancialContext';
import { useAuth } from '../contexts/AuthContext';

type DashboardProps = {
  onSignOut?: () => void;
  mode?: 'demo' | 'live';
};

export const Dashboard = ({ onSignOut, mode = 'live' }: DashboardProps) => {
  const isDemo = mode === 'demo';
  const { currentUser } = useAuth();
  const { pet, loading: petLoading } = usePet();
  const { balance, transactions, loading: financeLoading } = useFinancial();

  // Get live data or fallback to demo data
  const petName = !isDemo && pet ? pet.name : 'Nova the Arctic Fox';
  const petLevel = !isDemo && pet ? pet.level : 7;
  const petHappiness = !isDemo && pet ? pet.stats.happiness ?? 92 : 92;
  const petEnergy = !isDemo && pet ? pet.stats.energy ?? 76 : 76;
  const walletBalance = !isDemo ? balance : 1250;
  const lastTransaction = !isDemo && transactions.length > 0
    ? transactions[0] 
    : { description: 'Pet spa day', amount: -25 };

  // Safely compute experience progress and hunger-based tip
  const experiencePercent = !isDemo && pet && typeof pet.experience === 'number'
    ? (pet.experience % 1000) / 10
    : 75;

  const isPetHungry = !isDemo && pet && typeof pet.stats.hunger === 'number'
    ? pet.stats.hunger < 50
    : false;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-indigo-600 text-white shadow">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-200">Virtual Pet FBLA</p>
            <h1 className="text-2xl font-bold">Companion Dashboard</h1>
            <p className="text-sm text-indigo-100">
              {isDemo ? 'Demo Mode — explore the experience with sample data.' : 'Live data session.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isDemo && (
              <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-200">
                Demo preview
              </span>
            )}
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-white/20"
            >
              {isDemo ? 'Back to demo home' : 'Sign out'}
            </button>
          </div>
        </div>
      </header>

      {isDemo && (
        <div className="border-b border-amber-200 bg-amber-50">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-amber-800">
            <p className="text-sm font-medium">Demo Mode – Live data disabled</p>
            <p className="text-xs text-amber-600">All interactions shown below use static sample data.</p>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="grid gap-6 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Featured Pet</p>
            {petLoading && !isDemo ? (
              <div className="mt-2 text-sm text-slate-500">Loading pet data...</div>
            ) : (
              <>
                <h2 className="mt-2 text-xl font-bold text-slate-900">{petName}</h2>
                <p className="mt-3 text-sm text-slate-600">
                  Level {petLevel} • Happiness {petHappiness} • Energy {petEnergy}
                </p>
                <div className="mt-4 h-2 rounded-full bg-slate-100">
                  <div 
                    className="h-2 rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${experiencePercent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Tip: {isPetHungry && pet
                    ? `feed ${pet.name} before the finance practice session.`
                    : 'feed Nova before the finance practice session.'}
                </p>
              </>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Wallet Snapshot</p>
            {financeLoading && !isDemo ? (
              <div className="mt-2 text-sm text-slate-500">Loading wallet data...</div>
            ) : (
              <>
                <h2 className="mt-2 text-xl font-bold text-slate-900">${walletBalance.toLocaleString()}</h2>
                <p className="mt-3 text-sm text-slate-600">Savings for virtual pet care and financial literacy goals.</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>• Weekly allowance saved: ${!isDemo && transactions.length > 0 
                    ? transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toFixed(0)
                    : '80'}
                  </li>
                  <li>• Emergency fund goal: {isDemo ? '65% complete' : 'N/A'}</li>
                  <li>• Last transaction: {lastTransaction.description} (${Math.abs(lastTransaction.amount)})</li>
                </ul>
              </>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-500">Mini-games</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Learning streak: 12 days</h2>
            <p className="mt-3 text-sm text-slate-600">
              Students completed 4 mini-games today focusing on budgeting and empathy skills.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Budget Blitz — 92% accuracy</li>
              <li>• Care Quest — 3 quests completed</li>
              <li>• Reaction Run — new high score 4,320</li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
