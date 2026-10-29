import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import type { User, UserRole } from '../types';

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { users } = await apiClient.getUsers();
      setUsers(users);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  const replaceUser = (updated: User) =>
    setUsers(prev => prev.map(user => (user.id === updated.id ? updated : user)));

  const approveUser = async (userId: string) => replaceUser(await apiClient.approveUser(userId));
  const rejectUser = async (userId: string) => replaceUser(await apiClient.rejectUser(userId));
  const updateUserRole = async (userId: string, role: UserRole) =>
    replaceUser(await apiClient.updateUserRole(userId, role));

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, approveUser, rejectUser, updateUserRole, refetch: fetchUsers };
};
