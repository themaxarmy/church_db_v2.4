// Shared shapes returned by the API (see server/).

export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'user' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Gender = 'male' | 'female';

export interface FormRecord {
  id: string;
  firstName: string;
  lastName: string;
  otherNames: string;
  dateOfBirth: string;
  picture: string | null;
  gender: Gender | null;
  phone: string;
  email: string;
  address: string;
  ministry: string;
  guardianName: string;
  guardianPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  archivedAt: string | null;
  submittedBy: string | null;
  submittedByEmail: string | null;
  updatedBy: string | null;
  updatedByEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

// Fields the form and the edit API accept. The rest are set by the server.
export type RecordInput = Omit<
  FormRecord,
  'id' | 'archivedAt' | 'submittedBy' | 'submittedByEmail' | 'updatedBy' | 'updatedByEmail' | 'createdAt' | 'updatedAt'
>;
