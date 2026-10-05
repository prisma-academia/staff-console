import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

/** Priority chip: #1 is the most important figure on the page. */
export function RankBadge({ rank, sx }) {
  if (!rank) return null;
  return (
    <Box
      component="span"
      title={`Priority ${rank}`}
      sx={{
        minWidth: 26,
        height: 22,
        px: 0.75,
        borderRadius: 0.75,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        typography: 'caption',
        fontWeight: 700,
        color: rank <= 3 ? 'common.white' : 'text.secondary',
        bgcolor: rank <= 3 ? 'grey.800' : 'grey.200',
        flexShrink: 0,
        ...sx,
      }}
    >
      #{rank}
    </Box>
  );
}

RankBadge.propTypes = { rank: PropTypes.number, sx: PropTypes.object };

/** Card wrapper used by every chart and list on the dashboard. */
export default function Panel({ title, subheader, rank, action, loading, empty, emptyText, height, children, sx }) {
  let body = children;
  if (loading) {
    body = <Skeleton variant="rounded" height={height || 240} />;
  } else if (empty) {
    body = <EmptyState text={emptyText} height={height} />;
  }

  return (
    <Card sx={{ p: 2.5, height: 1, display: 'flex', flexDirection: 'column', ...sx }}>
      <Stack direction="row" alignItems="flex-start" spacing={1.5} sx={{ mb: 2 }}>
        <RankBadge rank={rank} sx={{ mt: 0.25 }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1">{title}</Typography>
          {subheader && (
            <Typography variant="body2" color="text.secondary">
              {subheader}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>{body}</Box>
    </Card>
  );
}

Panel.propTypes = {
  title: PropTypes.node,
  subheader: PropTypes.node,
  rank: PropTypes.number,
  action: PropTypes.node,
  loading: PropTypes.bool,
  empty: PropTypes.bool,
  emptyText: PropTypes.string,
  height: PropTypes.number,
  children: PropTypes.node,
  sx: PropTypes.object,
};

export function EmptyState({ text = 'No data recorded yet', height = 200 }) {
  return (
    <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ minHeight: height, color: 'text.disabled' }}>
      <Iconify icon="solar:chart-square-linear" width={36} />
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {text}
      </Typography>
    </Stack>
  );
}

EmptyState.propTypes = { text: PropTypes.string, height: PropTypes.number };

/** Section heading that groups panels by priority on the overview. */
export function SectionHeading({ rank, title, description, action }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 1 }}>
      <RankBadge rank={rank} />
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h6">{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}

SectionHeading.propTypes = {
  rank: PropTypes.number,
  title: PropTypes.node,
  description: PropTypes.node,
  action: PropTypes.node,
};
