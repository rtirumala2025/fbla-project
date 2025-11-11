import { useState } from 'react';
import { isDemoMode } from './lib/supabase';
import { DemoMode } from './components/DemoMode';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';

type ViewState = 'demo' | 'login' | 'dashboard';

const App = () => {
  const [view, setView] = useState<ViewState>(isDemoMode ? 'demo' : 'login');

  const handleEnterDemoDashboard = () => setView('dashboard');
  const handleReturnFromDashboard = () => setView(isDemoMode ? 'demo' : 'login');

  if (view === 'dashboard') {
    return <Dashboard mode={isDemoMode ? 'demo' : 'live'} onSignOut={handleReturnFromDashboard} />;
  }

  if (isDemoMode && view === 'demo') {
    return <DemoMode onEnterDashboard={handleEnterDemoDashboard} />;
  }

  return <Login onSuccess={() => setView('dashboard')} />;
};

export default App;

