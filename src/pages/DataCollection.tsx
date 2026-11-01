import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { apiClient } from '../lib/api';
import { RecordForm } from '../components/RecordForm';
import { PublicLayout } from '../components/PublicLayout';
import { Alert } from '../components/ui';
import type { RecordInput } from '../types';

// The public form members fill in. No sign-in needed.
export const DataCollection: React.FC = () => {
  // Changing the key remounts RecordForm, which clears it.
  const [formKey, setFormKey] = useState(0);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (record: RecordInput) => {
    setError(null);
    try {
      await apiClient.createRecord(record);
      setSubmittedName(record.firstName);
      setFormKey(key => key + 1);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <PublicLayout
      footer={
        <>
          Church staff? <Link to="/auth/login" className="font-semibold text-primary-text hover:underline">Sign in</Link>
        </>
      }
    >
      {submittedName ? (
        <div className="card mx-auto max-w-lg p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success-text">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Thank you, {submittedName}</h1>
          <p className="mt-2 text-ink-muted">Your details have been added to the Holy Hill church records.</p>
          <button type="button" className="btn btn-secondary mt-6" onClick={() => setSubmittedName(null)}>
            Add someone else
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold text-accent-text">Church records</p>
            <h1 className="text-3xl font-bold tracking-tight">Add your details</h1>
            <p className="max-w-2xl text-base text-ink-muted">
              This takes about three minutes. Only approved church staff can see what you share, and it's used for church
              records only.
            </p>
          </div>
          {error && <Alert>{error}</Alert>}
          <RecordForm
            key={formKey}
            submitLabel="Submit details"
            submittingLabel="Submitting…"
            cancelLabel="Clear form"
            onSubmit={handleSubmit}
            onChange={() => setError(null)}
            footerNote="By submitting, you agree to your details being kept in the Holy Hill church records."
          />
        </div>
      )}
    </PublicLayout>
  );
};
