import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Card,
  Alert,
  Stack,
  Table,
  Button,
  TableRow,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  TableContainer,
} from '@mui/material';

import {
  ScoreApi,
  SessionApi,
  StudentApi,
  AssessmentApi,
} from 'src/api';

import Iconify from 'src/components/iconify';
import CustomSelect from 'src/components/select';

const getGrade = (percentage) => {
  if (percentage == null || Number.isNaN(percentage)) return '';
  const p = Number(percentage);
  if (p >= 70) return 'A';
  if (p >= 60) return 'B';
  if (p >= 50) return 'C';
  if (p >= 45) return 'D';
  if (p >= 40) return 'E';
  return 'F';
};

const getStudentDisplayName = (student) => {
  const first = student?.personalInfo?.firstName ?? student?.firstName ?? '';
  const last = student?.personalInfo?.lastName ?? student?.lastName ?? '';
  return [first, last].filter(Boolean).join(' ') || student?.email || student?._id || 'N/A';
};

export default function EnterScoresPageView({ assessmentId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [rows, setRows] = useState([]);
  const [existingScoreEntryId, setExistingScoreEntryId] = useState(null);

  const { data: assessment } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => AssessmentApi.getAssessmentById(assessmentId),
    enabled: !!assessmentId,
  });

  const { data: sessionOptions, error: sessionError } = useQuery({
    queryKey: ['sessions'],
    queryFn: SessionApi.getSessions,
    enabled: !!assessmentId,
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: () => StudentApi.getStudents(),
    enabled: !!assessmentId,
  });

  const { data: scoreEntries } = useQuery({
    queryKey: ['scores-by-assessment', assessmentId],
    queryFn: () => ScoreApi.getScoresByAssessment(assessmentId),
    enabled: !!assessmentId && !!selectedSessionId,
  });

  const sessionSelectOptions = useMemo(() => {
    if (!sessionOptions || !Array.isArray(sessionOptions)) return [];
    return sessionOptions.map((s) => ({
      _id: s._id,
      name: s.name || s.code || s._id,
    }));
  }, [sessionOptions]);

  const maxScoreDefault = assessment?.maxScore ?? 100;

  // Build initial rows from students
  useEffect(() => {
    if (!students || !Array.isArray(students)) return;
    const initialRows = students.map((stu) => ({
      studentId: stu._id,
      regNumber: stu.regNumber || stu.registrationNumber || '',
      name: getStudentDisplayName(stu),
      score: '',
      maxScore: maxScoreDefault,
      remark: '',
    }));
    setRows(initialRows);
  }, [students, maxScoreDefault]);

  // When session is selected and we have score entries, find matching entry and pre-fill or reset rows
  useEffect(() => {
    if (!selectedSessionId || !students?.length) return;
    const entry =
      scoreEntries && Array.isArray(scoreEntries)
        ? scoreEntries.find((e) => {
            const sid = typeof e.session === 'object' ? e.session?._id : e.session;
            return sid === selectedSessionId;
          })
        : null;
    if (!entry) {
      setExistingScoreEntryId(null);
      setRows(
        students.map((stu) => ({
          studentId: stu._id,
          regNumber: stu.regNumber || stu.registrationNumber || '',
          name: getStudentDisplayName(stu),
          score: '',
          maxScore: maxScoreDefault,
          remark: '',
        }))
      );
      return;
    }
    setExistingScoreEntryId(entry._id);
    const scoresByStudent = {};
    (entry.scores || []).forEach((s) => {
      const sid = typeof s.student === 'object' ? s.student?._id : s.student;
      if (sid) scoresByStudent[sid] = s;
    });
    setRows(
      students.map((stu) => {
        const r = {
          studentId: stu._id,
          regNumber: stu.regNumber || stu.registrationNumber || '',
          name: getStudentDisplayName(stu),
          score: '',
          maxScore: maxScoreDefault,
          remark: '',
        };
        const existing = scoresByStudent[stu._id];
        if (existing) {
          r.score = existing.score ?? '';
          r.maxScore = existing.maxScore ?? maxScoreDefault;
          r.remark = existing.remark ?? '';
        }
        return r;
      })
    );
  }, [selectedSessionId, scoreEntries, students, maxScoreDefault]);

  const createMutation = useMutation({
    mutationFn: ScoreApi.createScore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores-by-assessment', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      enqueueSnackbar('Scores saved successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to save scores', { variant: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ScoreApi.updateScore(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores-by-assessment', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      enqueueSnackbar('Scores updated successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to update scores', { variant: 'error' });
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;


  const handleCellChange = (index, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedSessionId) {
      enqueueSnackbar('Please select a session', { variant: 'warning' });
      return;
    }
    const scores = rows.map((r) => ({
      student: r.studentId,
      score: Number(r.score) || 0,
      maxScore: Number(r.maxScore) || maxScoreDefault,
      remark: r.remark || undefined,
    }));
    const studentsPayload = rows.map((r) => r.studentId);
    if (existingScoreEntryId) {
      updateMutation.mutate({ id: existingScoreEntryId, data: { scores } });
    } else {
      createMutation.mutate({
        assessment: assessmentId,
        session: selectedSessionId,
        students: studentsPayload,
        scores,
      });
    }
  };

  if (!assessmentId) return null;

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3, pt: 4 }}>
        <Button
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
          onClick={() => navigate('/assessment')}
          variant="outlined"
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ flex: 1 }}>
          Enter Scores — {assessment?.name ?? '...'}
        </Typography>
      </Stack>

      {sessionError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load sessions. If the session API is not yet available, add it to the backend.
        </Alert>
      )}

      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <CustomSelect
          data={sessionSelectOptions}
          label="Session"
          name="session"
          formik={{
            values: { session: selectedSessionId },
            handleChange: (e) => setSelectedSessionId(e.target.value || ''),
            setFieldValue: (name, value) => name === 'session' && setSelectedSessionId(value || ''),
            touched: {},
            errors: {},
          }}
        />
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={isSaving}
          disabled={!selectedSessionId}
          startIcon={<Iconify icon="eva:save-fill" />}
        >
          Save Scores
        </LoadingButton>
      </Stack>

      <Card
        variant="outlined"
        sx={{
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)', overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 120, bgcolor: 'background.neutral', fontWeight: 600 }}>
                  Reg No
                </TableCell>
                <TableCell sx={{ minWidth: 180, bgcolor: 'background.neutral', fontWeight: 600 }}>
                  Name
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ minWidth: 100, bgcolor: 'background.neutral', fontWeight: 600 }}
                >
                  Score
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ minWidth: 100, bgcolor: 'background.neutral', fontWeight: 600 }}
                >
                  Max Score
                </TableCell>
                <TableCell sx={{ minWidth: 140, bgcolor: 'background.neutral', fontWeight: 600 }}>
                  Remark
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ minWidth: 72, bgcolor: 'background.neutral', fontWeight: 600 }}
                >
                  %
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ minWidth: 64, bgcolor: 'background.neutral', fontWeight: 600 }}
                >
                  Grade
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => {
                const max = Number(row.maxScore) || maxScoreDefault;
                const scoreNum = Number(row.score);
                const percentage =
                  max > 0 && !Number.isNaN(scoreNum) ? Math.round((scoreNum / max) * 100) : null;
                const grade = getGrade(percentage);
                return (
                  <TableRow key={row.studentId} hover>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{row.regNumber || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {row.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.5 }}>
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 0, step: 0.01 }}
                        value={row.score}
                        onChange={(e) => handleCellChange(index, 'score', e.target.value)}
                        sx={{ width: 90 }}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.5 }}>
                      <TextField
                        size="small"
                        type="number"
                        inputProps={{ min: 1 }}
                        value={row.maxScore}
                        onChange={(e) => handleCellChange(index, 'maxScore', e.target.value)}
                        sx={{ width: 90 }}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <TextField
                        size="small"
                        placeholder="Remark"
                        value={row.remark}
                        onChange={(e) => handleCellChange(index, 'remark', e.target.value)}
                        fullWidth
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {percentage != null ? `${percentage}%` : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={500}>
                        {grade || '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {(!rows || rows.length === 0) && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No students to display. Students will appear here once loaded.
            </Typography>
          </Box>
        )}
      </Card>
    </Container>
  );
}

EnterScoresPageView.propTypes = {
  assessmentId: PropTypes.string.isRequired,
};
