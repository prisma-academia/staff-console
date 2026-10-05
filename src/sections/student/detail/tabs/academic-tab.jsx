import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Card,
  Chip,
  Alert,
  Stack,
  Paper,
  Table,
  Divider,
  Tooltip,
  useTheme,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
} from '@mui/material';

import { classTone, formatGpa, gradeTone, RESULT_STATUS_COLORS } from 'src/utils/grading';

import { ResultApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

// ----------------------------------------------------------------------

function Stat({ label, value, color }) {
  return (
    <Box sx={{ flex: 1, minWidth: 120, p: 1.5, borderRadius: 1, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6" color={color ? `${color}.main` : 'text.primary'}>{value}</Typography>
    </Box>
  );
}

Stat.propTypes = { label: PropTypes.string, value: PropTypes.node, color: PropTypes.string };

export default function AcademicTab({ student }) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [downloading, setDownloading] = useState(false);
  const studentId = student?._id;

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['student-academic-summary', studentId],
    queryFn: () => ResultApi.getStudentSummary(studentId),
    enabled: Boolean(studentId),
  });

  const scheme = summary?.gradingScheme;
  const semesters = summary?.semesters || [];
  const outstanding = summary?.outstanding || [];

  const downloadTranscript = async () => {
    setDownloading(true);
    try {
      const blob = await ResultApi.downloadTranscript(studentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${student?.regNumber || studentId}.pdf`.replace(/[^\w.-]+/g, '-');
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      enqueueSnackbar(err?.message || 'Could not download the transcript', { variant: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card sx={{ boxShadow: theme.shadows[2] }}>
      <Stack direction="row" alignItems="center" sx={{ px: 3, py: 2 }} spacing={1}>
        <Iconify icon="mdi:school" color={theme.palette.primary.main} />
        <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
          Academic Performance
        </Typography>
        {semesters.length > 0 && (
          <Can do={PERMISSIONS.VIEW_RESULT}>
            <LoadingButton size="small" variant="outlined" loading={downloading} onClick={downloadTranscript}
              startIcon={<Iconify icon="eva:download-fill" />}>
              Transcript
            </LoadingButton>
          </Can>
        )}
      </Stack>
      <Divider />

      {isLoading && <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">Loading…</Typography></Box>}
      {error && <Alert severity="error" sx={{ m: 3 }}>{error?.data?.message || error.message}</Alert>}

      {summary && (
        <Box sx={{ p: 3, pb: 0 }}>
          {summary.schemeError && <Alert severity="warning" sx={{ mb: 2 }}>{summary.schemeError}</Alert>}
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Stat label="CGPA" value={formatGpa(summary.cgpa, scheme)} />
            <Stat
              label="Class"
              value={summary.classification?.name || '—'}
              color={summary.classification ? classTone(summary.classification, scheme) : undefined}
            />
            <Stat label="Units registered" value={summary.totalCredits ?? 0} />
            <Stat label="Units earned" value={summary.creditsEarned ?? 0} />
          </Stack>
          {scheme && (
            <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
              Graded with {scheme.name} ({scheme.maxPoint}-point, pass mark {scheme.passMark}, {scheme.retakePolicy} attempt counts for retakes)
            </Typography>
          )}
          {outstanding.length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Carry-over courses outstanding: {outstanding.map((c) => `${c.code} (${c.attempts} attempt${c.attempts > 1 ? 's' : ''})`).join(', ')}
            </Alert>
          )}
        </Box>
      )}

      {semesters.map((sitting) => (
        <Box key={`${sitting.session?.id}-${sitting.semester}`} sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
            <Typography variant="subtitle1" fontWeight={600}>
              {sitting.session?.name} · {sitting.semester}
              {sitting.classLevel?.name ? ` · ${sitting.classLevel.name}` : ''}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip label={`GPA ${formatGpa(sitting.gpa, scheme)}`} size="small" />
              <Chip label={`CGPA ${formatGpa(sitting.cgpa, scheme)}`} size="small" variant="outlined" />
            </Stack>
          </Stack>

          <TableContainer component={Paper} elevation={0} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.background.neutral }}>
                  <TableCell>Course Code</TableCell>
                  <TableCell>Course Title</TableCell>
                  <TableCell align="center">Units</TableCell>
                  <TableCell align="center">Score</TableCell>
                  <TableCell align="center">Grade</TableCell>
                  <TableCell align="center">Grade Point</TableCell>
                  <TableCell>Remark</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sitting.courses.map((course) => (
                  <TableRow key={course.resultId}>
                    <TableCell>
                      {course.code}
                      {course.isCarryOver && (
                        <Tooltip title={`Retake (attempt ${course.attempt})`}>
                          <Chip label="CO" size="small" variant="outlined" sx={{ ml: 0.5, height: 18 }} />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell align="center">{course.credit}</TableCell>
                    <TableCell align="center">{course.score}</TableCell>
                    <TableCell align="center">
                      <Chip label={course.grade} color={gradeTone(course.grade, scheme)} size="small" />
                    </TableCell>
                    <TableCell align="center">{course.gradePoint}</TableCell>
                    <TableCell>{course.remark}</TableCell>
                    <TableCell>
                      <Chip label={course.status} size="small" color={RESULT_STATUS_COLORS[course.status] || 'default'} variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      {summary && semesters.length === 0 && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No academic records found.</Typography>
        </Box>
      )}
    </Card>
  );
}

AcademicTab.propTypes = {
  student: PropTypes.object,
};
