import { formatCurrency } from 'src/sections/fee/fee-format';

// Registration state is derived by the API from the fee's payments: paid, waived,
// pending_payment or cancelled.
export const RESIT_STATES = [
  { value: 'paid', label: 'Paid', color: 'success' },
  { value: 'pending_payment', label: 'Awaiting payment', color: 'warning' },
  { value: 'waived', label: 'Waived', color: 'info' },
  { value: 'cancelled', label: 'Cancelled', color: 'default' },
];

export const resitState = (value) =>
  RESIT_STATES.find((state) => state.value === value) || {
    value,
    label: value || '—',
    color: 'default',
  };

export const SEMESTER_OPTIONS = ['First Semester', 'Second Semester'];

/** A price that may be unset (null). */
export const formatPrice = (value) =>
  value === null || value === undefined ? '—' : formatCurrency(value);

export const studentLabel = (student) => {
  if (!student || typeof student !== 'object') return '—';
  return [student.name, student.regNumber && `(${student.regNumber})`].filter(Boolean).join(' ');
};
