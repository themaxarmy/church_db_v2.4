import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthorizedRouteProps {
  children: React.ReactNode;
}

export const AuthorizedRoute: React.FC<AuthorizedRouteProps> = ({ children }) => {
  const { user } = useAuth();

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

  if (user.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Your account has been rejected by an administrator. Please contact support for more information.
          </p>
          <button
            onClick={() => window.location.href = '/auth/login'}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};