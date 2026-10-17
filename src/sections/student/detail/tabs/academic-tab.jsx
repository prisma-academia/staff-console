import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
  Card,
  Chip,
  Alert,
  Stack,
  Paper,
  Table,
  Button,
  Dialog,
  Divider,
  Tooltip,
  MenuItem,
  useTheme,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { classTone, formatGpa, gradeTone, RESULT_STATUS_COLORS } from 'src/utils/grading';

import { courseApi, ResultApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { usePdfPreview } from 'src/components/pdf-viewer';

// ----------------------------------------------------------------------

const SEMESTERS = ['First Semester', 'Second Semester'];

const fileSafe = (value) => String(value || '').replace(/[^\w.-]+/g, '-');

// Course-form levels follow the programme length (100, 200, ...), like the student portal.
const levelNumber = (level) => {
  const n = Number(level);
  if (!n) return null;
  return n < 100 ? n * 100 : n;
};

/** Small picker that collects the parameters for a PDF before it opens in the preview. */
function PdfOptionsDialog({ open, title, onClose, onPreview, children, disabled }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {children}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={disabled}
          onClick={onPreview}
          startIcon={<Iconify icon="eva:eye-outline" />}
        >
          Preview
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PdfOptionsDialog.propTypes = {
  open: PropTypes.bool,
  title: PropTypes.string,
  onClose: PropTypes.func,
  onPreview: PropTypes.func,
  children: PropTypes.node,
  disabled: PropTypes.bool,
};

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
  const preview = usePdfPreview();
  const [slipOpen, setSlipOpen] = useState(false);
  const [slipKey, setSlipKey] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formSemester, setFormSemester] = useState(SEMESTERS[0]);
  const [formLevel, setFormLevel] = useState('');
  const studentId = student?._id;
  const regLabel = student?.regNumber || studentId;

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['student-academic-summary', studentId],
    queryFn: () => ResultApi.getStudentSummary(studentId),
    enabled: Boolean(studentId),
  });

  const scheme = summary?.gradingScheme;
  const semesters = useMemo(() => summary?.semesters || [], [summary]);
  const outstanding = summary?.outstanding || [];

  // One result slip per class level + semester (the slip endpoint is addressed that way).
  const slipOptions = useMemo(() => {
    const seen = new Map();
    semesters.forEach((sitting) => {
      const classLevelId = sitting.classLevel?.id;
      if (!classLevelId) return;
      const key = `${classLevelId}|${sitting.semester}`;
      seen.set(key, {
        key,
        classLevelId,
        semester: sitting.semester,
        label: [sitting.session?.name, sitting.semester, sitting.classLevel?.name].filter(Boolean).join(' · '),
      });
    });
    return [...seen.values()];
  }, [semesters]);

  const levelOptions = useMemo(() => {
    const levels = new Set();
    const years = parseInt(student?.program?.durationInYears, 10);
    if (years > 0) for (let i = 1; i <= years; i += 1) levels.add(i * 100);
    const current = levelNumber(student?.classLevel?.level);
    if (current) levels.add(current);
    semesters.forEach((sitting) => {
      const level = levelNumber(sitting.classLevel?.level);
      if (level) levels.add(level);
    });
    return [...levels].sort((a, b) => a - b);
  }, [student, semesters]);

  const openTranscript = () =>
    preview.open({
      title: 'Transcript',
      filename: `transcript-${fileSafe(regLabel)}`,
      fetchBlob: () => ResultApi.downloadTranscript(studentId),
    });

  const openSlipPicker = () => {
    setSlipKey((key) => key || slipOptions[slipOptions.length - 1]?.key || '');
    setSlipOpen(true);
  };

  const openResultSlip = () => {
    const option = slipOptions.find((o) => o.key === slipKey);
    if (!option) return;
    setSlipOpen(false);
    preview.open({
      title: `Result slip · ${option.label}`,
      filename: `result-${fileSafe(regLabel)}-${fileSafe(option.semester)}`,
      fetchBlob: () => ResultApi.downloadStudentResultPdf(studentId, option.classLevelId, option.semester),
    });
  };

  const openFormPicker = () => {
    setFormLevel((level) => level || levelNumber(student?.classLevel?.level) || levelOptions[0] || '');
    setFormOpen(true);
  };

  const openCourseForm = () => {
    setFormOpen(false);
    preview.open({
      title: `Course form · ${formSemester}${formLevel ? ` · ${formLevel} level` : ''}`,
      filename: `course-form-${fileSafe(regLabel)}-${fileSafe(formSemester)}`,
      fetchBlob: () =>
        courseApi.getCourseFormPdf({ studentId, semester: formSemester, yearId: formLevel ? String(formLevel) : '' }),
    });
  };

  return (
    <Card sx={{ boxShadow: theme.shadows[2] }}>
      <Stack direction="row" alignItems="center" sx={{ px: 3, py: 2 }} spacing={1} flexWrap="wrap" useFlexGap>
        <Iconify icon="mdi:school" color={theme.palette.primary.main} />
        <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
          Academic Performance
        </Typography>
        <Can do={PERMISSIONS.VIEW_COURSE_FORM}>
          <Button size="small" variant="outlined" onClick={openFormPicker} disabled={!studentId}
            startIcon={<Iconify icon="eva:file-text-outline" />}>
            Course form
          </Button>
        </Can>
        {slipOptions.length > 0 && (
          <Can do={PERMISSIONS.VIEW_RESULT}>
            <Button size="small" variant="outlined" onClick={openSlipPicker}
              startIcon={<Iconify icon="eva:file-outline" />}>
              Result slip
            </Button>
          </Can>
        )}
        {semesters.length > 0 && (
          <Can do={PERMISSIONS.VIEW_RESULT}>
            <Button size="small" variant="outlined" onClick={openTranscript}
              startIcon={<Iconify icon="eva:file-text-fill" />}>
              Transcript
            </Button>
          </Can>
        )}
      </Stack>
      <Divider />

      <PdfOptionsDialog
        open={slipOpen}
        title="Result slip"
        onClose={() => setSlipOpen(false)}
        onPreview={openResultSlip}
        disabled={!slipKey}
      >
        <TextField select fullWidth label="Sitting" value={slipKey} onChange={(e) => setSlipKey(e.target.value)}>
          {slipOptions.map((option) => (
            <MenuItem key={option.key} value={option.key}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </PdfOptionsDialog>

      <PdfOptionsDialog
        open={formOpen}
        title="Course form"
        onClose={() => setFormOpen(false)}
        onPreview={openCourseForm}
        disabled={!formSemester}
      >
        <TextField select fullWidth label="Semester" value={formSemester} onChange={(e) => setFormSemester(e.target.value)}>
          {SEMESTERS.map((semester) => (
            <MenuItem key={semester} value={semester}>
              {semester}
            </MenuItem>
          ))}
        </TextField>
        {levelOptions.length > 0 && (
          <TextField select fullWidth label="Level" value={formLevel} onChange={(e) => setFormLevel(e.target.value)}>
            {levelOptions.map((level) => (
              <MenuItem key={level} value={level}>
                {level} level
              </MenuItem>
            ))}
          </TextField>
        )}
      </PdfOptionsDialog>

      {preview.dialog}

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
