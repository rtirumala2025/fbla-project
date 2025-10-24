import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  // Add other user properties as needed
}

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on initial load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // TODO: Implement actual authentication
    const mockUser = {
      uid: 'mock-uid-' + Math.random().toString(36).substr(2, 9),
      email,
      displayName: email.split('@')[0]
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    setCurrentUser(mockUser);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    // TODO: Implement actual signup
    const mockUser = {
      uid: 'mock-uid-' + Math.random().toString(36).substr(2, 9),
      email,
      displayName
    };
    localStorage.setItem('user', JSON.stringify(mockUser));
    setCurrentUser(mockUser);
  };

  const signOut = async () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
