import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import config from 'src/config';

// Academic session the console is scoped to. null = not chosen yet (defaults to the current
// session on first load), '' = all sessions.
export const useSessionStore = create(
  persist(
    (set) => ({
      sessionId: null,
      setSessionId: (sessionId) => set({ sessionId }),
    }),
    {
      name: `${config.storagePrefix}-session`,
    }
  )
);
