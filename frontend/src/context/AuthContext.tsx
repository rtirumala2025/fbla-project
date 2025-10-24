import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  getIdToken(forceRefresh?: boolean): Promise<string>;
}

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  signup: (email: string, password: string, displayName: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on initial render
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to load user from storage', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, you would validate credentials here
      const user: User = {
        uid: `user-${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        emailVerified: true,
        getIdToken: async () => 'mock-auth-token'
      };
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      setCurrentUser(user);
      return { success: true, user };
    } catch (err) {
      const errorMessage = 'Failed to sign in. Please check your credentials.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user: User = {
        uid: `user-${Date.now()}`,
        email,
        displayName: displayName || email.split('@')[0],
        emailVerified: false,
        getIdToken: async () => 'mock-auth-token'
      };
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      setCurrentUser(user);
      return { success: true, user };
    } catch (err) {
      const errorMessage = 'Failed to create an account. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      return { success: true };
    } catch (err) {
      const errorMessage = 'Failed to sign out. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { success: true };
    } catch (err) {
      const errorMessage = 'Failed to reset password. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updateEmail = async (email: string) => {
    try {
      if (!currentUser) throw new Error('No user is currently signed in');
      
      setLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...currentUser, email };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      return { success: true };
    } catch (err) {
      const errorMessage = 'Failed to update email. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    try {
      if (!currentUser) throw new Error('No user is currently signed in');
      
      setLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, you would update the password here
      return { success: true };
    } catch (err) {
      const errorMessage = 'Failed to update password. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    updateEmail,
    updatePassword,
    error,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
