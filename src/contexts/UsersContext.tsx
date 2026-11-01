import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { useUserManagement } from '../hooks/useUserManagement';

type UsersState = ReturnType<typeof useUserManagement> & { enabled: boolean };

const UsersContext = createContext<UsersState | undefined>(undefined);

// One shared list of staff accounts for super admins, so the nav badge, the Records banner and the
// Users page agree after an approval. For everyone else it stays empty and never calls the API.
export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const enabled = user?.status === 'approved' && user.role === 'super_admin';
  const state = useUserManagement(enabled);
  return <UsersContext.Provider value={{ ...state, enabled }}>{children}</UsersContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) throw new Error('useUsers must be used within a UsersProvider');
  return context;
};
