import { useSnackbar } from 'notistack';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { SessionApi } from 'src/api';
import { useSessionStore } from 'src/store/session-store';

import SwitchSessionDialog from './switch-session-dialog';

// ----------------------------------------------------------------------

/**
 * Everything the sessions page needs to change the current session:
 * - `current`: the current session, or null when none is set
 * - `confirmSwitch(target, action)`: opens the confirm dialog; `action` runs on confirm (may return a promise)
 * - `setCurrent(session)`: confirm, then make `session` current
 * - `followSwitch(nextId)`: call after any request that changed the current session
 * - `dialog`: render once
 */
export default function useSwitchSession() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const headerSessionId = useSessionStore((state) => state.sessionId);
  const setHeaderSessionId = useSessionStore((state) => state.setSessionId);

  // Same key and fetcher as useActiveSession; a 404 (no current session) leaves data empty.
  const { data } = useQuery({
    queryKey: ['session', 'current'],
    queryFn: SessionApi.getCurrentSession,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const current = data?._id ? data : null;

  const [pending, setPending] = useState(null);

  const followSwitch = useCallback(
    (nextId) => {
      // A header scoped to the old current session moves along with it.
      if (current?._id && headerSessionId === current._id && nextId) setHeaderSessionId(nextId);
      // Much of what the api computes defaults to the current session, so refresh everything.
      queryClient.invalidateQueries();
    },
    [current, headerSessionId, setHeaderSessionId, queryClient]
  );

  const { mutateAsync } = useMutation({
    mutationFn: (session) => SessionApi.setCurrentSession(session._id),
    onSuccess: (_data, session) => {
      followSwitch(session._id);
      enqueueSnackbar(`${session.name} is now the current session`, { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to switch the current session', {
        variant: 'error',
      });
    },
  });

  const confirmSwitch = useCallback((target, action) => setPending({ target, action }), []);

  const setCurrent = useCallback(
    (session) => confirmSwitch(session, () => mutateAsync(session)),
    [confirmSwitch, mutateAsync]
  );

  const dialog = (
    <SwitchSessionDialog
      open={Boolean(pending)}
      target={pending?.target}
      current={current}
      onConfirm={() => pending?.action()}
      onClose={() => setPending(null)}
    />
  );

  return { current, confirmSwitch, setCurrent, followSwitch, dialog };
}
