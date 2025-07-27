import { useState, useEffect, type Key } from 'react';
import { apiClient } from '../lib/api';

export interface User {
  id: Key | null | undefined;
  _id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'user' | 'admin' | 'super_admin';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// You need to define the GetUsersResponse interface based on your API client's return type.
// For example, if your API returns { users: User[], total: number }
export interface GetUsersResponse {
  users: User[]; // Or 'data: User[]', 'items: User[]', depending on your API
  total?: number; // Example of other fields in the response
  message?: string;
  // ... other metadata
}

// You also need to ensure your apiClient is typed correctly.
// For example, in your lib/api.ts:
// interface ApiClient {
//   getUsers: () => Promise<GetUsersResponse>;
//   approveUser: (userId: string) => Promise<User>; // Assuming approve/reject/update return a single User
//   rejectUser: (userId: string) => Promise<User>;
//   updateUserRole: (userId: string, role: 'user' | 'admin' | 'super_admin') => Promise<User>;
// }
// export const apiClient: ApiClient = { ... };


export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getUsers();
      // FIX: Access the array of users from the response object
      setUsers(response.users); // Assuming the array is under a 'users' property
      // OR setUsers(response.data); // If it's under a 'data' property
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      const updatedUser = await apiClient.approveUser(userId);
      setUsers(prev => prev.map(user =>
        user._id === userId ? updatedUser : user
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to approve user');
    }
  };

  const rejectUser = async (userId: string) => {
    try {
      const updatedUser = await apiClient.rejectUser(userId);
      setUsers(prev => prev.map(user =>
        user._id === userId ? updatedUser : user
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to reject user');
    }
  };

  const updateUserRole = async (userId: string, role: 'user' | 'admin' | 'super_admin') => {
    try {
      const updatedUser = await apiClient.updateUserRole(userId, role);
      setUsers(prev => prev.map(user =>
        user._id === userId ? updatedUser : user
      ));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update user role');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    approveUser,
    rejectUser,
    updateUserRole,
    refetch: fetchUsers,
  };
};