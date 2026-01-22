import PropTypes from 'prop-types';
import React, { useRef, useEffect } from 'react';

import { usePermissions, showPermissionError } from 'src/utils/permissions';

/**
 * Component to conditionally render children based on user permissions
 * 
 * Usage:
 * <Can do="add_student">
 *   <button>Add Student</button>
 * </Can>
 * 
 * <Can anyOf={['edit_user', 'delete_user']}>
 *   <button>Manage User</button>
 * </Can>
 * 
 * <Can do="edit_user" showErrorOnDenied>
 *   <button>Edit User</button>
 * </Can>
 */
export default function Can({ 
  do: action, 
  anyOf, 
  allOf, 
  children, 
  fallback = null,
  showErrorOnDenied = false,
  errorTitle,
  errorMessage,
}) {
  const { check, checkAny, checkAll } = usePermissions();
  const hasShownError = useRef(false);

  let hasAccess = false;
  let requiredPermission = null;

  if (action) {
    hasAccess = check(action);
    requiredPermission = action;
  } else if (anyOf) {
    hasAccess = checkAny(anyOf);
    requiredPermission = anyOf.join(' or ');
  } else if (allOf) {
    hasAccess = checkAll(allOf);
    requiredPermission = allOf.join(' and ');
  }

  useEffect(() => {
    if (!hasAccess && showErrorOnDenied && !hasShownError.current) {
      hasShownError.current = true;
      showPermissionError({
        title: errorTitle,
        message: errorMessage,
        permission: requiredPermission,
      });
    }
  }, [hasAccess, showErrorOnDenied, errorTitle, errorMessage, requiredPermission]);

  if (!hasAccess) {
    // Reset error flag when access changes
    if (hasShownError.current) {
      hasShownError.current = false;
    }
    return fallback;
  }

  return <>{children}</>;
}

Can.propTypes = {
  children: PropTypes.node,
  do: PropTypes.string,
  anyOf: PropTypes.arrayOf(PropTypes.string),
  allOf: PropTypes.arrayOf(PropTypes.string),
  fallback: PropTypes.node,
  showErrorOnDenied: PropTypes.bool,
  errorTitle: PropTypes.string,
  errorMessage: PropTypes.string,
};

