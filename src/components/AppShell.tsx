import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronDown, KeyRound, LogOut, Menu as MenuIcon, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UsersContext';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { Avatar } from './ui';

// eslint-disable-next-line react-refresh/only-export-components
export const ROLE_LABELS = { user: 'User', admin: 'Admin', super_admin: 'Super admin' } as const;

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-[64px] items-center gap-2 border-b-2 px-3 transition-colors ${
    isActive ? 'border-accent font-semibold text-ink' : 'border-transparent font-medium text-ink-muted hover:text-ink'
  }`;

const PendingBadge: React.FC<{ count: number }> = ({ count }) =>
  count > 0 ? <span className="chip-accent">{count}<span className="sr-only"> waiting</span></span> : null;

const AccountMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="flex min-h-[44px] items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-chip"
      >
        <Avatar name={user.email} size="sm" />
        <span className="hidden flex-col leading-tight lg:flex">
          <span className="text-[13px] font-semibold">{user.email}</span>
          <span className="text-xs text-ink-muted">{ROLE_LABELS[user.role]}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-ink-muted" />
      </button>
      {open && (
        <div role="menu" className="card absolute right-0 z-30 mt-1 w-64 p-1 shadow-lg">
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate font-semibold">{user.email}</p>
            <p className="text-xs text-ink-muted">{ROLE_LABELS[user.role]}</p>
          </div>
          <Link
            to="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left font-medium hover:bg-chip"
          >
            <KeyRound className="h-4 w-4" />
            Change password
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut()}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left font-medium hover:bg-chip"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

// Top bar and page frame for signed-in staff. Pages render into <Outlet />.
export const AppShell: React.FC = () => {
  const { user, signOut } = useAuth();
  const { users, enabled: isSuperAdmin } = useUsers();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const pendingCount = users.filter(u => u.status === 'pending').length;

  // Close the phone menu after navigating.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  if (!user) return null;
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-7 px-4 sm:px-6">
          <Link to="/" className="flex min-h-[56px] items-center sm:min-h-[64px]">
            <Logo />
          </Link>
          <nav aria-label="Main" className="hidden self-stretch md:flex md:gap-1">
            <NavLink to="/" end className={navClass}>Records</NavLink>
            {isSuperAdmin && (
              <NavLink to="/users" className={navClass}>
                Users <PendingBadge count={pendingCount} />
              </NavLink>
            )}
          </nav>
          <div className="flex-1" />
          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <AccountMenu />
          </div>
          <button
            type="button"
            className="icon-btn h-11 w-11 md:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-line px-4 pb-4 md:hidden">
            <nav aria-label="Main" className="flex flex-col py-2">
              <NavLink to="/" end className={({ isActive }) => `rounded-lg px-3 py-3 ${isActive ? 'bg-chip font-semibold' : 'font-medium text-ink-muted'}`}>
                Records
              </NavLink>
              {isSuperAdmin && (
                <NavLink to="/users" className={({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-3 ${isActive ? 'bg-chip font-semibold' : 'font-medium text-ink-muted'}`}>
                  Users <PendingBadge count={pendingCount} />
                </NavLink>
              )}
            </nav>
            <div className="flex flex-col gap-3 border-t border-line pt-4">
              <div className="flex items-center gap-3 px-1">
                <Avatar name={user.email} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user.email}</p>
                  <p className="text-xs text-ink-muted">{ROLE_LABELS[user.role]}</p>
                </div>
              </div>
              <ThemeToggle labelled />
              <Link to="/account" className="btn btn-secondary">
                <KeyRound className="h-4 w-4" />
                Change password
              </Link>
              <button type="button" className="btn btn-secondary" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
};

// Page title row: heading and subtitle on the left, actions on the right.
export const PageHeader: React.FC<{ title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }> = ({
  title,
  subtitle,
  actions,
}) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-ink-muted">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
  </div>
);
