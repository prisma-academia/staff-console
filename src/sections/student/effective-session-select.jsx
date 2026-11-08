import { useMemo } from 'react';
import PropTypes from 'prop-types';

import { MenuItem, TextField } from '@mui/material';

import useActiveSession from 'src/hooks/use-active-session';

// ----------------------------------------------------------------------

const startTime = (session) => new Date(session?.startDate || 0).getTime();

const sessionName = (session) => session?.name || session?.code || '';

/**
 * Sessions a programme / class level change may take effect in: the current session and the
 * ones that start after it (the API refuses earlier ones). Returns { current, options }.
 */
export function useEffectiveSessions() {
  const { sessions } = useActiveSession();
  return useMemo(() => {
    const current = sessions.find((s) => s.isCurrent) || null;
    if (!current) return { current: null, options: [] };
    const later = sessions
      .filter((s) => s._id !== current._id && startTime(s) > startTime(current))
      .sort((a, b) => startTime(a) - startTime(b));
    return { current, options: [current, ...later] };
  }, [sessions]);
}

/**
 * "Takes effect in" picker for moves. `value` '' means the current session (the default);
 * picking a later session records an early promotion. Renders nothing without a current session.
 */
export default function EffectiveSessionSelect({
  value,
  onChange,
  size = 'medium',
  disabled = false,
}) {
  const { current, options } = useEffectiveSessions();
  if (!current) return null;

  const selected = options.find((s) => s._id === value) || current;
  const helperText =
    selected._id === current._id
      ? "Picking next session records an early promotion, so this session's fees and results keep the old class."
      : `Early promotion: ${sessionName(current)} keeps the old class for its fees and results; the new placement applies from ${sessionName(selected)}.`;

  return (
    <TextField
      select
      fullWidth
      size={size}
      label="Takes effect in"
      value={selected._id}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value === current._id ? '' : event.target.value)}
      helperText={helperText}
    >
      {options.map((session) => (
        <MenuItem key={session._id} value={session._id}>
          {sessionName(session)}
          {session._id === current._id ? ' (current session)' : ''}
        </MenuItem>
      ))}
    </TextField>
  );
}

EffectiveSessionSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['small', 'medium']),
  disabled: PropTypes.bool,
};
