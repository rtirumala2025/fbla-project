/**
 * Dashboard Page
 * Main dashboard view for the virtual pet application
 */
type DashboardProps = {
  onSignOut?: () => void;
  mode?: 'demo' | 'live';
};

export const Dashboard = ({ onSignOut, mode = 'demo' }: DashboardProps) => {
  const isDemo = mode === 'demo';

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
            <h2 className="mt-2 text-xl font-bold text-slate-900">Nova the Arctic Fox</h2>
            <p className="mt-3 text-sm text-slate-600">Level 7 • Happiness 92 • Energy 76</p>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-2 w-3/4 rounded-full bg-indigo-500" />
            </div>
            <p className="mt-2 text-xs text-slate-500">Tip: feed Nova before the finance practice session.</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">Wallet Snapshot</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">$1,250</h2>
            <p className="mt-3 text-sm text-slate-600">Savings for virtual pet care and financial literacy goals.</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>• Weekly allowance saved: $80</li>
              <li>• Emergency fund goal: 65% complete</li>
              <li>• Last transaction: Pet spa day (-$25)</li>
            </ul>
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
