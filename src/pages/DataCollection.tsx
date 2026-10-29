import React, { useState } from 'react';
import { CheckCircle, AlertCircle, ArrowLeft, Database, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { RecordForm } from '../components/RecordForm';
import type { RecordInput } from '../types';

export const DataCollection: React.FC = () => {
  // Changing the key remounts RecordForm, which clears it.
  const [formKey, setFormKey] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (record: RecordInput) => {
    setSubmitStatus('idle');
    try {
      await apiClient.createRecord(record);

      setSubmitStatus('success');
      setSubmitMessage('Your information has been submitted successfully!');

      // Reset form after successful submission
      setTimeout(() => {
        setFormKey(key => key + 1);
        setSubmitStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
      setSubmitMessage(
        error instanceof Error ? `Submission failed: ${error.message}` : 'An unexpected error occurred. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Data Collection Form
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
          {/* Introduction */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Submit Your Information
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Please fill out the form below with your personal details. Your details will be added to the Holy Hill church records.
            </p>
            
            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-semibold text-blue-900 mb-1">Privacy & Security</h3>
                  <p className="text-sm text-blue-800">
                    Your information is only visible to approved church administrators and will only be used for church record-keeping.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700 font-medium">{submitMessage}</span>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-red-700 font-medium block">{submitMessage}</span>
                  <p className="text-sm text-red-600 mt-2">
                    If this problem persists, please contact the administrator or try again later.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <RecordForm
            key={formKey}
            submitLabel="Submit"
            submittingLabel="Submitting..."
            cancelLabel="Clear Form"
            onSubmit={handleSubmit}
            onChange={() => setSubmitStatus('idle')}
          />

          {/* Footer Information */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              By submitting this form, you agree to your information being stored in the Holy Hill church records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};