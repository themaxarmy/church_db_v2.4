import React from 'react';
import { Clock, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

interface AuthorizedRouteProps {
  children: React.ReactNode;
  role?: UserRole;
}

// UI gate only — the server enforces the same rules on every request.
export const AuthorizedRoute: React.FC<AuthorizedRouteProps> = ({ children, role }) => {
  const { user, signOut } = useAuth();

  if (!user) return null; // ProtectedRoute handles the redirect

  if (user.status !== 'approved') {
    const rejected = user.status === 'rejected';
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          {rejected ? (
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          ) : (
            <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {rejected ? 'Access Denied' : 'Account Pending Approval'}
          </h2>
          <p className="text-gray-600 mb-6">
            {rejected
              ? 'Your account has been rejected by an administrator. Please contact an administrator for more information.'
              : 'Your account is waiting for approval from an administrator. You will be able to view records once approved.'}
          </p>
          <button
            onClick={() => signOut()}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (role && user.role !== role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
