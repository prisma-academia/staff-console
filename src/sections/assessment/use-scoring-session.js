import useActiveSession from 'src/hooks/use-active-session';

/**
 * Scores and results always belong to one session. This follows the session
 * picked in the header; when the header shows "All sessions" it falls back to
 * the current session (or the first one listed).
 */
export default function useScoringSession() {
  const { sessionId, sessions, setSessionId, isReady } = useActiveSession();
  const fallback = sessions.find((s) => s.isCurrent) || sessions[0] || null;
  const session = sessions.find((s) => s._id === sessionId) || fallback;

  return {
    sessionId: session?._id || '',
    session,
    sessions,
    setSessionId,
    isReady: isReady && sessions.length > 0,
  };
}
