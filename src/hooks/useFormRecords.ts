import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../lib/api';
import type { FormRecord, RecordInput } from '../types';

export const useFormRecords = () => {
  const [records, setRecords] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const { records } = await apiClient.getRecords();
      setRecords(records);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRecord = async (id: string, updates: Partial<RecordInput>) => {
    const updated = await apiClient.updateRecord(id, updates);
    setRecords(prev => prev.map(record => (record.id === id ? updated : record)));
    return updated;
  };

  const setArchived = async (id: string, archived: boolean) => {
    const updated = await (archived ? apiClient.archiveRecord(id) : apiClient.restoreRecord(id));
    setRecords(prev => prev.map(record => (record.id === id ? updated : record)));
    return updated;
  };

  const deleteRecord = async (id: string) => {
    await apiClient.deleteRecord(id);
    setRecords(prev => prev.filter(record => record.id !== id));
  };

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, error, updateRecord, setArchived, deleteRecord, refetch: fetchRecords };
};
