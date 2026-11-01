import type { RecordInput } from '../types';

// A blank record, for the public form.
export const EMPTY_FORM: RecordInput = {
  firstName: '',
  lastName: '',
  otherNames: '',
  dateOfBirth: '',
  picture: null,
  gender: null,
  phone: '',
  email: '',
  address: '',
  ministry: '',
  guardianName: '',
  guardianPhone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
};

// Age in whole years on `today`, from a YYYY-MM-DD date of birth.
export const ageOn = (dateOfBirth: string, today = new Date()) => {
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const hadBirthday = today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  return today.getFullYear() - year - (hadBirthday ? 0 : 1);
};

// "12 Mar 1985". Plain YYYY-MM-DD dates are read as local dates so they don't shift by a day.
export const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export const GENDER_LABELS = { male: 'Male', female: 'Female' } as const;
