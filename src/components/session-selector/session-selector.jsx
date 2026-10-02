import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';

import useActiveSession from 'src/hooks/use-active-session';

import Iconify from 'src/components/iconify';

// Header control for the academic session that fee and payment pages are scoped to.
export default function SessionSelector() {
  const { sessionId, sessions, setSessionId } = useActiveSession();

  return (
    <FormControl size="small" sx={{ minWidth: { xs: 96, sm: 160 }, maxWidth: { xs: 130, sm: 220 } }}>
      <Select
        value={sessionId}
        displayEmpty
        onChange={(event) => setSessionId(event.target.value)}
        inputProps={{ 'aria-label': 'Academic session' }}
        renderValue={(value) => {
          const selected = sessions.find((s) => s._id === value);
          return (
            <Typography variant="body2" noWrap component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Iconify icon="solar:calendar-linear" width={18} sx={{ flexShrink: 0, display: { xs: 'none', sm: 'block' } }} />
              {selected ? selected.code || selected.name : 'All sessions'}
            </Typography>
          );
        }}
        sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
      >
        <MenuItem value="">All sessions</MenuItem>
        {sessions.map((s) => (
          <MenuItem key={s._id} value={s._id}>
            {s.name || s.code}
            {s.isCurrent ? ' (current)' : ''}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
