import React, { useState } from 'react';
import { Upload, Save, AlertCircle } from 'lucide-react';
import type { Gender, RecordInput } from '../types';
import { EMPTY_FORM } from '../lib/records';
import { resizeImage } from '../lib/image';

type TextFieldName = Exclude<keyof RecordInput, 'picture' | 'gender'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ()\-.]{6,30}$/;
const PHONE_FIELDS = ['phone', 'guardianPhone', 'emergencyContactPhone'] as const;

const ageOn = (dateOfBirth: string, today = new Date()) => {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const hadBirthday = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  return today.getFullYear() - year - (hadBirthday ? 0 : 1);
};

const inputClass = (error?: string) =>
  `w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg ${
    error ? 'border-red-500 bg-red-50 dark:bg-red-950/40' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
  }`;

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
      <AlertCircle className="w-4 h-4" />
      {message}
    </p>
  ) : null;

const FieldLabel: React.FC<{ label: string; required?: boolean }> = ({ label, required }) => (
  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
    {label}
    {required ? ' *' : <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">(Optional)</span>}
  </label>
);

const SectionHeading: React.FC<{ title: string; note?: string }> = ({ title, note }) => (
  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
    {note && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{note}</p>}
  </div>
);

interface RecordFormProps {
  initialValues?: RecordInput;
  submitLabel: string;
  submittingLabel: string;
  cancelLabel: string;
  // Defaults to resetting the form to initialValues.
  onCancel?: () => void;
  // Receives trimmed values. Handle errors inside; the form only tracks the pending state.
  onSubmit: (record: RecordInput) => Promise<void>;
  onChange?: () => void;
}

// The record fields, shared by the public form and the edit page.
export const RecordForm: React.FC<RecordFormProps> = ({
  initialValues = EMPTY_FORM,
  submitLabel,
  submittingLabel,
  cancelLabel,
  onCancel,
  onSubmit,
  onChange,
}) => {
  const [formData, setFormData] = useState<RecordInput>(initialValues);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMinor = Boolean(formData.dateOfBirth) && ageOn(formData.dateOfBirth) < 18;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    onChange?.();
  };

  const handleImageUpload = async (file: File) => {
    if (!file || !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setErrors(prev => ({ ...prev, picture: 'Please select a valid image file' }));
      return;
    }
    if (file.size > 25 * 1024 * 1024) { // Shrunk before upload, but very large files can stall phones
      setErrors(prev => ({ ...prev, picture: 'Image size must be less than 25MB' }));
      return;
    }

    try {
      const picture = await resizeImage(file);
      setFormData(prev => ({ ...prev, picture }));
      setErrors(prev => ({ ...prev, picture: '' }));
      onChange?.();
    } catch {
      setErrors(prev => ({ ...prev, picture: 'Could not read this image. Try a different photo.' }));
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

    if (isMinor) {
      if (!formData.guardianName.trim()) newErrors.guardianName = 'Required for anyone under 18';
      if (!formData.guardianPhone.trim()) newErrors.guardianPhone = 'Required for anyone under 18';
    }
    for (const field of PHONE_FIELDS) {
      const value = formData[field].trim();
      if (value && !PHONE_RE.test(value)) newErrors[field] = 'Enter a valid phone number';
    }
    if (formData.email.trim() && !EMAIL_RE.test(formData.email.trim())) {
      newErrors.email = 'Enter a valid email address';
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
    try {
      const trimmed = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
      ) as RecordInput;
      await onSubmit(trimmed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(initialValues);
    setErrors({});
    onChange?.();
  };

  const textField = (name: TextFieldName, label: string, options: { type?: string; placeholder?: string; required?: boolean } = {}) => (
    <div>
      <FieldLabel label={label} required={options.required} />
      <input
        type={options.type ?? 'text'}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className={inputClass(errors[name])}
        placeholder={options.placeholder}
        disabled={isSubmitting}
      />
      <FieldError message={errors[name]} />
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg ${
                errors.firstName ? 'border-red-500 bg-red-50 dark:bg-red-950/40' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              placeholder="Enter your first name"
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg ${
                errors.lastName ? 'border-red-500 bg-red-50 dark:bg-red-950/40' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              placeholder="Enter your last name"
              disabled={isSubmitting}
            />
            {errors.lastName && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Other Names */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Other Names
            <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">(Optional)</span>
          </label>
          <input
            type="text"
            name="otherNames"
            value={formData.otherNames}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all text-lg"
            placeholder="Enter any other names or middle names"
            disabled={isSubmitting}
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Date of Birth *
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            max={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg ${
              errors.dateOfBirth ? 'border-red-500 bg-red-50 dark:bg-red-950/40' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            disabled={isSubmitting}
          />
          {errors.dateOfBirth && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.dateOfBirth}
            </p>
          )}
        </div>

        {/* Gender */}
        <div>
          <FieldLabel label="Gender" />
          <select
            name="gender"
            value={formData.gender ?? ''}
            onChange={e => setFormData(prev => ({ ...prev, gender: (e.target.value || null) as Gender | null }))}
            className={inputClass()}
            disabled={isSubmitting}
          >
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* Church */}
        {textField('ministry', 'Ministry or Group', { placeholder: 'e.g. Teens, Choir, Ushers' })}

        {/* Contact */}
        <SectionHeading title="Contact Details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {textField('phone', 'Phone', { type: 'tel', placeholder: 'Your phone number' })}
          {textField('email', 'Email', { type: 'email', placeholder: 'you@example.com' })}
        </div>
        <div>
          <FieldLabel label="Address" />
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            rows={2}
            className={inputClass(errors.address)}
            placeholder="Street, town, postcode"
            disabled={isSubmitting}
          />
        </div>

        {/* Parent / Guardian */}
        <SectionHeading
          title="Parent or Guardian"
          note={isMinor ? 'Required because you are under 18.' : 'Required for anyone under 18.'}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {textField('guardianName', 'Name', { placeholder: 'Parent or guardian name', required: isMinor })}
          {textField('guardianPhone', 'Phone', { type: 'tel', placeholder: 'Parent or guardian phone', required: isMinor })}
        </div>

        {/* Emergency Contact */}
        <SectionHeading title="Emergency Contact" note="Someone we can call in an emergency." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {textField('emergencyContactName', 'Name', { placeholder: 'Full name' })}
          {textField('emergencyContactPhone', 'Phone', { type: 'tel', placeholder: 'Phone number' })}
        </div>
        {textField('emergencyContactRelationship', 'Relationship', { placeholder: 'e.g. Mother, Uncle, Friend' })}

        {/* Picture Upload */}
        <SectionHeading title="Photo" />
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Profile Picture
            <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">(Optional)</span>
          </label>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40' 
                : errors.picture 
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/40'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
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
                  className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-white dark:border-gray-800 shadow-lg"
                />
                <div className="space-y-2">
                  <p className="text-green-600 dark:text-green-400 font-medium">Image uploaded successfully!</p>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, picture: null }))}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline"
                    disabled={isSubmitting}
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2 text-lg">
                  Drag and drop an image here, or click to select
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Supports JPG, PNG, GIF, WebP up to 25MB
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
            <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {errors.picture}
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel ?? resetForm}
            disabled={isSubmitting}
            className="flex-1 px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl hover:from-blue-700 hover:to-teal-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-gray-800"></div>
                {submittingLabel}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {submitLabel}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
