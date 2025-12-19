import React from 'react';
import PropTypes from 'prop-types';

import { usePermissions } from 'src/utils/permissions';

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
 */
export default function Can({ do: action, anyOf, allOf, children, fallback = null }) {
  const { check, checkAny, checkAll } = usePermissions();

  let hasAccess = false;

  if (action) {
    hasAccess = check(action);
  } else if (anyOf) {
    hasAccess = checkAny(anyOf);
  } else if (allOf) {
    hasAccess = checkAll(allOf);
  }

  if (!hasAccess) {
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
};

