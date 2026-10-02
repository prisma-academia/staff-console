import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

const progressColor = (value) => {
  if (value >= 100) return 'success';
  if (value >= 50) return 'info';
  return 'warning';
};

// Collection progress bar; `value` is the server-computed percentage (made / expected).
export default function FeeProgress({ value = 0, height = 8, minWidth = 120 }) {
  const percent = Math.max(0, Number(value) || 0);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth }}>
      <LinearProgress
        variant="determinate"
        value={Math.min(percent, 100)}
        color={progressColor(percent)}
        sx={{ flexGrow: 1, height, borderRadius: height / 2 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40, textAlign: 'right' }}>
        {percent}%
      </Typography>
    </Box>
  );
}

FeeProgress.propTypes = {
  value: PropTypes.number,
  height: PropTypes.number,
  minWidth: PropTypes.number,
};
