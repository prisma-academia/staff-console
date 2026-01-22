import { useMemo } from 'react';

import { useAuthStore } from 'src/store';
import { useErrorStore } from 'src/store/error-store';

const getPermissions = (state) => {
  if (state.permissions && state.permissions.length > 0) return state.permissions;
  if (Array.isArray(state.user?.permission)) {
    return state.user.permission.map((p) => (typeof p === 'string' ? p : p.action));
  }
  return [];
};

/**
 * Check if the user has a specific permission
 * @param {string} permission - The permission to check
 * @returns {boolean}
 */
export const hasPermission = (permission) => {
  const state = useAuthStore.getState();
  if (state.user?.role === 'admin') return true;
  const permissions = getPermissions(state);
  return permissions.includes(permission);
};

/**
 * Check if the user has any of the given permissions
 * @param {string[]} permissionsArr - Array of permissions
 * @returns {boolean}
 */
export const hasAnyPermission = (permissionsArr) => {
  const state = useAuthStore.getState();
  if (state.user?.role === 'admin') return true;
  const permissions = getPermissions(state);
  return permissionsArr.some((p) => permissions.includes(p));
};

/**
 * Check if the user has all of the given permissions
 * @param {string[]} permissionsArr - Array of permissions
 * @returns {boolean}
 */
export const hasAllPermissions = (permissionsArr) => {
  const state = useAuthStore.getState();
  if (state.user?.role === 'admin') return true;
  const permissions = getPermissions(state);
  return permissionsArr.every((p) => permissions.includes(p));
};

/**
 * Custom hook for permission-based logic in components
 */
export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);
  const permissionsState = useAuthStore((state) => state.permissions);
  
  const permissions = useMemo(() => {
    if (permissionsState && permissionsState.length > 0) return permissionsState;
    if (Array.isArray(user?.permission)) {
      return user.permission.map((p) => (typeof p === 'string' ? p : p.action));
    }
    return [];
  }, [permissionsState, user]);

  const isAdmin = user?.role === 'admin';

  const check = (permission) => isAdmin || permissions.includes(permission);
  const checkAny = (arr) => isAdmin || arr.some((p) => permissions.includes(p));
  const checkAll = (arr) => isAdmin || arr.every((p) => permissions.includes(p));

  return { permissions, check, checkAny, checkAll, isAdmin };
};

/**
 * Show a permission error modal
 * @param {Object} options - Error modal options
 * @param {string} options.title - Title of the error modal (default: 'Access Denied')
 * @param {string} options.message - Error message (default: permission-based message)
 * @param {string} options.permission - The permission that was denied (optional)
 * @param {*} options.details - Additional details to display (optional)
 */
export const showPermissionError = ({ title, message, permission, details = null }) => {
  const { showPermissionError: showError } = useErrorStore.getState();
  
  let errorMessage = message;
  if (!errorMessage && permission) {
    errorMessage = `You do not have permission to perform this action. Required permission: ${permission}`;
  } else if (!errorMessage) {
    errorMessage = 'You do not have permission to perform this action.';
  }
  
  showError({
    title: title || 'Access Denied',
    message: errorMessage,
    details,
  });
};

