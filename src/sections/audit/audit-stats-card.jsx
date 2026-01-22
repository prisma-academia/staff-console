import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function AuditStatsCard({ title, value, icon, color = 'primary', trend, trendLabel }) {
  return (
    <Card
      sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: (theme) => theme.customShadows.card,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={3}>
        <Stack spacing={1}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" color="text.primary">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
          {trend !== undefined && trend !== null && (
            <Typography
              variant="caption"
              sx={{
                color: trend >= 0 ? 'success.main' : 'error.main',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Iconify
                icon={trend >= 0 ? 'eva:trending-up-fill' : 'eva:trending-down-fill'}
                width={16}
              />
              {Math.abs(trend)}% {trendLabel}
            </Typography>
          )}
        </Stack>

        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(theme.palette[color].main, 0.16),
          }}
        >
          <Iconify
            icon={icon}
            width={32}
            sx={{ color: `${color}.main` }}
          />
        </Box>
      </Stack>
    </Card>
  );
}

AuditStatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.string.isRequired,
  color: PropTypes.string,
  trend: PropTypes.number,
  trendLabel: PropTypes.string,
};
