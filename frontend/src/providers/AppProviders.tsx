import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SupabaseProvider } from '@/contexts/SupabaseContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { SoundProvider } from '@/contexts/SoundContext';

type AppProvidersProps = {
  children: React.ReactNode;
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => (
  <SupabaseProvider>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <SoundProvider>
            <ToastProvider>
              <SyncProvider>{children}</SyncProvider>
            </ToastProvider>
          </SoundProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </SupabaseProvider>
);

export default AppProviders;

