import React, { useState } from 'react';
import { 
  Users, 
  Database, 
  Settings, 
  LogOut, 
  UserCheck, 
  UserX, 
  Clock, 
  Shield,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Mail,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormRecords } from '../hooks/useFormRecords';
import { useUserManagement } from '../hooks/useUserManagement';

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { records, loading: recordsLoading } = useFormRecords();
  const { users, loading: usersLoading } = useUserManagement();
  const [activeTab, setActiveTab] = useState<'records' | 'users'>('records');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSignOut = async () => {
    await signOut();
  };

  const filteredRecords = records.filter(record =>
    record.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.othernames && record.othernames.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingUsers = users.filter(user => user.status === 'pending');
  const approvedUsers = users.filter(user => user.status === 'approved');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Holy Hill Records - Supabase
                </h1>
                <p className="text-sm text-gray-600">PostgreSQL Database Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {user.role === 'super_admin' ? 'Super Admin' : user.role}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                {user.email}
              </div>
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Status Check */}
      {user.status !== 'approved' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">
                  Account Pending Approval
                </p>
                <p className="text-sm text-yellow-700">
                  Your account is waiting for approval from a super administrator. 
                  You have limited access until approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{records.length}</p>
                <p className="text-sm text-gray-600">Total Records</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{approvedUsers.length}</p>
                <p className="text-sm text-gray-600">Approved Users</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
                <p className="text-sm text-gray-600">Pending Approval</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <a
              href="/collect"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Record
              <ExternalLink className="w-4 h-4" />
            </a>
            
            {user.role === 'super_admin' && (
              <button
                onClick={() => setActiveTab('users')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users className="w-4 h-4" />
                Manage Users
              </button>
            )}
            
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('records')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'records'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Records ({records.length})
                </div>
              </button>
              
              {user.role === 'super_admin' && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'users'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Users ({users.length})
                  </div>
                </button>
              )}
            </nav>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'records' && (
              <div>
                {recordsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading records...</p>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No records found</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first record'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Date of Birth</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRecords.map((record) => (
                          <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {record.picture && (
                                  <img
                                    src={record.picture}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {record.firstname} {record.lastname}
                                  </p>
                                  {record.othernames && (
                                    <p className="text-sm text-gray-500">{record.othernames}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {new Date(record.dateofbirth).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(record.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && user.role === 'super_admin' && (
              <div>
                {usersLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Created</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((userItem) => (
                          <tr key={userItem.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                {userItem.email}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                userItem.role === 'super_admin' 
                                  ? 'bg-purple-100 text-purple-800'
                                  : userItem.role === 'admin'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {userItem.role}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                userItem.status === 'approved' 
                                  ? 'bg-green-100 text-green-800'
                                  : userItem.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {userItem.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(userItem.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {userItem.status === 'pending' && (
                                  <>
                                    <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                                      <UserCheck className="w-4 h-4" />
                                    </button>
                                    <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                                      <UserX className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                <button className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                                  <Settings className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};