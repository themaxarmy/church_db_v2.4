// hooks/useFormRecords.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api'; // Ensure this correctly imports your apiClient instance
import type { FormRecord } from '../lib/postgres'; // Assuming this defines the client-side record structure
import type { RawApiRecord, CreateRecordPayload, UpdateRecordPayload, GetRecordsResponse } from '../lib/api'; // Import types from api.ts

// Your FormRecord interface for the client-side (ensure it's consistent with your postgres.ts or types.ts)
// export interface FormRecord {
//   id: string; // Client-side ID, maps to _id from MongoDB
//   timestamp: string; // Client-side timestamp, maps to createdAt from MongoDB
//   firstName: string;
//   lastName: string;
//   otherNames: string; // Make it string, and provide default ''
//   dateOfBirth: string;
//   picture: string;
// }

export const useFormRecords = () => {
  const [records, setRecords] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      // apiClient.getRecords() now returns Promise<GetRecordsResponse>
      const response: GetRecordsResponse = await apiClient.getRecords();
      
      // FIX: Access the 'records' property from the response object before mapping
      const formattedRecords: FormRecord[] = response.records.map((record: RawApiRecord) => ({
        id: record._id,
        timestamp: record.createdAt,
        firstName: record.firstName,
        lastName: record.lastName,
        otherNames: record.otherNames || '', // Ensure it's a string, even if optional from API
        dateOfBirth: record.dateOfBirth,
        picture: record.picture,
      }));

      setRecords(formattedRecords);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const addRecord = async (recordData: Omit<FormRecord, 'id' | 'timestamp'>) => {
    try {
      const payload: CreateRecordPayload = {
        firstName: recordData.firstName,
        lastName: recordData.lastName,
        otherNames: recordData.otherNames,
        dateOfBirth: recordData.dateOfBirth,
        picture: recordData.picture,
      };

      const response: RawApiRecord = await apiClient.createRecord(payload);

      const newRecord: FormRecord = {
        id: response._id,
        timestamp: response.createdAt,
        firstName: response.firstName,
        lastName: response.lastName,
        otherNames: response.otherNames || '',
        dateOfBirth: response.dateOfBirth,
        picture: response.picture,
      };

      setRecords(prev => [newRecord, ...prev]);
      return newRecord;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add record');
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      await apiClient.deleteRecord(id);
      setRecords(prev => prev.filter(record => record.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete record');
    }
  };

  const updateRecord = async (id: string, updates: Partial<Omit<FormRecord, 'id' | 'timestamp'>>) => {
    try {
      // Create payload only with explicitly provided updates
      const payload: UpdateRecordPayload = {};
      if (updates.firstName !== undefined) payload.firstName = updates.firstName;
      if (updates.lastName !== undefined) payload.lastName = updates.lastName;
      if (updates.otherNames !== undefined) payload.otherNames = updates.otherNames;
      if (updates.dateOfBirth !== undefined) payload.dateOfBirth = updates.dateOfBirth;
      if (updates.picture !== undefined) payload.picture = updates.picture;

      const response: RawApiRecord = await apiClient.updateRecord(id, payload);

      const updatedRecord: FormRecord = {
        id: response._id,
        timestamp: response.createdAt,
        firstName: response.firstName,
        lastName: response.lastName,
        otherNames: response.otherNames || '',
        dateOfBirth: response.dateOfBirth,
        picture: response.picture,
      };

      setRecords(prev => prev.map(record => 
        record.id === id ? updatedRecord : record
      ));

      return updatedRecord;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update record');
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return {
    records,
    loading,
    error,
    addRecord,
    deleteRecord,
    updateRecord,
    refetch: fetchRecords,
  };
};