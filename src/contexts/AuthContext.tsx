// authcontext.ts (or AuthProvider.tsx)
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { apiClient } from '../lib/api'; // Make sure this path is correct relative to AuthProvider.tsx

// IMPORTANT: Ensure User is imported correctly as a type
import type { User } from '../lib/postgres'; // Adjust path if your types.ts is elsewhere relative to this file

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // useState correctly infers the type based on the initial value (null)
  // and the type annotation <User | null> explicitly helps.
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const getInitialUser = async () => {
      if (initialized.current) return;
      
      try {
        // apiClient.getCurrentUser() now returns Promise<GetCurrentUserResponse>
        // where GetCurrentUserResponse is { user: User | null }
        const response = await apiClient.getCurrentUser();
        
        if (!isMounted) return;
        
        // TypeScript now correctly knows response.user is User | null
        setUser(response.user); // This line should no longer error
        initialized.current = true;
      } catch (error) {
        console.error('Error getting current user:', error);
        // User is not authenticated, which is fine
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    getInitialUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const response = await apiClient.signUp(email, password);
      setUser(response.user);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to sign up' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.signIn(email, password);
      setUser(response.user);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to sign in' };
    }
  };

  const signOut = async () => {
    try {
      await apiClient.signOut();
      setUser(null);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to sign out' };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await apiClient.resetPassword(email);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to reset password' };
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};