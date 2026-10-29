import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Database } from 'lucide-react';
import { apiClient } from '../lib/api';
import { RecordForm } from '../components/RecordForm';
import { EMPTY_FORM } from '../lib/records';
import type { FormRecord, RecordInput } from '../types';

const toInput = (record: FormRecord) =>
  Object.fromEntries(Object.keys(EMPTY_FORM).map(key => [key, record[key as keyof RecordInput]])) as RecordInput;

const formatDateTime = (value: string) => new Date(value).toLocaleString();

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
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Edit Record
                </h1>
                <p className="text-sm text-gray-600">Holy Hill Records</p>
              </div>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {loadError ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{loadError}</span>
            </div>
          ) : !record ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading record...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {record.firstName} {record.lastName}
                  {record.archivedAt && (
                    <span className="ml-3 align-middle px-2 py-0.5 text-sm bg-gray-200 text-gray-700 rounded-full">
                      Archived
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Added {formatDateTime(record.createdAt)}{' '}
                  {record.submittedByEmail ? `by ${record.submittedByEmail}` : 'via the public form'}
                  {record.updatedBy &&
                    ` · Last updated ${formatDateTime(record.updatedAt)} by ${record.updatedByEmail ?? 'a removed user'}`}
                </p>
              </div>

              {saveError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700">{saveError}</span>
                </div>
              )}

              <RecordForm
                initialValues={toInput(record)}
                submitLabel="Save Changes"
                submittingLabel="Saving..."
                cancelLabel="Cancel"
                onCancel={() => navigate('/')}
                onSubmit={handleSubmit}
                onChange={() => setSaveError(null)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
