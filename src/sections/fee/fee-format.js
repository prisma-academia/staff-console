export const formatCurrency = (value) => `₦${Number(value || 0).toLocaleString()}`;

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const sessionLabel = (session) => (session ? session.code || session.name || '' : '');

export const FEE_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Overdue', label: 'Overdue' },
];

// Resit fees are generated one per student by resit registrations; staff can't create or edit them.
export const RESIT_FEE_TYPE = 'Resit';

export const isResitFee = (fee) => fee?.feeType === RESIT_FEE_TYPE;

// Filter options (the add / edit forms keep their own list without Resit).
export const FEE_TYPE_OPTIONS = ['Tuition', 'Hostel', 'Laboratory', 'Others', RESIT_FEE_TYPE].map(
  (value) => ({ value, label: value })
);

export const SEMESTER_OPTIONS = ['First Semester', 'Second Semester'].map((value) => ({ value, label: value }));

export const feeStatusColor = (status) =>
  ({ active: 'success', pending: 'warning', overdue: 'error' })[String(status || '').toLowerCase()] || 'default';
