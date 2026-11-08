import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import {
  Card,
  Chip,
  Alert,
  Stack,
  Table,
  Divider,
  Skeleton,
  TableRow,
  useTheme,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
} from '@mui/material';

import { StudentApi } from 'src/api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

// How each row was recorded
const SOURCE_LABELS = {
  register: 'Registered',
  move: 'Bulk move',
  edit: 'Profile edit',
  'session-switch': 'Session switch',
  backfill: 'Backfilled',
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const personName = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(' ');

/** Programme and class level the student had in each session, newest session first. */
export default function EnrollmentHistoryCard({ studentId }) {
  const theme = useTheme();

  const { data, isLoading, error } = useQuery({
    queryKey: ['student-enrollments', studentId],
    queryFn: () => StudentApi.getEnrollments(studentId),
    enabled: Boolean(studentId),
  });
  const rows = Array.isArray(data) ? data : [];

  return (
    <Card sx={{ boxShadow: theme.shadows[2] }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 3, pt: 3, pb: 2 }}>
        <Iconify icon="mdi:history" color={theme.palette.primary.main} />
        <Typography variant="h6" fontWeight={600}>
          Enrollment history
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ px: 3, pb: 2, mt: -1 }}>
        Where the student was in each session. Fees and results for a session follow this placement.
      </Typography>
      <Divider />

      {error && (
        <Alert severity="error" sx={{ m: 3 }}>
          {error.message || 'Could not load the enrollment history'}
        </Alert>
      )}

      {isLoading && (
        <Stack spacing={1} sx={{ p: 3 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={32} />
          ))}
        </Stack>
      )}

      {!isLoading && !error && rows.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
          No enrollment history recorded yet. The current programme and class level apply.
        </Typography>
      )}

      {!isLoading && rows.length > 0 && (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: theme.palette.background.neutral }}>
                <TableCell>Session</TableCell>
                <TableCell>Programme</TableCell>
                <TableCell>Class level</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row._id}
                  sx={
                    row.session?.isCurrent
                      ? { bgcolor: (t) => t.palette.action.selected }
                      : undefined
                  }
                >
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={row.session?.isCurrent ? 600 : 400}>
                        {row.session?.name || row.session?.code || '—'}
                      </Typography>
                      {row.session?.isCurrent && (
                        <Chip label="Current" size="small" color="primary" variant="outlined" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{row.program?.name || '—'}</TableCell>
                  <TableCell>{row.classLevel?.name || '—'}</TableCell>
                  <TableCell>{SOURCE_LABELS[row.source] || row.source || '—'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {formatDate(row.updatedAt)}
                    </Typography>
                    {personName(row.updatedBy) && (
                      <Typography variant="caption" color="text.secondary" noWrap component="div">
                        by {personName(row.updatedBy)}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
}

EnrollmentHistoryCard.propTypes = {
  studentId: PropTypes.string,
};
