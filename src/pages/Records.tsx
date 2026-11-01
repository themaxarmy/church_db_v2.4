import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  ChevronRight,
  Clock,
  Download,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUsers } from '../contexts/UsersContext';
import { useFormRecords } from '../hooks/useFormRecords';
import { PageHeader } from '../components/AppShell';
import { Alert, Avatar, ConfirmDialog, EmptyState, LoadingBlock, Menu, type MenuItem } from '../components/ui';
import { MINISTRIES } from '../lib/ministries';
import { ageOn, formatDate, GENDER_LABELS } from '../lib/records';
import type { FormRecord } from '../types';

const fullName = (r: FormRecord) => `${r.firstName} ${r.lastName}`;
const isMinor = (r: FormRecord) => ageOn(r.dateOfBirth) < 18;
const summary = (r: FormRecord) =>
  [r.gender && GENDER_LABELS[r.gender], `${ageOn(r.dateOfBirth)}`].filter(Boolean).join(' · ');

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

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

const MinorChip: React.FC<{ record: FormRecord }> = ({ record }) =>
  isMinor(record) ? <span className="chip-accent">Under 18</span> : null;

const ArchivedChip: React.FC<{ record: FormRecord }> = ({ record }) =>
  record.archivedAt ? <span className="chip">Archived</span> : null;

const DetailBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col gap-1.5 border-t border-line pt-4">
    <h3 className="text-xs font-semibold text-ink-muted">{title}</h3>
    {children}
  </div>
);

interface DetailsProps {
  record: FormRecord;
  canManage: boolean;
  onClose: () => void;
  onArchive: (record: FormRecord) => void;
  onDelete: (record: FormRecord) => void;
}

// Everything about one person. Beside the list on wide screens, full screen on phones and tablets.
const RecordDetails: React.FC<DetailsProps> = ({ record, canManage, onClose, onArchive, onDelete }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const guardian = record.guardianName || record.guardianPhone;
  return (
    <aside
      aria-label={`Details for ${fullName(record)}`}
      className="fixed inset-0 z-40 flex flex-col gap-4 overflow-y-auto bg-surface p-5 lg:static lg:z-auto lg:w-[380px] lg:shrink-0 lg:self-start lg:rounded-xl lg:border lg:border-line"
    >
      <div className="flex items-start gap-3.5">
        <Avatar name={fullName(record)} picture={record.picture} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{fullName(record)}</h2>
          {record.otherNames && <p className="text-ink-muted">{record.otherNames}</p>}
          <p className="text-ink-muted">
            {summary(record)} · born {formatDate(record.dateOfBirth)}
          </p>
        </div>
        <button type="button" className="icon-btn" aria-label="Close details" onClick={onClose}>
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {record.ministry && <span className="chip">{record.ministry}</span>}
        <MinorChip record={record} />
        <ArchivedChip record={record} />
      </div>

      <DetailBlock title="Contact">
        {record.phone || record.email || record.address ? (
          <>
            {record.phone && (
              <a href={`tel:${record.phone}`} className="flex items-center gap-2.5 hover:underline">
                <Phone className="h-4 w-4 text-ink-subtle" />
                {record.phone}
              </a>
            )}
            {record.email && (
              <a href={`mailto:${record.email}`} className="flex items-center gap-2.5 break-all text-primary-text hover:underline">
                <Mail className="h-4 w-4 shrink-0 text-ink-subtle" />
                {record.email}
              </a>
            )}
            {record.address && <p className="whitespace-pre-line">{record.address}</p>}
          </>
        ) : (
          <p className="text-ink-muted">No contact details</p>
        )}
      </DetailBlock>

      <DetailBlock title="Emergency contact">
        {record.emergencyContactName ? (
          <>
            <p className="font-semibold">
              {record.emergencyContactName}
              {record.emergencyContactRelationship && (
                <span className="font-normal text-ink-muted"> · {record.emergencyContactRelationship}</span>
              )}
            </p>
            {record.emergencyContactPhone && (
              <a href={`tel:${record.emergencyContactPhone}`} className="text-ink-muted hover:underline">
                {record.emergencyContactPhone}
              </a>
            )}
          </>
        ) : (
          <p className="text-ink-muted">Not given</p>
        )}
      </DetailBlock>

      {guardian && (
        <DetailBlock title="Parent or guardian">
          {record.guardianName && <p className="font-semibold">{record.guardianName}</p>}
          {record.guardianPhone && (
            <a href={`tel:${record.guardianPhone}`} className="text-ink-muted hover:underline">
              {record.guardianPhone}
            </a>
          )}
        </DetailBlock>
      )}

      <p className="border-t border-line pt-4 text-xs text-ink-muted">
        Added {formatDate(record.createdAt)} {record.submittedByEmail ? `by ${record.submittedByEmail}` : 'through the public form'}
        {record.updatedBy && (
          <>
            <br />
            Last updated {formatDate(record.updatedAt)} by {record.updatedByEmail ?? 'a removed user'}
          </>
        )}
        {record.archivedAt && (
          <>
            <br />
            Archived {formatDate(record.archivedAt)}
          </>
        )}
      </p>

      {canManage && (
        <div className="flex flex-wrap gap-2.5">
          <Link to={`/records/${record.id}/edit`} className="btn btn-primary min-h-[44px] flex-1">
            <Pencil className="h-4 w-4" />
            Edit record
          </Link>
          <button type="button" className="btn btn-secondary min-h-[44px] flex-1" onClick={() => onArchive(record)}>
            {record.archivedAt ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            {record.archivedAt ? 'Restore' : 'Archive'}
          </button>
          <button
            type="button"
            className="btn btn-ghost min-h-[44px] w-full text-danger-text hover:bg-danger-soft hover:text-danger-text"
            onClick={() => onDelete(record)}
          >
            <Trash2 className="h-4 w-4" />
            Delete permanently
          </button>
        </div>
      )}
    </aside>
  );
};

export const Records: React.FC = () => {
  const { user } = useAuth();
  const { users, enabled: isSuperAdmin } = useUsers();
  const navigate = useNavigate();
  const { records, loading, error, setArchived, deleteRecord } = useFormRecords();
  const [search, setSearch] = useState('');
  const [ministry, setMinistry] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<FormRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const canManage = user?.role === 'admin' || user?.role === 'super_admin';
  const pendingCount = isSuperAdmin ? users.filter(u => u.status === 'pending').length : 0;

  const activeCount = records.filter(r => !r.archivedAt).length;
  const archivedCount = records.length - activeCount;

  // The shared list, plus any older values still on records.
  const ministryOptions = useMemo(() => {
    const extra = records.map(r => r.ministry).filter(m => m && !MINISTRIES.includes(m));
    return [...MINISTRIES, ...new Set(extra)];
  }, [records]);

  const term = search.trim().toLowerCase();
  const visible = records.filter(
    r =>
      (showArchived || !r.archivedAt) &&
      (!ministry || r.ministry === ministry) &&
      [r.firstName, r.lastName, r.otherNames, r.phone, r.email, r.ministry, `${r.firstName} ${r.lastName}`].some(v =>
        v.toLowerCase().includes(term),
      ),
  );
  const selected = records.find(r => r.id === selectedId) ?? null;

  const handleArchive = async (record: FormRecord) => {
    setActionError(null);
    try {
      await setArchived(record.id, !record.archivedAt);
      if (!showArchived && !record.archivedAt) setSelectedId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update record');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deleteRecord(toDelete.id);
      if (selectedId === toDelete.id) setSelectedId(null);
      setToDelete(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete record');
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const rowMenu = (record: FormRecord): MenuItem[] => [
    { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onSelect: () => navigate(`/records/${record.id}/edit`) },
    {
      label: record.archivedAt ? 'Restore' : 'Archive',
      icon: record.archivedAt ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />,
      onSelect: () => handleArchive(record),
    },
    { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => setToDelete(record) },
  ];

  const filtersActive = Boolean(term || ministry);

  return (
    <>
      {pendingCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-accent-line bg-accent-soft px-4 py-3">
          <Clock className="h-[18px] w-[18px] text-accent" />
          <span>
            <strong>{pendingCount === 1 ? '1 sign-up is' : `${pendingCount} sign-ups are`}</strong> waiting for your approval.
          </span>
          <Link to="/users" className="ml-auto flex items-center gap-1 font-semibold text-accent-text hover:underline">
            Review sign-ups <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <PageHeader
        title="Records"
        subtitle={`${activeCount} ${activeCount === 1 ? 'person' : 'people'} · ${archivedCount} archived`}
        actions={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => exportRecordsCsv(visible)}
              disabled={visible.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <Link to="/records/new" className="btn btn-primary">
              <Plus className="h-4 w-4" />
              Add record
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-[42px] flex-[1_1_320px] items-center gap-2.5 rounded-lg border border-line bg-surface px-3 text-ink-subtle focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30">
          <Search className="h-[18px] w-[18px]" />
          <span className="sr-only">Search records</span>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone, email or ministry"
            className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-subtle"
          />
        </label>
        <label className="flex-[1_1_200px] sm:flex-none">
          <span className="sr-only">Filter by ministry</span>
          <select value={ministry} onChange={e => setMinistry(e.target.value)} className="field-input min-h-[42px] border-line sm:w-56">
            <option value="">All ministries</option>
            {ministryOptions.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={showArchived}
          onClick={() => setShowArchived(v => !v)}
          className="flex min-h-[42px] items-center gap-2.5 px-1 text-ink-muted"
        >
          <span className={`relative h-5 w-9 rounded-full transition-colors ${showArchived ? 'bg-primary' : 'bg-line-strong/60'}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${showArchived ? 'left-[18px]' : 'left-0.5'}`} />
          </span>
          Show archived ({archivedCount})
        </button>
      </div>

      {(error || actionError) && <Alert>{actionError || error}</Alert>}

      <div className="flex items-start gap-5">
        <section aria-label="Records list" className="card min-w-0 flex-1 overflow-hidden">
          {loading ? (
            <LoadingBlock label="Loading records…" />
          ) : visible.length === 0 ? (
            <EmptyState icon={<UsersIcon className="h-5 w-5" />} title={filtersActive ? 'No matching records' : 'No records yet'}>
              {filtersActive ? (
                'Try a different search or ministry.'
              ) : (
                <>
                  Share the public form at <span className="font-medium text-ink">/collect</span>, or{' '}
                  <Link to="/records/new" className="font-semibold text-primary-text hover:underline">add a record</Link> yourself.
                </>
              )}
            </EmptyState>
          ) : (
            <>
              {/* Tablets and up: a table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] border-collapse">
                  <thead>
                    <tr className="bg-surface-muted text-left text-xs font-semibold text-ink-muted">
                      <th scope="col" className="border-b border-line px-4 py-2.5">Name</th>
                      <th scope="col" className="border-b border-line px-4 py-2.5">Date of birth</th>
                      <th scope="col" className="border-b border-line px-4 py-2.5">Phone</th>
                      <th scope="col" className="border-b border-line px-4 py-2.5">Ministry</th>
                      <th scope="col" className="border-b border-line px-4 py-2.5">Added</th>
                      {canManage && (
                        <th scope="col" className="w-14 border-b border-line px-4 py-2.5">
                          <span className="sr-only">Actions</span>
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(record => {
                      const on = record.id === selectedId;
                      return (
                        <tr
                          key={record.id}
                          className={`${on ? 'bg-primary-soft shadow-[inset_3px_0_0_rgb(var(--primary))]' : 'hover:bg-surface-muted'} ${
                            record.archivedAt ? 'text-ink-muted' : ''
                          }`}
                        >
                          <td className="border-b border-line px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar name={fullName(record)} picture={record.picture} />
                              <div className="flex min-w-0 flex-col items-start">
                                <button
                                  type="button"
                                  onClick={() => setSelectedId(on ? null : record.id)}
                                  aria-pressed={on}
                                  className="text-left font-semibold text-ink hover:text-primary-text hover:underline"
                                >
                                  {fullName(record)}
                                </button>
                                <span className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                                  {summary(record)}
                                  <MinorChip record={record} />
                                  <ArchivedChip record={record} />
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap border-b border-line px-4 py-3">{formatDate(record.dateOfBirth)}</td>
                          <td className="whitespace-nowrap border-b border-line px-4 py-3">{record.phone || <span className="text-ink-subtle">—</span>}</td>
                          <td className="border-b border-line px-4 py-3">
                            {record.ministry ? <span className="chip">{record.ministry}</span> : <span className="text-ink-subtle">—</span>}
                          </td>
                          <td className="whitespace-nowrap border-b border-line px-4 py-3 text-ink-muted">{formatDate(record.createdAt)}</td>
                          {canManage && (
                            <td className="border-b border-line px-3 py-2 text-right">
                              <Menu
                                label={`Actions for ${fullName(record)}`}
                                trigger={<MoreHorizontal className="h-[18px] w-[18px]" />}
                                items={rowMenu(record)}
                              />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phones: a list of cards */}
              <ul className="divide-y divide-line md:hidden">
                {visible.map(record => (
                  <li key={record.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(record.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-muted"
                    >
                      <Avatar name={fullName(record)} picture={record.picture} size="md" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex flex-wrap items-center gap-1.5 font-semibold">
                          {fullName(record)}
                          <MinorChip record={record} />
                          <ArchivedChip record={record} />
                        </span>
                        <span className="truncate text-[13px] text-ink-muted">
                          {[record.ministry, record.phone].filter(Boolean).join(' · ') || summary(record)}
                        </span>
                      </span>
                      <ChevronRight className="h-[18px] w-[18px] text-ink-subtle" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {selected && (
          <RecordDetails
            record={selected}
            canManage={canManage}
            onClose={() => setSelectedId(null)}
            onArchive={handleArchive}
            onDelete={setToDelete}
          />
        )}
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        title={`Delete ${toDelete ? fullName(toDelete) : 'this record'}?`}
        confirmLabel="Delete permanently"
        danger
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      >
        This removes the record for good. To hide it but keep it, archive it instead.
      </ConfirmDialog>
    </>
  );
};
