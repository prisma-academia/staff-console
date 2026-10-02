import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { SessionApi } from 'src/api';
import { useSessionStore } from 'src/store/session-store';

const asList = (data) => (Array.isArray(data) ? data : data?.data ?? []);

/**
 * The academic session selected in the header. On first use it falls back to the
 * current session. Returns `sessionId` ('' = all sessions) plus the session list.
 */
export default function useActiveSession() {
  const storedId = useSessionStore((state) => state.sessionId);
  const setSessionId = useSessionStore((state) => state.setSessionId);

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: SessionApi.getSessions,
    staleTime: 5 * 60 * 1000,
  });
  const sessions = useMemo(() => asList(sessionsData), [sessionsData]);

  const { data: current, isLoading: currentLoading } = useQuery({
    queryKey: ['session', 'current'],
    queryFn: SessionApi.getCurrentSession,
    staleTime: 5 * 60 * 1000,
    enabled: storedId === null,
  });

  // A stored id that no longer exists (deleted session, switched tenant) falls back too.
  const storedExists = storedId === '' || sessions.some((s) => s._id === storedId);
  let sessionId = storedId;
  if (storedId === null || (!sessionsLoading && !storedExists)) {
    sessionId = current?._id || '';
  }

  const session = sessions.find((s) => s._id === sessionId) || null;

  return {
    sessionId: sessionId ?? '',
    session,
    sessions,
    setSessionId,
    isReady: storedId !== null || !currentLoading,
  };
}
