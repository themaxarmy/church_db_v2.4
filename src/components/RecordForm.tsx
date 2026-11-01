import React, { useRef, useState } from 'react';
import { Upload, UserRound } from 'lucide-react';
import type { Gender, RecordInput } from '../types';
import { EMPTY_FORM } from '../lib/records';
import { resizeImage } from '../lib/image';
import { MINISTRIES } from '../lib/ministries';
import { Field, Spinner } from './ui';

type TextFieldName = Exclude<keyof RecordInput, 'picture' | 'gender'>;
type Errors = Partial<Record<keyof RecordInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ()\-.]{6,30}$/;
const PHONE_FIELDS = ['phone', 'guardianPhone', 'emergencyContactPhone'] as const;
const REQUIRED: [TextFieldName, string][] = [
  ['firstName', 'Enter a first name'],
  ['lastName', 'Enter a last name'],
  ['dateOfBirth', 'Enter a date of birth'],
  ['emergencyContactName', 'Enter an emergency contact'],
  ['emergencyContactPhone', "Enter the emergency contact's phone"],
];
const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

// One titled block of the form: heading and help on the left, fields on the right (stacked on phones).
const Section: React.FC<{ title: string; description?: string; tinted?: boolean; children: React.ReactNode }> = ({
  title,
  description,
  tinted,
  children,
}) => (
  <section className={`flex flex-wrap gap-x-8 gap-y-4 border-b border-line p-5 sm:p-7 ${tinted ? 'bg-accent-soft/40' : ''}`}>
    <div className="w-full sm:w-56 sm:shrink-0">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-ink-muted">{description}</p>}
    </div>
    <div className="grid min-w-0 flex-1 basis-[420px] grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </section>
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
  // Shown beside the buttons, e.g. the consent line on the public form.
  footerNote?: React.ReactNode;
}

// The record fields, shared by the public form, Add record and Edit record.
export const RecordForm: React.FC<RecordFormProps> = ({
  initialValues = EMPTY_FORM,
  submitLabel,
  submittingLabel,
  cancelLabel,
  onCancel,
  onSubmit,
  onChange,
  footerNote,
}) => {
  const [formData, setFormData] = useState<RecordInput>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Keeps an older record's ministry selectable even if it isn't in today's list.
  const ministryOptions =
    initialValues.ministry && !MINISTRIES.includes(initialValues.ministry)
      ? [...MINISTRIES, initialValues.ministry]
      : MINISTRIES;

  const update = <K extends keyof RecordInput>(name: K, value: RecordInput[K]) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    onChange?.();
  };

  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setErrors(prev => ({ ...prev, picture: 'Choose a JPG, PNG, GIF or WebP image' }));
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      // Photos are shrunk before upload, but very large files can stall phones.
      setErrors(prev => ({ ...prev, picture: 'Choose an image smaller than 25MB' }));
      return;
    }
    try {
      update('picture', await resizeImage(file));
    } catch {
      setErrors(prev => ({ ...prev, picture: 'Could not read this image. Try a different photo.' }));
    }
  };

  const validate = () => {
    const next: Errors = {};
    for (const [field, message] of REQUIRED) {
      if (!formData[field].trim()) next[field] = message;
    }
    if (!formData.gender) next.gender = 'Choose male or female';
    if (formData.dateOfBirth && formData.dateOfBirth > todayIso()) next.dateOfBirth = "Date of birth can't be in the future";
    for (const field of PHONE_FIELDS) {
      const value = formData[field].trim();
      if (value && !PHONE_RE.test(value)) next[field] = 'Enter a valid phone number';
    }
    if (formData.email.trim() && !EMAIL_RE.test(formData.email.trim())) next.email = 'Enter a valid email address';
    setErrors(next);
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    if (Object.keys(found).length > 0) {
      // Move focus to the first field with a problem.
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
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

  const reset = () => {
    setFormData(initialValues);
    setErrors({});
    onChange?.();
  };

  const text = (
    name: TextFieldName,
    label: string,
    options: { type?: string; placeholder?: string; required?: boolean; wide?: boolean; hint?: string; autoComplete?: string } = {},
  ) => (
    <Field label={label} required={options.required} error={errors[name]} hint={options.hint} className={options.wide ? 'sm:col-span-2' : ''}>
      {props => (
        <input
          {...props}
          type={options.type ?? 'text'}
          name={name}
          value={formData[name]}
          onChange={e => update(name, e.target.value)}
          placeholder={options.placeholder}
          autoComplete={options.autoComplete}
          max={options.type === 'date' ? todayIso() : undefined}
          disabled={isSubmitting}
          className="field-input"
        />
      )}
    </Field>
  );

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="card overflow-hidden">
      <Section title="About you" description="Fields marked * are required.">
        {text('firstName', 'First name', { required: true, autoComplete: 'given-name' })}
        {text('lastName', 'Last name', { required: true, autoComplete: 'family-name' })}
        {text('otherNames', 'Other names', { wide: true, placeholder: "Middle names or names you're also known by" })}
        {text('dateOfBirth', 'Date of birth', { type: 'date', required: true, autoComplete: 'bday' })}
        <Field label="Ministry or department" error={errors.ministry}>
          {props => (
            <select
              {...props}
              name="ministry"
              value={formData.ministry}
              onChange={e => update('ministry', e.target.value)}
              disabled={isSubmitting}
              className="field-input"
            >
              <option value="">Not in a ministry yet</option>
              {ministryOptions.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          )}
        </Field>
        <fieldset className="sm:col-span-2" aria-describedby={errors.gender ? 'gender-error' : undefined}>
          <legend className="mb-1.5 font-medium">
            Gender<span aria-hidden="true" className="ml-0.5 text-accent-text">*</span>
            <span className="sr-only"> (required)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {GENDERS.map(({ value, label }) => {
              const checked = formData.gender === value;
              return (
                <label
                  key={value}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border px-4 transition-colors ${
                    checked ? 'border-primary bg-primary-soft' : errors.gender ? 'border-danger' : 'border-line-strong hover:bg-surface-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={value}
                    checked={checked}
                    onChange={() => update('gender', value)}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.gender)}
                    className="accent-primary"
                  />
                  {label}
                </label>
              );
            })}
          </div>
          {errors.gender && (
            <p id="gender-error" className="mt-1.5 text-xs font-medium text-danger-text">{errors.gender}</p>
          )}
        </fieldset>
      </Section>

      <Section title="Contact" description="How the church can reach you.">
        {text('phone', 'Phone', { type: 'tel', autoComplete: 'tel' })}
        {text('email', 'Email', { type: 'email', autoComplete: 'email' })}
        <Field label="Address" error={errors.address} className="sm:col-span-2">
          {props => (
            <textarea
              {...props}
              name="address"
              rows={2}
              value={formData.address}
              onChange={e => update('address', e.target.value)}
              placeholder="Street, town"
              autoComplete="street-address"
              disabled={isSubmitting}
              className="field-input resize-y"
            />
          )}
        </Field>
      </Section>

      <Section title="Emergency contact" description="Someone we can call if something happens at church.">
        {text('emergencyContactName', 'Name', { required: true })}
        {text('emergencyContactPhone', 'Phone', { type: 'tel', required: true })}
        {text('emergencyContactRelationship', 'Relationship', { placeholder: 'e.g. Mother, Husband, Friend' })}
      </Section>

      <Section title="Parent or guardian" description="For children and teenagers. Optional.">
        {text('guardianName', 'Name')}
        {text('guardianPhone', 'Phone', { type: 'tel' })}
      </Section>

      <Section title="Photo" description="Optional. Helps staff recognise you.">
        <div
          className={`flex flex-wrap items-center gap-4 rounded-lg sm:col-span-2 ${dragActive ? 'bg-primary-soft' : ''}`}
          onDragOver={e => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={e => {
            e.preventDefault();
            setDragActive(false);
            handleImage(e.dataTransfer.files[0]);
          }}
        >
          {formData.picture ? (
            <img src={formData.picture} alt="Selected photo" className="h-[72px] w-[72px] rounded-full object-cover" />
          ) : (
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-dashed border-line-strong bg-chip text-ink-subtle">
              <UserRound className="h-7 w-7" />
            </span>
          )}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap gap-2">
              <label className="btn btn-secondary cursor-pointer">
                <Upload className="h-4 w-4" />
                {formData.picture ? 'Change photo' : 'Upload a photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="sr-only"
                  disabled={isSubmitting}
                  onChange={e => {
                    handleImage(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </label>
              {formData.picture && (
                <button type="button" className="btn btn-ghost" onClick={() => update('picture', null)} disabled={isSubmitting}>
                  Remove
                </button>
              )}
            </div>
            <p className={`text-xs ${errors.picture ? 'font-medium text-danger-text' : 'text-ink-muted'}`}>
              {errors.picture ?? "JPG, PNG or WebP. We'll resize it for you."}
            </p>
          </div>
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-3 bg-surface-muted px-5 py-4 sm:px-7">
        <div className="min-w-0 flex-1 basis-64 text-xs text-ink-muted">{footerNote}</div>
        <button type="button" className="btn btn-ghost" onClick={onCancel ?? reset} disabled={isSubmitting}>
          {cancelLabel}
        </button>
        <button type="submit" className="btn btn-primary min-h-[44px] px-5" disabled={isSubmitting}>
          {isSubmitting && <Spinner className="h-4 w-4" />}
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
};
