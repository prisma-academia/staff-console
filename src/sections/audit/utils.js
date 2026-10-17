export const visuallyHidden = {
  border: 0,
  margin: -1,
  padding: 0,
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  clip: 'rect(0 0 0 0)',
};

export const ENTITY_TYPES = [
  'User',
  'UserGroup',
  'Student',
  'Fee',
  'Memo',
  'Program',
  'Course',
  'Payment',
  'Calendar',
  'Document',
  'Result',
  'Accommodation',
  'ClassLevel',
  'Mail',
  'Settings',
  'Audit',
  'Template',
  'Assessment',
  'ScoreEntry',
  'GradingScheme',
];

export const ACTION_TYPES = [
  'create', 'update', 'delete', 'view',
  'bulk_create', 'bulk_update', 'bulk_delete',
  'approve', 'publish', 'reopen', 'regrade', 'export',
];

/** Chip colour of each action type. */
export const ACTION_COLORS = {
  create: 'success',
  update: 'info',
  delete: 'error',
  view: 'default',
  bulk_create: 'success',
  bulk_update: 'info',
  bulk_delete: 'error',
  approve: 'info',
  publish: 'success',
  reopen: 'warning',
  regrade: 'secondary',
  export: 'default',
};

export const STATUS_TYPES = ['success', 'failure'];

export const ACTOR_TYPES = ['user', 'student'];

export function emptyRows(page, rowsPerPage, arrayLength) {
  return page ? Math.max(0, (1 + page) * rowsPerPage - arrayLength) : 0;
}

function descendingComparator(a, b, orderBy) {
  // Handle nested properties (e.g., actor.firstName)
  const getValue = (obj, path) => path.split('.').reduce((current, prop) => current?.[prop], obj);

  const aValue = getValue(a, orderBy);
  const bValue = getValue(b, orderBy);

  if (aValue === null || aValue === undefined) {
    return 1;
  }
  if (bValue === null || bValue === undefined) {
    return -1;
  }
  if (bValue < aValue) {
    return -1;
  }
  if (bValue > aValue) {
    return 1;
  }
  return 0;
}

export function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export function applyFilter({ inputData, comparator, filterName, filters = {} }) {
  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (filterName) {
    inputData = inputData.filter((log) => {
      const searchText = filterName.toLowerCase();
      return (
        log.entityType?.toLowerCase().includes(searchText) ||
        log.entityId?.toString().toLowerCase().includes(searchText) ||
        log.actionType?.toLowerCase().includes(searchText) ||
        (typeof log.actor === 'object' && log.actor
          ? `${log.actor.firstName || ''} ${log.actor.lastName || ''} ${log.actor.email || ''}`.toLowerCase().includes(searchText)
          : log.actor?.toString().toLowerCase().includes(searchText))
      );
    });
  }

  // Apply additional filters
  if (filters.entityType) {
    inputData = inputData.filter((log) => log.entityType === filters.entityType);
  }
  if (filters.actionType) {
    inputData = inputData.filter((log) => log.actionType === filters.actionType);
  }
  if (filters.status) {
    inputData = inputData.filter((log) => log.status === filters.status);
  }
  if (filters.actorId) {
    inputData = inputData.filter((log) => {
      const actorId = typeof log.actor === 'object' ? log.actor._id : log.actor;
      return actorId === filters.actorId;
    });
  }

  return inputData;
}

export function formatActionType(actionType) {
  if (!actionType) return '';
  return actionType.charAt(0).toUpperCase() + actionType.slice(1);
}

export function formatActor(actor) {
  if (!actor) return 'Unknown';
  if (typeof actor === 'object' && actor.firstName) {
    return `${actor.firstName} ${actor.lastName || ''}`.trim() || actor.email || 'Unknown';
  }
  return actor.toString();
}

// Placeholder ObjectId used for failed operations where no entity was created
const FAILED_OPERATION_PLACEHOLDER_ID = '000000000000000000000000';

/**
 * Checks if an entityId is the placeholder used when a row has no single record:
 * a failed operation, or a bulk action (approve / publish / compute ...) over many records.
 * @param {string|ObjectId} entityId - The entity ID to check
 * @returns {boolean} True if the entityId is the placeholder
 */
export function isFailedOperation(entityId) {
  if (!entityId) return false;
  const idString = entityId.toString();
  return idString === FAILED_OPERATION_PLACEHOLDER_ID;
}

/**
 * The chip shown instead of an entity id for placeholder rows: failures say so,
 * successful bulk actions are labelled as such. Null for a real record.
 */
export function placeholderChip(entityId, status) {
  if (!isFailedOperation(entityId)) return null;
  return status === 'failure' ? { label: 'Failed Operation', color: 'warning' } : { label: 'Bulk action', color: 'default' };
}

/**
 * Formats an entityId for display, handling failed operations
 * @param {string|ObjectId} entityId - The entity ID to format
 * @returns {string} Formatted entity ID or "Failed Operation" for placeholder IDs
 */
export function formatEntityId(entityId) {
  if (!entityId) return 'N/A';
  if (isFailedOperation(entityId)) {
    return 'No single record (bulk or failed action)';
  }
  return entityId.toString();
}
