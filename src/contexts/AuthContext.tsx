import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const toError = (error: unknown, fallback: string) => ({
  error: error instanceof Error ? error.message : fallback,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    apiClient
      .getCurrentUser()
      .then(({ user }) => {
        if (isMounted) setUser(user);
      })
      .catch(error => console.error('Error getting current user:', error))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { user } = await apiClient.signUp(email, password);
      setUser(user);
      return { error: null };
    } catch (error) {
      return toError(error, 'Failed to sign up');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { user } = await apiClient.signIn(email, password);
      setUser(user);
      return { error: null };
    } catch (error) {
      return toError(error, 'Failed to sign in');
    }
  };

  const signOut = async () => {
    try {
      await apiClient.signOut();
      setUser(null);
      return { error: null };
    } catch (error) {
      return toError(error, 'Failed to sign out');
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const { user } = await apiClient.changePassword(currentPassword, newPassword);
      setUser(user);
      return { error: null };
    } catch (error) {
      return toError(error, 'Failed to change password');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await apiClient.resetPassword(email);
      return { error: null };
    } catch (error) {
      return toError(error, 'Failed to reset password');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, changePassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};
