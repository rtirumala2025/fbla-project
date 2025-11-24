/**
 * Test utilities and helpers for onboarding system tests
 */
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { PetProvider } from '../../context/PetContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockSession = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { display_name: 'Test User' },
    },
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  };

  return {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null, error: null } })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
      })),
    })),
    mockSession,
  };
};

// Test wrapper with all providers
export const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <PetProvider userId={null}>
            {children}
          </PetProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Custom render function
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Helper to wait for auth state to settle
export const waitForAuth = async (timeout = 1000) => {
  await new Promise((resolve) => setTimeout(resolve, timeout));
};

// Mock user states
export const mockUserStates = {
  unauthenticated: {
    currentUser: null,
    loading: false,
    isNewUser: false,
    hasPet: false,
  },
  newUser: {
    currentUser: {
      uid: 'new-user-id',
      email: 'new@example.com',
      displayName: 'New User',
    },
    loading: false,
    isNewUser: true,
    hasPet: false,
  },
  existingUser: {
    currentUser: {
      uid: 'existing-user-id',
      email: 'existing@example.com',
      displayName: 'Existing User',
    },
    loading: false,
    isNewUser: false,
    hasPet: true,
  },
  loading: {
    currentUser: null,
    loading: true,
    isNewUser: false,
    hasPet: false,
  },
};

// Helper to create mock pet data
export const createMockPet = (overrides = {}) => ({
  id: 'pet-id-1',
  name: 'Test Pet',
  species: 'dog' as const,
  breed: 'Golden Retriever',
  age: 1,
  level: 1,
  experience: 0,
  ownerId: 'test-user-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  stats: {
    health: 100,
    hunger: 50,
    happiness: 50,
    cleanliness: 50,
    energy: 50,
    lastUpdated: new Date(),
  },
  ...overrides,
});

// Helper to create mock profile data
export const createMockProfile = (overrides = {}) => ({
  user_id: 'test-user-id',
  username: 'testuser',
  coins: 100,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Helper to simulate network delay
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to simulate Supabase errors
export const createSupabaseError = (code: string, message: string) => ({
  code,
  message,
  details: '',
  hint: '',
});

// Common Supabase error codes
export const SUPABASE_ERRORS = {
  NO_ROWS: 'PGRST116',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
};

