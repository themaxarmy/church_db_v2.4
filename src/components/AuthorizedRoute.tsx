import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, KeyRound, Lock, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import { PublicLayout } from './PublicLayout';
import { EmptyState } from './ui';
import { ChangePasswordForm } from './ChangePasswordForm';

interface AuthorizedRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

// Without `roles`: blocks accounts that aren't approved yet. With `roles`: also limits the page to those roles.
// The API enforces the same rules; this only decides what to show.
export const AuthorizedRoute: React.FC<AuthorizedRouteProps> = ({ children, roles }) => {
  const { user, signOut } = useAuth();
  if (!user) return null;

  if (user.status !== 'approved') {
    const rejected = user.status === 'rejected';
    return (
      <PublicLayout width="narrow">
        <div className="card p-8 text-center">
          <div
            className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
              rejected ? 'bg-danger-soft text-danger-text' : 'bg-accent-soft text-accent-text'
            }`}
          >
            {rejected ? <XCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
          </div>
          <h1 className="text-xl font-bold">{rejected ? 'Access not approved' : 'Waiting for approval'}</h1>
          <p className="mt-2 text-ink-muted">
            {rejected
              ? 'An administrator has not approved this account. Contact them if you think this is a mistake.'
              : `You're signed in as ${user.email}. An administrator needs to approve your account before you can see records.`}
          </p>
          <button type="button" className="btn btn-secondary mt-6" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </PublicLayout>
    );
  }

  // Accounts a super admin created or reset have a temporary password to replace before anything else.
  if (user.mustChangePassword) {
    return (
      <PublicLayout width="narrow">
        <div className="card p-6 sm:p-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-text">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">Choose your password</h1>
          <p className="mb-5 mt-2 text-ink-muted">
            You signed in as {user.email} with a temporary password. Choose your own to continue.
          </p>
          <ChangePasswordForm currentLabel="Temporary password" submitLabel="Save and continue" />
          <button type="button" className="btn btn-ghost mt-3 w-full" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </PublicLayout>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="card">
        <EmptyState icon={<Lock className="h-5 w-5" />} title="You don't have access to this page">
          <Link to="/" className="font-semibold text-primary-text hover:underline">Back to records</Link>
        </EmptyState>
      </div>
    );
  }

  return <>{children}</>;
};
