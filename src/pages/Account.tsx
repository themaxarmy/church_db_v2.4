import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, ROLE_LABELS } from '../components/AppShell';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { Avatar } from '../components/ui';

// The signed-in person's own account: who they are, and changing their password.
export const Account: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <PageHeader title="Your account" />
      <section className="card flex items-center gap-4 p-5">
        <Avatar name={user.email} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{user.email}</p>
          <p className="text-ink-muted">{ROLE_LABELS[user.role]}</p>
        </div>
      </section>
      <section className="card p-5 sm:p-6">
        <h2 className="text-base font-semibold">Change password</h2>
        <p className="mb-4 mt-1 text-ink-muted">You'll stay signed in here. Any other devices will be signed out.</p>
        <ChangePasswordForm />
      </section>
    </div>
  );
};
