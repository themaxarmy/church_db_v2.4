import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// Small shared building blocks. Styling comes from the tokens in index.css and tailwind.config.js.

export const Spinner: React.FC<{ className?: string }> = ({ className = 'h-5 w-5' }) => (
  <span
    role="status"
    aria-label="Loading"
    className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
  />
);

export const LoadingBlock: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-muted">
    <Spinner className="h-6 w-6 text-primary" />
    <p>{label}</p>
  </div>
);

export const Alert: React.FC<{ tone?: 'error' | 'success'; children: React.ReactNode }> = ({ tone = 'error', children }) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
      tone === 'error'
        ? 'border-danger-line bg-danger-soft text-danger-text'
        : 'border-success-line bg-success-soft text-success-text'
    }`}
  >
    {tone === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
    <div className="min-w-0">{children}</div>
  </div>
);

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  // Receives the input's id and the aria attributes to spread onto it.
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string; required?: boolean }) => React.ReactNode;
}

// Label, control, hint and error, wired together for screen readers. Required fields get an orange asterisk.
export const Field: React.FC<FieldProps> = ({ label, required, error, hint, className = '', children }) => {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-medium text-ink">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="ml-0.5 text-accent-text">*</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy, required })}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-ink-muted">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="flex items-center gap-1 text-xs font-medium text-danger-text">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]!.toUpperCase())
    .join('');

// Alternates blue and orange by name, so the same person always gets the same colour.
const toneOf = (name: string) => ([...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 2 === 0 ? 'blue' : 'orange');

export const Avatar: React.FC<{ name: string; picture?: string | null; size?: 'sm' | 'md' | 'lg' }> = ({
  name,
  picture,
  size = 'md',
}) => {
  const box = size === 'lg' ? 'h-14 w-14 text-lg' : size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-[13px]';
  if (picture) return <img src={picture} alt="" className={`${box} shrink-0 rounded-full object-cover`} />;
  const tone = toneOf(name) === 'blue' ? 'bg-avatar-blue text-avatar-blue-text' : 'bg-avatar-orange text-avatar-orange-text';
  return (
    <span aria-hidden="true" className={`${box} ${tone} inline-flex shrink-0 items-center justify-center rounded-full font-semibold`}>
      {initialsOf(name) || '?'}
    </span>
  );
};

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; children?: React.ReactNode }> = ({
  icon,
  title,
  children,
}) => (
  <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
    <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-chip text-ink-muted">{icon}</div>
    <p className="text-base font-semibold text-ink">{title}</p>
    {children && <div className="max-w-sm text-ink-muted">{children}</div>}
  </div>
);

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}

// A modal yes/no question. Escape or clicking outside cancels; focus starts on Cancel.
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onCancel,
  children,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  // Kept in a ref so a new onCancel each render doesn't re-run the effect and steal focus.
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    // Capture phase + stopPropagation: Escape closes only this dialog, not a panel behind it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onCancelRef.current();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card w-full max-w-md p-6 shadow-xl"
        onMouseDown={e => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
        <div className="mt-2 text-ink-muted">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onSelect: () => void;
}

// A "⋯" style dropdown. Drawn with fixed positioning so a scrolling table can't clip it; opens upward
// near the bottom of the screen. Closes on outside click, Escape, scrolling, or choosing an item.
export const Menu: React.FC<{ label: string; trigger: React.ReactNode; items: MenuItem[] }> = ({ label, trigger, items }) => {
  const [position, setPosition] = useState<React.CSSProperties | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = position !== null;

  const toggle = () => {
    if (open) return setPosition(null);
    const rect = buttonRef.current!.getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    const roomBelow = window.innerHeight - rect.bottom;
    setPosition(roomBelow < 48 * items.length + 24 ? { bottom: window.innerHeight - rect.top + 4, right } : { top: rect.bottom + 4, right });
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setPosition(null);
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close();
      buttonRef.current?.focus();
    };
    menuRef.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="icon-btn"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
      >
        {trigger}
      </button>
      {open && (
        <div ref={menuRef} role="menu" aria-label={label} style={position} className="card fixed z-50 min-w-[180px] p-1 shadow-lg">
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setPosition(null);
                item.onSelect();
              }}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                item.danger ? 'text-danger-text hover:bg-danger-soft' : 'text-ink hover:bg-chip'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

// A general dialog with a title, body and button row. Escape or clicking outside closes it.
export const Modal: React.FC<ModalProps> = ({ open, title, onClose, children, footer }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('input, select, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="card w-full max-w-md p-6 shadow-xl"
        onMouseDown={e => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
        <div className="mt-3">{children}</div>
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
};

// Shows a temporary password once, with a copy button, for an admin to pass on.
export const TemporaryPassword: React.FC<{ email: string; password: string }> = ({ email, password }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the password is still on screen to copy by hand.
    }
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="text-ink-muted">
        Give this temporary password to <strong className="text-ink">{email}</strong>. They'll be asked to choose
        their own when they sign in at <strong className="text-ink">{window.location.host}</strong>.
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-muted p-2 pl-4">
        <code className="flex-1 select-all font-mono text-lg font-semibold tracking-wider">{password}</code>
        <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-ink-muted">It won't be shown again. If it's lost, reset their password to get a new one.</p>
    </div>
  );
};
