import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import {
  Box,
  Chip,
  Stack,
  Alert,
  Button,
  Drawer,
  Divider,
  Tooltip,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  LinearProgress,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';
import { fToNow, fDateTime } from 'src/utils/format-time';

import { ResultApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';

const PAGE_SIZE = 20;

const FILTERS = [
  { value: '', label: 'All activity' },
  { value: 'scores', label: 'Scores saved' },
  { value: 'compute', label: 'Drafts computed' },
  { value: 'override', label: 'Scores overridden' },
  { value: 'delete', label: 'Drafts deleted' },
  { value: 'approve', label: 'Approved' },
  { value: 'publish', label: 'Published' },
  { value: 'reopen', label: 'Reopened' },
  { value: 'export', label: 'Exported' },
];

/** What an audit row means on the broadsheet: label, colour and icon. */
function describe(row) {
  const source = row.metadata?.source;
  if (row.entityType === 'ScoreEntry') return { label: 'Scores saved', color: 'default', icon: 'mdi:table-edit' };
  if (row.actionType === 'bulk_create' && source === 'override') return { label: 'Score overridden', color: 'info', icon: 'eva:edit-2-outline' };
  if (row.actionType === 'bulk_create') return { label: 'Drafts computed', color: 'primary', icon: 'mdi:calculator-variant-outline' };
  return (
    {
      approve: { label: 'Approved', color: 'info', icon: 'eva:checkmark-circle-2-outline' },
      publish: { label: 'Published', color: 'success', icon: 'eva:globe-2-outline' },
      reopen: { label: 'Reopened', color: 'warning', icon: 'eva:unlock-outline' },
      bulk_delete: { label: 'Drafts deleted', color: 'error', icon: 'eva:trash-2-outline' },
      delete: { label: 'Result deleted', color: 'error', icon: 'eva:trash-2-outline' },
      export: { label: 'Exported', color: 'default', icon: 'eva:download-outline' },
      update: { label: 'Result edited', color: 'info', icon: 'eva:edit-outline' },
      create: { label: 'Result added', color: 'success', icon: 'eva:plus-outline' },
    }[row.actionType] || { label: row.actionType, color: 'default', icon: 'eva:activity-outline' }
  );
}

/** "12 results · MTH101, PHY102 · 3 held back" */
function scopeLine(row) {
  const m = row.metadata || {};
  const parts = [];
  if (m.count != null) parts.push(`${m.count} ${row.entityType === 'ScoreEntry' ? 'score' : 'result'}${m.count === 1 ? '' : 's'}`);
  const codes = m.courseCodes || [];
  if (codes.length) parts.push(codes.length > 4 ? `${codes.slice(0, 4).join(', ')} +${codes.length - 4}` : codes.join(', '));
  if (m.studentIds?.length) parts.push(`${m.studentIds.length} student${m.studentIds.length === 1 ? '' : 's'} selected`);
  const held = (m.heldBack?.incomplete || 0) + (m.heldBack?.stale || 0);
  if (held) parts.push(`${held} held back`);
  if (m.approveDrafts) parts.push('drafts approved too');
  if (m.format) parts.push(String(m.format).toUpperCase());
  return parts.join(' · ');
}

function actorName(actor) {
  if (actor && typeof actor === 'object') return `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || actor.email || 'Someone';
  return 'Someone';
}

/**
 * Who did what on this broadsheet: score-sheet saves, computes, overrides,
 * approvals, publishing, reopening, deletions and exports, newest first.
 */
export default function ResultActivityDrawer({ open, onClose, programId, classId, sessionId, semester, title }) {
  const navigate = useNavigate();
  const { check } = usePermissions();
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['result-activity', programId, classId, sessionId, semester, action, page],
    queryFn: () => ResultApi.getActivity({ programId, classId, sessionId, semester, action, page, limit: PAGE_SIZE }),
    enabled: open && Boolean(programId && classId && sessionId),
    placeholderData: keepPreviousData,
  });
  const rows = query.data?.data || [];
  const total = query.data?.pagination?.total || 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 440 } } }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2.5, py: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6">Activity</Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {title}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close activity">
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </Stack>
      <Box sx={{ px: 2.5, pb: 1.5 }}>
        <TextField
          select
          size="small"
          fullWidth
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        >
          {FILTERS.map((f) => (
            <MenuItem key={f.value} value={f.value}>
              {f.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <Divider />
      {query.isFetching && <LinearProgress sx={{ height: 2 }} />}

      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
        {query.isError && <Alert severity="warning">{query.error?.message || 'Could not load the activity log'}</Alert>}
        {!query.isLoading && !query.isError && !rows.length && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Iconify icon="eva:activity-outline" width={36} sx={{ color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {action ? 'Nothing of this kind yet for this class.' : 'No activity recorded for this class yet.'}
            </Typography>
          </Box>
        )}
        {rows.map((row, index) => {
          const kind = describe(row);
          const failed = row.status === 'failure';
          const reason = row.metadata?.reason;
          const scope = scopeLine(row);
          return (
            <Stack key={row._id} direction="row" spacing={1.5} sx={{ position: 'relative', pb: 2.5 }}>
              {/* Timeline rail */}
              {index < rows.length - 1 && (
                <Box sx={{ position: 'absolute', left: 15, top: 34, bottom: 0, width: '1px', bgcolor: 'divider' }} />
              )}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: failed ? 'error.lighter' : 'grey.100',
                  color: failed ? 'error.main' : `${kind.color === 'default' ? 'text' : kind.color}.${kind.color === 'default' ? 'secondary' : 'main'}`,
                }}
              >
                <Iconify icon={failed ? 'eva:alert-triangle-outline' : kind.icon} width={18} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="subtitle2">{actorName(row.actor)}</Typography>
                  <Chip size="small" label={failed ? `${kind.label} — failed` : kind.label} color={failed ? 'error' : kind.color} variant="outlined" sx={{ height: 20 }} />
                </Stack>
                {scope && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {scope}
                  </Typography>
                )}
                {failed && row.metadata?.error && (
                  <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.25 }}>
                    {row.metadata.error}
                  </Typography>
                )}
                {reason && (
                  <Box sx={{ mt: 0.75, pl: 1.25, borderLeft: 2, borderColor: 'warning.main' }}>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                      “{reason}”
                    </Typography>
                  </Box>
                )}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Tooltip title={fDateTime(row.timestamp)}>
                    <Typography variant="caption" color="text.disabled">
                      {fToNow(row.timestamp)}
                    </Typography>
                  </Tooltip>
                  {check(PERMISSIONS.VIEW_AUDIT) && (
                    <Button size="small" color="inherit" sx={{ minWidth: 0, px: 0.75, typography: 'caption' }} onClick={() => navigate(`/audit/${row._id}`)}>
                      Details
                    </Button>
                  )}
                </Stack>
              </Box>
            </Stack>
          );
        })}
      </Box>

      {pages > 1 && (
        <>
          <Divider />
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.5 }}>
            <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} startIcon={<Iconify icon="eva:arrow-back-fill" />}>
              Newer
            </Button>
            <Typography variant="caption" color="text.secondary">
              Page {page} of {pages} · {total} entries
            </Typography>
            <Button size="small" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} endIcon={<Iconify icon="eva:arrow-forward-fill" />}>
              Older
            </Button>
          </Stack>
        </>
      )}
    </Drawer>
  );
}

ResultActivityDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  programId: PropTypes.string,
  classId: PropTypes.string,
  sessionId: PropTypes.string,
  semester: PropTypes.string,
  title: PropTypes.string,
};
