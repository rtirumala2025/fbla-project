import { useCallback } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const DemoModeBanner = () => {
  const { demoModeAvailable, isDemoModeActive, enterDemoMode } = useAuth();

  const handleEnterDemo = useCallback(() => {
    void enterDemoMode({
      email: 'demo.user@example.com',
      displayName: 'Demo Explorer',
    });
  }, [enterDemoMode]);

  if (!demoModeAvailable) {
    return null;
  }

  return (
    <div className="mx-auto mb-6 mt-24 w-full max-w-6xl px-4">
      <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 md:items-center">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500 md:mt-0" />
          <div>
            <p className="font-semibold">
              Configuration issues detected – running in demo mode.
            </p>
            <p className="text-sm text-amber-800">
              Supabase credentials were not found, so Companion loaded safe local data for the demo.
            </p>
          </div>
        </div>
        {!isDemoModeActive && (
          <button
            type="button"
            onClick={handleEnterDemo}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-amber-600 md:self-auto"
          >
            <span>Load Demo Data</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DemoModeBanner;

