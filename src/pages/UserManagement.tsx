import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Mail, 
  Calendar,
  Search,
  Filter,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserManagement } from '../hooks/useUserManagement';
import type { UserRole, UserStatus } from '../types';

export const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const { users, loading, error, approveUser, rejectUser, updateUserRole } = useUserManagement();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredUsers = users.filter(userItem => {
    const matchesSearch = userItem.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || userItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (userId: string) => {
    try {
      setIsProcessing(userId);
      setActionError(null);
      await approveUser(userId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to approve user');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      setIsProcessing(userId);
      setActionError(null);
      await rejectUser(userId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to reject user');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setIsProcessing(userId);
      setActionError(null);
      await updateUserRole(userId, newRole);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update user role');
    } finally {
      setIsProcessing(null);
    }
  };

  if (!user) return null;

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const approvedCount = users.filter(u => u.status === 'approved').length;
  const rejectedCount = users.filter(u => u.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  User Management
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage user accounts and permissions</p>
              </div>
            </div>
            
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{users.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{pendingCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{approvedCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{rejectedCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search users by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | UserStatus)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="p-6">
            {(actionError || error) && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
                {actionError || error}
              </div>
            )}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No users found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'No users have signed up yet'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Created</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((userItem) => (
                      <tr key={userItem.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {userItem.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                <span className="font-medium text-gray-900 dark:text-gray-100">{userItem.email}</span>
                              </div>
                              {userItem.id === user.id && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">(You)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="py-4 px-4">
                          <select
                            value={userItem.role}
                            onChange={(e) => handleRoleChange(userItem.id, e.target.value as UserRole)}
                            disabled={isProcessing === userItem.id || userItem.id === user.id}
                            className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${
                              userItem.role === 'super_admin'
                                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200'
                                : userItem.role === 'admin'
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            } ${userItem.id === user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        </td>
                        
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            userItem.status === 'approved' 
                              ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200'
                              : userItem.status === 'pending'
                              ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200'
                              : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200'
                          }`}>
                            {userItem.status}
                          </span>
                        </td>
                        
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(userItem.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {userItem.status !== 'approved' && userItem.id !== user.id && (
                              <>
                                <button
                                  onClick={() => handleApprove(userItem.id)}
                                  disabled={isProcessing === userItem.id}
                                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 rounded-lg transition-colors disabled:opacity-50"
                                  title="Approve User"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                                {userItem.status === 'pending' && (
                                <button
                                  onClick={() => handleReject(userItem.id)}
                                  disabled={isProcessing === userItem.id}
                                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50"
                                  title="Reject User"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                                )}
                              </>
                            )}
                            
                            {isProcessing === userItem.id && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};