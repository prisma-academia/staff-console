import { PERMISSIONS } from 'src/permissions/constants';

// Above this many students, even a reversible action demands a typed
// confirmation — a mis-click that moves 400 students is a bad afternoon.
export const TYPED_CONFIRMATION_THRESHOLD = 25;

// Each bulk action describes how it is labelled, what it needs from the user,
// which permission gates it, and how hard it is to confirm.
// `confirmWord` is what the operator must type verbatim before the action arms.
export const ACTIONS = {
  moveClass: {
    label: 'Move to another class',
    icon: 'eva:swap-fill',
    permission: PERMISSIONS.EDIT_STUDENT,
    field: 'class',
    confirmLabel: 'Move students',
    confirmWord: 'MOVE',
    summary: 'move',
  },
  moveProgramme: {
    label: 'Move to another programme',
    icon: 'eva:shuffle-2-fill',
    permission: PERMISSIONS.EDIT_STUDENT,
    field: 'programme',
    confirmLabel: 'Move students',
    confirmWord: 'MOVE',
    summary: 'move',
  },
  activate: {
    label: 'Activate students',
    icon: 'eva:checkmark-circle-2-fill',
    permission: PERMISSIONS.EDIT_STUDENT,
    field: null,
    confirmLabel: 'Activate',
    confirmWord: 'ACTIVATE',
    summary: 'activate',
  },
  disable: {
    label: 'Disable students',
    icon: 'eva:slash-fill',
    permission: PERMISSIONS.EDIT_STUDENT,
    field: null,
    confirmLabel: 'Disable',
    confirmWord: 'DISABLE',
    summary: 'disable',
  },
  export: {
    label: 'Export to CSV / Excel',
    icon: 'eva:download-fill',
    permission: PERMISSIONS.VIEW_STUDENT,
    field: 'format',
    confirmLabel: 'Export',
    // Read-only, so no typed confirmation regardless of how many are selected.
    confirmWord: null,
    alwaysSkipTypedConfirmation: true,
    summary: 'export',
  },
  delete: {
    label: 'Delete students',
    icon: 'eva:trash-2-fill',
    permission: PERMISSIONS.DELETE_STUDENT,
    field: null,
    confirmLabel: 'Delete',
    confirmWord: 'DELETE',
    summary: 'permanently delete',
    destructive: true,
  },
};

// Destructive actions always demand the typed word; reversible ones only once
// the selection is large enough to hurt.
export const needsTypedConfirmation = (actionKey, selectedCount) => {
  const action = ACTIONS[actionKey];
  if (!action || action.alwaysSkipTypedConfirmation) return false;
  return Boolean(action.destructive) || selectedCount >= TYPED_CONFIRMATION_THRESHOLD;
};
