import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Database,
  LogOut,
  UserCheck,
  Clock,
  Shield,
  Plus,
  Search,
  Download,
  Trash2,
  Calendar,
  Mail,
  AlertCircle,
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFormRecords } from '../hooks/useFormRecords';
import { useUserManagement } from '../hooks/useUserManagement';
import type { FormRecord } from '../types';

const ROLE_LABELS = { user: 'User', admin: 'Admin', super_admin: 'Super Admin' } as const;

const formatDate = (value: string) => {
  // Dates of birth are plain YYYY-MM-DD; parse as local time so they don't shift a day.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

const GENDER_LABELS = { male: 'Male', female: 'Female' } as const;

const CSV_COLUMNS: [string, (r: FormRecord) => string][] = [
  ['First Name', r => r.firstName],
  ['Last Name', r => r.lastName],
  ['Other Names', r => r.otherNames],
  ['Date of Birth', r => r.dateOfBirth],
  ['Gender', r => (r.gender ? GENDER_LABELS[r.gender] : '')],
  ['Ministry', r => r.ministry],
  ['Phone', r => r.phone],
  ['Email', r => r.email],
  ['Address', r => r.address],
  ['Parent/Guardian Name', r => r.guardianName],
  ['Parent/Guardian Phone', r => r.guardianPhone],
  ['Emergency Contact Name', r => r.emergencyContactName],
  ['Emergency Contact Phone', r => r.emergencyContactPhone],
  ['Emergency Contact Relationship', r => r.emergencyContactRelationship],
  ['Archived', r => r.archivedAt ?? ''],
  ['Added By', r => r.submittedByEmail ?? ''],
  ['Last Updated By', r => r.updatedByEmail ?? ''],
  ['Created', r => r.createdAt],
  ['Updated', r => r.updatedAt],
];

const exportRecordsCsv = (records: FormRecord[]) => {
  const header = CSV_COLUMNS.map(([label]) => label);
  const rows = records.map(r => CSV_COLUMNS.map(([, value]) => value(r)));
  const csv = [header, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `records-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const Detail: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
    <div className="mt-1 text-sm text-gray-900">{children || '—'}</div>
  </div>
);

const contactLine = (name: string, phone: string, extra?: string) =>
  [name, extra && `(${extra})`, phone].filter(Boolean).join(' ');

const RecordDetails: React.FC<{ record: FormRecord }> = ({ record }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <Detail label="Address">
      <span className="whitespace-pre-line">{record.address}</span>
    </Detail>
    <Detail label="Parent / Guardian">{contactLine(record.guardianName, record.guardianPhone)}</Detail>
    <Detail label="Emergency Contact">
      {contactLine(record.emergencyContactName, record.emergencyContactPhone, record.emergencyContactRelationship)}
    </Detail>
    <Detail label="Added">
      {formatDate(record.createdAt)} {record.submittedByEmail ? `by ${record.submittedByEmail}` : 'via public form'}
    </Detail>
    <Detail label="Last Updated">
      {record.updatedBy ? `${formatDate(record.updatedAt)} by ${record.updatedByEmail ?? 'a removed user'}` : ''}
    </Detail>
    <Detail label="Archived">{record.archivedAt && formatDate(record.archivedAt)}</Detail>
  </div>
);

const StatCard: React.FC<{ icon: React.ReactNode; tint: string; value: number; label: string }> = ({
  icon,
  tint,
  value,
  label,
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${tint}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  </div>
);

// Only mounted for super admins, since /users is restricted to them.
const UserStats: React.FC = () => {
  const { users } = useUserManagement();
  return (
    <>
      <StatCard
        icon={<UserCheck className="w-6 h-6 text-green-600" />}
        tint="bg-green-100"
        value={users.filter(u => u.status === 'approved').length}
        label="Approved Users"
      />
      <StatCard
        icon={<Clock className="w-6 h-6 text-yellow-600" />}
        tint="bg-yellow-100"
        value={users.filter(u => u.status === 'pending').length}
        label="Pending Approval"
      />
    </>
  );
};

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { records, loading, error, setArchived, deleteRecord } = useFormRecords();
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!user) return null;

  const isSuperAdmin = user.role === 'super_admin';
  const canManage = user.role === 'admin' || isSuperAdmin;

  const activeRecords = records.filter(record => !record.archivedAt);
  const archivedCount = records.length - activeRecords.length;
  const term = searchTerm.trim().toLowerCase();
  const filteredRecords = (showArchived ? records : activeRecords).filter(record =>
    [record.firstName, record.lastName, record.otherNames, record.phone, record.email, record.ministry].some(value =>
      value.toLowerCase().includes(term)
    )
  );

  const handleArchive = async (id: string, archived: boolean) => {
    setActionError(null);
    try {
      await setArchived(id, archived);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update record');
    }
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    try {
      await deleteRecord(id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete record');
    } finally {
      setConfirmingDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg shadow-lg">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Holy Hill Records
                </h1>
                <p className="text-sm text-gray-600">Records Management</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">{ROLE_LABELS[user.role]}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                {user.email}
              </div>

              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Database className="w-6 h-6 text-blue-600" />}
            tint="bg-blue-100"
            value={activeRecords.length}
            label="Active Records"
          />
          {isSuperAdmin && <UserStats />}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/collect"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Record
            </Link>

            {isSuperAdmin && (
              <Link
                to="/users"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users className="w-4 h-4" />
                Manage Users
              </Link>
            )}

            <button
              onClick={() => exportRecordsCsv(filteredRecords)}
              disabled={filteredRecords.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Records */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[16rem]">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, phone, email or ministry..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={e => setShowArchived(e.target.checked)}
                className="rounded border-gray-300"
              />
              Show archived ({archivedCount})
            </label>
          </div>

          <div className="p-6">
            {(error || actionError) && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{actionError || error}</span>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No records found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchTerm ? 'Try adjusting your search terms' : 'Start by adding your first record'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="w-8"></th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date of Birth</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Ministry</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Added</th>
                      {canManage && <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(record => {
                      const isExpanded = expanded === record.id;
                      return (
                        <React.Fragment key={record.id}>
                          <tr className={`border-b border-gray-100 hover:bg-gray-50 ${record.archivedAt ? 'opacity-60' : ''}`}>
                            <td className="py-3 pl-2">
                              <button
                                onClick={() => setExpanded(isExpanded ? null : record.id)}
                                className="p-1 text-gray-400 hover:text-gray-700"
                                title={isExpanded ? 'Hide details' : 'Show details'}
                                aria-expanded={isExpanded}
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {record.picture && (
                                  <img
                                    src={record.picture}
                                    alt=""
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {record.firstName} {record.lastName}
                                    {record.archivedAt && (
                                      <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">Archived</span>
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {[record.otherNames, record.gender && GENDER_LABELS[record.gender]].filter(Boolean).join(' · ')}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatDate(record.dateOfBirth)}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {record.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5" />
                                  {record.phone}
                                </div>
                              )}
                              {record.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3.5 h-3.5" />
                                  {record.email}
                                </div>
                              )}
                              {!record.phone && !record.email && '—'}
                            </td>
                            <td className="py-3 px-4 text-gray-600">{record.ministry || '—'}</td>
                            <td className="py-3 px-4 text-gray-600">{formatDate(record.createdAt)}</td>
                            {canManage && (
                              <td className="py-3 px-4">
                                {confirmingDelete === record.id ? (
                                  <div className="flex items-center gap-2 text-sm">
                                    <button
                                      onClick={() => handleDelete(record.id)}
                                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      onClick={() => setConfirmingDelete(null)}
                                      className="px-2 py-1 text-gray-600 hover:text-gray-800"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleArchive(record.id, !record.archivedAt)}
                                      className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                                      title={record.archivedAt ? 'Restore record' : 'Archive record'}
                                    >
                                      {record.archivedAt ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                                    </button>
                                    <button
                                      onClick={() => setConfirmingDelete(record.id)}
                                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                      title="Delete record"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                          {isExpanded && (
                            <tr className="border-b border-gray-100 bg-gray-50">
                              <td></td>
                              <td colSpan={canManage ? 6 : 5} className="py-4 px-4">
                                <RecordDetails record={record} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
