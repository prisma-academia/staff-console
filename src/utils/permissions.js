import { useMemo } from 'react';

import { useAuthStore } from 'src/store';

const getPermissions = (state) => {
  if (state.permissions && state.permissions.length > 0) return state.permissions;
  if (Array.isArray(state.user?.permissions)) {
    return state.user.permissions.map((p) => (typeof p === 'string' ? p : p.action));
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
    if (Array.isArray(user?.permissions)) {
      return user.permissions.map((p) => (typeof p === 'string' ? p : p.action));
    }
    return [];
  }, [permissionsState, user]);

  const isAdmin = user?.role === 'admin';

  const check = (permission) => isAdmin || permissions.includes(permission);
  const checkAny = (arr) => isAdmin || arr.some((p) => permissions.includes(p));
  const checkAll = (arr) => isAdmin || arr.every((p) => permissions.includes(p));

  return { permissions, check, checkAny, checkAll, isAdmin };
};

