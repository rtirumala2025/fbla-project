type DemoModeProps = {
  onEnterDashboard: () => void;
};

export const DemoMode = ({ onEnterDashboard }: DemoModeProps) => {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
              Virtual Pet FBLA
            </p>
            <h1 className="text-2xl font-bold text-slate-900">Demo Mode</h1>
          </div>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
            Live Preview
          </span>
        </div>
      </header>

      <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-4 text-amber-800 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">Demo Mode – Live data disabled</p>
            <p className="text-sm">
              Supabase configuration is missing. We loaded safe demo data so you can keep presenting.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEnterDashboard}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            >
              Enter demo dashboard
            </button>
            <button
              type="button"
              onClick={handleReload}
              className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
            >
              Retry live mode
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">What&apos;s included</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>• Responsive navigation bar and layout</li>
              <li>• Demo dashboard with pet, wallet, and mini-game stats</li>
              <li>• Safe mock data, no external API calls</li>
            </ul>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Need live data?</h2>
            <p className="mt-3 text-sm text-slate-600">
              Re-run with valid <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_URL</code> and{' '}
              <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_ANON_KEY</code> to reconnect Supabase.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
};

export default DemoMode;

