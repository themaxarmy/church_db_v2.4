import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '../lib/api';
import { RecordForm } from '../components/RecordForm';
import { PageHeader } from '../components/AppShell';
import { Alert } from '../components/ui';
import type { RecordInput } from '../types';

// Staff adding a record themselves. The API records them as the person who added it.
export const NewRecord: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (record: RecordInput) => {
    setError(null);
    try {
      await apiClient.createRecord(record);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <Link to="/" className="flex items-center gap-1.5 self-start font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Records
      </Link>
      <PageHeader title="Add record" />
      {error && <Alert>{error}</Alert>}
      <RecordForm
        submitLabel="Save record"
        submittingLabel="Saving…"
        cancelLabel="Cancel"
        onCancel={() => navigate('/')}
        onSubmit={handleSubmit}
        onChange={() => setError(null)}
      />
    </div>
  );
};
