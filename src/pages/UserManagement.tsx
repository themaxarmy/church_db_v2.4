import React, { useState } from 'react';
import { Check, Search, UserRoundX, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UsersContext';
import { PageHeader, ROLE_LABELS } from '../components/AppShell';
import { Alert, Avatar, ConfirmDialog, EmptyState, LoadingBlock, Spinner } from '../components/ui';
import { formatDate } from '../lib/records';
import type { User, UserRole, UserStatus } from '../types';

const TABS: { status: UserStatus; label: string; empty: string }[] = [
  { status: 'pending', label: 'Pending', empty: 'No one is waiting for approval.' },
  { status: 'approved', label: 'Approved', empty: 'No approved accounts yet.' },
  { status: 'rejected', label: 'Rejected', empty: 'No rejected sign-ups.' },
];

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'user', label: 'User (view records)' },
  { value: 'admin', label: 'Admin (edit records)' },
  { value: 'super_admin', label: 'Super admin (manage users)' },
];

const RoleSelect: React.FC<{ value: UserRole; onChange: (role: UserRole) => void; disabled?: boolean; label: string }> = ({
  value,
  onChange,
  disabled,
  label,
}) => (
  <select
    aria-label={label}
    value={value}
    onChange={e => onChange(e.target.value as UserRole)}
    disabled={disabled}
    className="field-input min-h-[40px] w-auto"
  >
    {ROLE_OPTIONS.map(o => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

export const UserManagement: React.FC = () => {
  const { user: me } = useAuth();
  const { users, loading, error, approveUser, rejectUser, updateUserRole } = useUsers();
  const [tab, setTab] = useState<UserStatus>('pending');
  const [search, setSearch] = useState('');
  // The role chosen in "Approve as" for each pending or rejected account.
  const [approveAs, setApproveAs] = useState<Record<string, UserRole>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toRevoke, setToRevoke] = useState<User | null>(null);

  const run = async (id: string, action: () => Promise<void>, failure: string) => {
    setBusyId(id);
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : failure);
    } finally {
      setBusyId(null);
    }
  };

  const approve = (u: User) =>
    run(
      u.id,
      async () => {
        const role = approveAs[u.id] ?? 'user';
        await approveUser(u.id);
        if (role !== u.role) await updateUserRole(u.id, role);
      },
      'Failed to approve',
    );

  const revoke = async () => {
    if (!toRevoke) return;
    const target = toRevoke;
    setToRevoke(null);
    await run(target.id, () => rejectUser(target.id), 'Failed to remove access');
  };

  const count = (status: UserStatus) => users.filter(u => u.status === status).length;
  const term = search.trim().toLowerCase();
  const visible = users.filter(u => u.status === tab && u.email.toLowerCase().includes(term));
  const current = TABS.find(t => t.status === tab)!;

  return (
    <>
      <PageHeader title="Users" subtitle="Approve sign-ups and choose what each person can do." />

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line">
        <div role="tablist" aria-label="Accounts by status" className="flex gap-1">
          {TABS.map(t => {
            const active = t.status === tab;
            const n = count(t.status);
            return (
              <button
                key={t.status}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.status)}
                className={`-mb-px flex min-h-[44px] items-center gap-2 border-b-2 px-3.5 transition-colors ${
                  active ? 'border-accent font-semibold text-ink' : 'border-transparent font-medium text-ink-muted hover:text-ink'
                }`}
              >
                {t.label}
                <span className={t.status === 'pending' && n > 0 ? 'chip-accent' : 'chip'}>{n}</span>
              </button>
            );
          })}
        </div>
        <label className="mb-2 flex min-h-[38px] w-full items-center gap-2 rounded-lg border border-line bg-surface px-3 text-ink-subtle focus-within:border-primary sm:w-64">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search by email</span>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email"
            className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-subtle"
          />
        </label>
      </div>

      {(error || actionError) && <Alert>{actionError || error}</Alert>}

      <section role="tabpanel" aria-label={`${current.label} accounts`} className="card overflow-hidden">
        {loading ? (
          <LoadingBlock label="Loading users…" />
        ) : visible.length === 0 ? (
          <EmptyState icon={<UsersIcon className="h-5 w-5" />} title={term ? 'No matching accounts' : current.empty} />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map(u => {
              const isMe = u.id === me?.id;
              const busy = busyId === u.id;
              return (
                <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
                  <Avatar name={u.email} />
                  <div className="min-w-0 flex-[1_1_220px]">
                    <p className="truncate font-semibold">
                      {u.email}
                      {isMe && <span className="ml-2 chip">You</span>}
                    </p>
                    <p className="text-[13px] text-ink-muted">
                      {u.status === 'approved'
                        ? `${ROLE_LABELS[u.role]} · approved ${formatDate(u.approvedAt ?? u.updatedAt)}`
                        : `Signed up ${formatDate(u.createdAt)}`}
                    </p>
                  </div>

                  {busy && <Spinner className="h-4 w-4 text-primary" />}

                  {!isMe && u.status !== 'approved' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-2 text-ink-muted">
                        Approve as
                        <RoleSelect
                          label={`Role for ${u.email}`}
                          value={approveAs[u.id] ?? 'user'}
                          onChange={role => setApproveAs(prev => ({ ...prev, [u.id]: role }))}
                          disabled={busy}
                        />
                      </label>
                      <button type="button" className="btn btn-primary" onClick={() => approve(u)} disabled={busy}>
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      {u.status === 'pending' && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => run(u.id, () => rejectUser(u.id), 'Failed to reject')}
                          disabled={busy}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  )}

                  {!isMe && u.status === 'approved' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <RoleSelect
                        label={`Role for ${u.email}`}
                        value={u.role}
                        onChange={role => run(u.id, () => updateUserRole(u.id, role), 'Failed to change role')}
                        disabled={busy}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost text-danger-text hover:bg-danger-soft hover:text-danger-text"
                        onClick={() => setToRevoke(u)}
                        disabled={busy}
                      >
                        <UserRoundX className="h-4 w-4" />
                        Remove access
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-[13px] text-ink-muted">
        <strong className="text-ink">User</strong> views records · <strong className="text-ink">Admin</strong> also edits,
        archives and deletes · <strong className="text-ink">Super admin</strong> also manages users
      </p>

      <ConfirmDialog
        open={toRevoke !== null}
        title="Remove access?"
        confirmLabel="Remove access"
        danger
        onConfirm={revoke}
        onCancel={() => setToRevoke(null)}
      >
        {toRevoke?.email} will no longer be able to see records. You can approve them again later from the Rejected tab.
      </ConfirmDialog>
    </>
  );
};
