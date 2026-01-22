import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import config from './config';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      permissions: [],
      logIn: ({ user, token, refreshToken }) => {
        const permissions = Array.isArray(user?.permission)
          ? user.permission.map((p) => (typeof p === 'string' ? p : p.action))
          : [];
        set({
          user,
          token,
          refreshToken,
          permissions,
        });
      },
      logOut: () => set({ user: null, token: null, refreshToken: null, permissions: [] }),
      setToken: (token) => set({ token }),
    }),
    {
      name: config.storagePrefix,
    }
  )
);
