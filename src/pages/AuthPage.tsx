import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PublicLayout } from '../components/PublicLayout';
import { Alert, Field, Spinner } from '../components/ui';

interface AuthPageProps {
  mode: 'login' | 'signup' | 'reset';
}

const COPY = {
  login: { title: 'Sign in', intro: 'For church staff. Members can use the public form instead.', button: 'Sign in' },
  signup: { title: 'Create a staff account', intro: 'An administrator approves new accounts before they can see records.', button: 'Create account' },
  reset: { title: 'Forgot your password?', intro: '', button: '' },
} as const;

export const AuthPage: React.FC<AuthPageProps> = ({ mode }) => {
  const { user, signIn, signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user && !loading) return <Navigate to="/" replace />;

  const copy = COPY[mode];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const result = mode === 'signup' ? await signUp(email, password) : await signIn(email, password);
    // On success the auth context updates and this page redirects.
    if (result.error) setError(result.error);
    setIsSubmitting(false);
  };

  return (
    <PublicLayout
      width="narrow"
      footer={
        <>
          Not staff? <Link to="/collect" className="font-semibold text-primary-text hover:underline">Fill in the public form</Link>
        </>
      }
    >
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>

        {mode === 'reset' ? (
          <>
            <p className="mt-2 text-ink-muted">
              Password resets aren't available yet. Ask a super admin to help you get back in.
            </p>
            <Link to="/auth/login" className="btn btn-secondary mt-6 w-full">Back to sign in</Link>
          </>
        ) : (
          <>
            <p className="mt-2 text-ink-muted">{copy.intro}</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              {error && <Alert>{error}</Alert>}
              <Field label="Email">
                {props => (
                  <input
                    {...props}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    className="field-input"
                  />
                )}
              </Field>
              <Field label="Password" hint={mode === 'signup' ? 'At least 8 characters.' : undefined}>
                {props => (
                  <div className="relative">
                    <input
                      {...props}
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      minLength={mode === 'signup' ? 8 : undefined}
                      required
                      disabled={isSubmitting}
                      className="field-input pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </Field>
              <button type="submit" className="btn btn-primary mt-2 min-h-[44px] w-full" disabled={isSubmitting}>
                {isSubmitting && <Spinner className="h-4 w-4" />}
                {copy.button}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-2 border-t border-line pt-5 text-center text-ink-muted">
              {mode === 'login' ? (
                <>
                  <p>
                    New to the team? <Link to="/auth/signup" className="font-semibold text-primary-text hover:underline">Create an account</Link>
                  </p>
                  <Link to="/auth/reset" className="font-medium hover:text-ink hover:underline">Forgot your password?</Link>
                </>
              ) : (
                <p>
                  Already have an account? <Link to="/auth/login" className="font-semibold text-primary-text hover:underline">Sign in</Link>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
};
