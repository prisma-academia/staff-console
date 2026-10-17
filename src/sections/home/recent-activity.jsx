import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ButtonBase from '@mui/material/ButtonBase';

import { RouterLink } from 'src/routes/components';

import { fToNow, fDateTime } from 'src/utils/format-time';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import Panel from 'src/sections/dashboard/components/panel';

// ----------------------------------------------------------------------

const VERBS = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  view: 'Viewed',
  bulk_create: 'Bulk created',
  bulk_update: 'Bulk updated',
  bulk_delete: 'Bulk deleted',
  approve: 'Approved',
  publish: 'Published',
  reopen: 'Reopened',
  regrade: 'Regraded',
  export: 'Exported',
};

const NOUNS = { ScoreEntry: 'scores', ClassLevel: 'class level', UserGroup: 'user group', GradingScheme: 'grading scheme' };

const DOT = {
  create: 'success.main',
  bulk_create: 'success.main',
  publish: 'success.main',
  approve: 'info.main',
  delete: 'error.main',
  bulk_delete: 'error.main',
  reopen: 'warning.main',
};

const humanize = (s) => String(s || '').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

const noun = (entityType) =>
  NOUNS[entityType] || String(entityType || 'record').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

export const describeAudit = (row) => `${VERBS[row.actionType] || humanize(row.actionType)} ${noun(row.entityType)}`;

function TimelineRow({ row, last, linkable }) {
  const failed = row.status && row.status !== 'success';
  const content = (
    <Stack direction="row" spacing={1.5} sx={{ width: 1, textAlign: 'left' }}>
      <Stack alignItems="center" sx={{ pt: 0.75, flexShrink: 0 }}>
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: failed ? 'error.main' : DOT[row.actionType] || 'grey.500',
            boxShadow: (theme) => `0 0 0 3px ${theme.palette.background.paper}`,
          }}
        />
        {!last && <Box sx={{ width: '1px', flexGrow: 1, mt: 0.5, bgcolor: 'divider' }} />}
      </Stack>
      <Box sx={{ minWidth: 0, flexGrow: 1, pb: last ? 0 : 1.75 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" fontWeight={600} noWrap sx={{ minWidth: 0 }}>
            {describeAudit(row)}
          </Typography>
          {failed && <Label color="error">Failed</Label>}
        </Stack>
        <Tooltip title={row.timestamp ? fDateTime(row.timestamp) : ''} placement="bottom-start">
          <Typography variant="caption" color="text.secondary" component="div" sx={{ width: 'fit-content' }}>
            {row.timestamp ? fToNow(row.timestamp) : '—'}
          </Typography>
        </Tooltip>
      </Box>
    </Stack>
  );

  if (!linkable) return content;
  return (
    <ButtonBase
      component={RouterLink}
      href={`/audit/${row._id}`}
      sx={{
        display: 'flex',
        mx: -1,
        px: 1,
        borderRadius: 1,
        '&:hover': { bgcolor: 'action.hover' },
        '&:focus-visible': { outline: (theme) => `2px solid ${theme.palette.primary.main}` },
      }}
    >
      {content}
    </ButtonBase>
  );
}

TimelineRow.propTypes = { row: PropTypes.object.isRequired, last: PropTypes.bool, linkable: PropTypes.bool };

/** The user's own last actions as a compact timeline. */
export default function RecentActivity({ logs, loading, canViewAudit }) {
  return (
    <Panel
      title="My recent activity"
      loading={loading}
      height={200}
      empty={!logs.length}
      emptyText="Actions you take in the console will be listed here"
      action={
        canViewAudit ? (
          <Button
            size="small"
            color="inherit"
            component={RouterLink}
            href="/audit"
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
            sx={{ flexShrink: 0 }}
          >
            View all
          </Button>
        ) : null
      }
    >
      <Box>
        {logs.map((row, i) => (
          <TimelineRow key={row._id} row={row} last={i === logs.length - 1} linkable={canViewAudit} />
        ))}
      </Box>
    </Panel>
  );
}

RecentActivity.propTypes = {
  logs: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  canViewAudit: PropTypes.bool,
};
