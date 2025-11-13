/**
 * Login Page
 * User authentication login page
 */
import type { FormEvent } from 'react';

type LoginProps = {
  onSuccess?: () => void;
};

export const Login = ({ onSuccess }: LoginProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSuccess?.();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
            Virtual Pet FBLA
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter any credentials to explore the experience. In demo mode we skip authentication.
          </p>
        </header>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@fblademo.org"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700"
          >
            Continue
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Need Supabase back online? Add your keys to <code className="rounded bg-slate-100 px-1">.env</code>{' '}
          and refresh.
        </p>
      </div>
    </div>
  );
};

export default Login;
