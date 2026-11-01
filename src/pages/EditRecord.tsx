import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiClient } from '../lib/api';
import { RecordForm } from '../components/RecordForm';
import { PageHeader } from '../components/AppShell';
import { Alert, LoadingBlock } from '../components/ui';
import { EMPTY_FORM, formatDate } from '../lib/records';
import type { FormRecord, RecordInput } from '../types';

const toInput = (record: FormRecord) =>
  Object.fromEntries(Object.keys(EMPTY_FORM).map(key => [key, record[key as keyof RecordInput]])) as RecordInput;

export const EditRecord: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<FormRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .getRecord(id)
      .then(setRecord)
      .catch(err => setLoadError(err instanceof Error ? err.message : 'Failed to load record'));
  }, [id]);

  const handleSubmit = async (values: RecordInput) => {
    if (!record) return;
    setSaveError(null);
    // Only send what changed, so an unchanged photo isn't uploaded again.
    const initial = toInput(record);
    const changes = Object.fromEntries(
      Object.entries(values).filter(([key, value]) => value !== initial[key as keyof RecordInput]),
    ) as Partial<RecordInput>;

    try {
      if (Object.keys(changes).length > 0) await apiClient.updateRecord(record.id, changes);
      navigate('/');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save record');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <Link to="/" className="flex items-center gap-1.5 self-start font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Records
      </Link>
      {loadError ? (
        <Alert>{loadError}</Alert>
      ) : !record ? (
        <div className="card">
          <LoadingBlock label="Loading record…" />
        </div>
      ) : (
        <>
          <PageHeader
            title={`Edit ${record.firstName} ${record.lastName}`}
            subtitle={
              <>
                Added {formatDate(record.createdAt)} {record.submittedByEmail ? `by ${record.submittedByEmail}` : 'through the public form'}
                {record.updatedBy && ` · Last updated ${formatDate(record.updatedAt)} by ${record.updatedByEmail ?? 'a removed user'}`}
                {record.archivedAt && ' · Archived'}
              </>
            }
          />
          {saveError && <Alert>{saveError}</Alert>}
          <RecordForm
            initialValues={toInput(record)}
            submitLabel="Save changes"
            submittingLabel="Saving…"
            cancelLabel="Cancel"
            onCancel={() => navigate('/')}
            onSubmit={handleSubmit}
            onChange={() => setSaveError(null)}
          />
        </>
      )}
    </div>
  );
};
