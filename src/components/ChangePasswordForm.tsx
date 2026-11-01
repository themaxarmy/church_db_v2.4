import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Field, Spinner } from './ui';

const MIN_LENGTH = 8;

interface ChangePasswordFormProps {
  // Label for the current password field: "Temporary password" on first sign-in.
  currentLabel?: string;
  submitLabel?: string;
  onDone?: () => void;
}

// Current password, new password and confirmation. Used on the Account page and on first sign-in.
export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  currentLabel = 'Current password',
  submitLabel = 'Change password',
  onDone,
}) => {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ next?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found: typeof errors = {};
    if (next.length < MIN_LENGTH) found.next = `Use at least ${MIN_LENGTH} characters`;
    else if (next === current) found.next = 'Choose a password different from your current one';
    if (confirm !== next) found.confirm = "The passwords don't match";
    setErrors(found);
    setServerError(null);
    setSuccess(false);
    if (Object.keys(found).length) return;

    setBusy(true);
    const { error } = await changePassword(current, next);
    setBusy(false);
    if (error) {
      setServerError(error);
      return;
    }
    setCurrent('');
    setNext('');
    setConfirm('');
    setSuccess(true);
    onDone?.();
  };

  // A plain render helper (not a component), so inputs keep focus while typing.
  const passwordInput = (
    props: React.InputHTMLAttributes<HTMLInputElement>,
    value: string,
    set: (v: string) => void,
    autoComplete: string,
  ) => (
    <input
      {...props}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={e => {
        set(e.target.value);
        setErrors({});
        setServerError(null);
      }}
      autoComplete={autoComplete}
      required
      disabled={busy}
      className="field-input"
    />
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {serverError && <Alert>{serverError}</Alert>}
      {success && <Alert tone="success">Your password has been changed. Other devices have been signed out.</Alert>}
      <Field label={currentLabel}>{props => passwordInput(props, current, setCurrent, 'current-password')}</Field>
      <Field label="New password" error={errors.next} hint={`At least ${MIN_LENGTH} characters.`}>
        {props => passwordInput(props, next, setNext, 'new-password')}
      </Field>
      <Field label="Confirm new password" error={errors.confirm}>
        {props => passwordInput(props, confirm, setConfirm, 'new-password')}
      </Field>
      <label className="flex items-center gap-2 text-ink-muted">
        <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)} className="accent-primary" />
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        Show passwords
      </label>
      <button type="submit" className="btn btn-primary min-h-[44px]" disabled={busy}>
        {busy && <Spinner className="h-4 w-4" />}
        {submitLabel}
      </button>
    </form>
  );
};
