import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import LinearProgress from '@mui/material/LinearProgress';

import Iconify from 'src/components/iconify';

import { RankBadge } from './panel';

// ----------------------------------------------------------------------

// Status tones are reserved for health and always render with an icon and a word.
const TONES = {
  good: { color: 'success', icon: 'solar:check-circle-bold', word: 'On track' },
  warning: { color: 'warning', icon: 'solar:danger-triangle-bold', word: 'Watch' },
  critical: { color: 'error', icon: 'solar:danger-circle-bold', word: 'Act now' },
};

export function ToneTag({ tone, label }) {
  const t = TONES[tone];
  if (!t) return null;
  return (
    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: `${t.color}.dark` }}>
      <Iconify icon={t.icon} width={16} />
      <Typography variant="caption" fontWeight={600}>
        {label || t.word}
      </Typography>
    </Stack>
  );
}

ToneTag.propTypes = { tone: PropTypes.oneOf(['good', 'warning', 'critical']), label: PropTypes.string };

/**
 * Headline figure. `progress` (0-100) draws a meter under the value; `tone`
 * flags health; `onClick` drills into the tab that explains the number.
 */
export default function KpiCard({ rank, label, value, caption, icon, progress, tone, toneLabel, loading, onClick }) {
  const content = (
    <Stack spacing={1.25} sx={{ p: 2.5, height: 1 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <RankBadge rank={rank} />
        <Typography variant="subtitle2" color="text.secondary" noWrap sx={{ flexGrow: 1 }}>
          {label}
        </Typography>
        {icon && <Iconify icon={icon} width={22} sx={{ color: 'text.disabled', flexShrink: 0 }} />}
      </Stack>

      {loading ? (
        <Skeleton variant="text" width="60%" sx={{ fontSize: '2rem' }} />
      ) : (
        <Typography variant="h3" component="div" sx={{ lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </Typography>
      )}

      {progress != null && !loading && (
        <LinearProgress
          variant="determinate"
          value={Math.min(Math.max(progress, 0), 100)}
          color={TONES[tone]?.color || 'primary'}
          sx={{ height: 6, borderRadius: 1 }}
        />
      )}

      <Box sx={{ flexGrow: 1 }} />
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 0 }}>
          {loading ? <Skeleton width={120} /> : caption}
        </Typography>
        {!loading && <ToneTag tone={tone} label={toneLabel} />}
      </Stack>
    </Stack>
  );

  return (
    <Card sx={{ height: 1 }}>
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ height: 1, alignItems: 'stretch' }}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}

KpiCard.propTypes = {
  rank: PropTypes.number,
  label: PropTypes.node,
  value: PropTypes.node,
  caption: PropTypes.node,
  icon: PropTypes.string,
  progress: PropTypes.number,
  tone: PropTypes.oneOf(['good', 'warning', 'critical']),
  toneLabel: PropTypes.string,
  loading: PropTypes.bool,
  onClick: PropTypes.func,
};

/** Compact secondary figure for tab headers. */
export function MiniStat({ label, value, caption, loading }) {
  return (
    <Card sx={{ p: 2, height: 1 }}>
      <Typography variant="caption" color="text.secondary" component="div" noWrap>
        {label}
      </Typography>
      <Typography variant="h5" component="div" sx={{ mt: 0.5, fontVariantNumeric: 'tabular-nums' }}>
        {loading ? <Skeleton width="50%" /> : value}
      </Typography>
      {caption && (
        <Typography variant="caption" color="text.secondary" component="div">
          {loading ? <Skeleton width="70%" /> : caption}
        </Typography>
      )}
    </Card>
  );
}

MiniStat.propTypes = {
  label: PropTypes.node,
  value: PropTypes.node,
  caption: PropTypes.node,
  loading: PropTypes.bool,
};
