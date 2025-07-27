import React, { useState } from 'react';
import { Upload, Save, CheckCircle, AlertCircle, ArrowLeft, Database, Shield } from 'lucide-react';
import { apiClient } from '../lib/api';

export const DataCollection: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    otherNames: '',
    dateOfBirth: '',
    picture: null as string | null,
  });

  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (submitStatus !== 'idle') {
      setSubmitStatus('idle');
    }
  };

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, picture: 'Image size must be less than 5MB' }));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, picture: e.target?.result as string }));
        if (errors.picture) {
          setErrors(prev => ({ ...prev, picture: '' }));
        }
      };
      reader.readAsDataURL(file);
    } else {
      setErrors(prev => ({ ...prev, picture: 'Please select a valid image file' }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    
    // Validate date is not in the future
    if (formData.dateOfBirth && new Date(formData.dateOfBirth) > new Date()) {
      newErrors.dateOfBirth = 'Date of birth cannot be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await apiClient.createRecord({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        otherNames: formData.otherNames.trim() || '',
        dateOfBirth: formData.dateOfBirth,
        picture: formData.picture,
      });

      setSubmitStatus('success');
      setSubmitMessage('Your information has been submitted successfully!');
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          otherNames: '',
          dateOfBirth: '',
          picture: null,
        });
        setSubmitStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
      
      if (error instanceof Error) {
        if (error.message.includes('connection') || error.message.includes('fetch')) {
          setSubmitMessage('Unable to connect to the server. Please check your internet connection and try again.');
        } else {
          setSubmitMessage(`Submission failed: ${error.message}`);
        }
      } else {
        setSubmitMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      otherNames: '',
      dateOfBirth: '',
      picture: null,
    });
    setErrors({});
    setSubmitStatus('idle');
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
                <p className="text-sm text-gray-600">Secure database submission</p>
              </div>
            </div>
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </a>
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
              Please fill out the form below with your personal details. All information is securely stored in our MongoDB Atlas database with enterprise-grade security.
            </p>
            
            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-semibold text-blue-900 mb-1">Privacy & Security</h3>
                  <p className="text-sm text-blue-800">
                    Your personal information is protected by industry-standard encryption and will only be used for the intended purpose. 
                    We comply with data protection regulations and maintain strict confidentiality.
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
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg ${
                      errors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter your first name"
                    disabled={isSubmitting}
                  />
                  {errors.firstName && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg ${
                      errors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Enter your last name"
                    disabled={isSubmitting}
                  />
                  {errors.lastName && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Other Names */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Other Names
                  <span className="text-gray-500 font-normal ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="otherNames"
                  value={formData.otherNames}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-all text-lg"
                  placeholder="Enter any other names or middle names"
                  disabled={isSubmitting}
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg ${
                    errors.dateOfBirth ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.dateOfBirth && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>

              {/* Picture Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Profile Picture
                  <span className="text-gray-500 font-normal ml-1">(Optional)</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : errors.picture 
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                >
                  {formData.picture ? (
                    <div className="space-y-4">
                      <img
                        src={formData.picture}
                        alt="Uploaded preview"
                        className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-white shadow-lg"
                      />
                      <div className="space-y-2">
                        <p className="text-green-600 font-medium">Image uploaded successfully!</p>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, picture: null }))}
                          className="text-red-600 hover:text-red-700 text-sm font-medium underline"
                          disabled={isSubmitting}
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2 text-lg">
                        Drag and drop an image here, or click to select
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Supports JPG, PNG, GIF up to 5MB
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileInput}
                        className="hidden"
                        id="file-upload"
                        disabled={isSubmitting}
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer transition-colors font-medium disabled:opacity-50"
                      >
                        Choose File
                      </label>
                    </>
                  )}
                </div>
                {errors.picture && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.picture}
                  </p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Submit to Database
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer Information */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              By submitting this form, you acknowledge that your information will be stored securely 
              in our MongoDB Atlas database and used in accordance with our privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};