import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Card,
  Chip,
  Alert,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
  Tooltip,
  TableRow,
  MenuItem,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  TableContainer,
} from '@mui/material';

import { toProgrammeOptions } from 'src/utils/format-programme';
import { gradeBg, classTone, formatGpa, gradeTone, RESULT_STATUS_COLORS } from 'src/utils/grading';

import { PERMISSIONS } from 'src/permissions/constants';
import {
  ResultApi,
  SessionApi,
  programApi,
  classLevelApi,
} from 'src/api';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

const SEMESTERS = [
  { id: 'First Semester', name: 'First Semester' },
  { id: 'Second Semester', name: 'Second Semester' },
];

const STICKY_HEADER = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  bgcolor: 'grey.100',
  fontWeight: 700,
  minWidth: 90,
  borderBottom: '1px solid',
  borderColor: 'divider',
};

const STICKY_CELL = (left, zIndex = 1) => ({
  position: 'sticky',
  left,
  zIndex,
  bgcolor: 'background.paper',
  borderRight: '1px solid',
  borderColor: 'divider',
  minWidth: 90,
});

const errorText = (err, fallback) => {
  const errors = err?.data?.errors;
  if (Array.isArray(errors) && errors.length) {
    const list = errors.map((e) => (typeof e === 'string' ? e : e.message)).slice(0, 5).join('; ');
    return `${err?.data?.message || fallback}: ${list}${errors.length > 5 ? ` (+${errors.length - 5} more)` : ''}`;
  }
  return err?.data?.message || err?.message || fallback;
};

/** The score that will be saved: a typed override, else the computed total, else what is saved. */
const scoreToSave = (course) => {
  if (course.overrideScore !== undefined && course.overrideScore !== '') return Number(course.overrideScore);
  return course.calculatedScore ?? course.finalScore ?? null;
};

const hasOverride = (course) => course.overrideScore !== undefined && course.overrideScore !== '';

/** Grade cell: saved grade if the saved score is current, else the computed grade. */
const displayGrade = (course) => {
  if (hasOverride(course)) return null; // graded by the server on save
  if (course.resultId && !course.stale) return course.finalGrade;
  return course.calculatedGrade ?? course.finalGrade ?? null;
};

function ScoreCell({ course, onChange, scheme }) {
  const grade = displayGrade(course);
  const shown = hasOverride(course) ? course.overrideScore : (course.calculatedScore ?? course.finalScore ?? '');
  let hint = '';
  if (course.locked) hint = `Locked (${course.status}); reopen to change`;
  else if (course.stale) hint = `Saved score ${course.finalScore} (${course.finalGrade}) is out of date; save to update`;
  else if (!course.complete && course.missing?.length) hint = `Missing: ${course.missing.join(', ')} (counted as 0)`;
  else if (course.status) hint = `Saved (${course.status})`;

  return (
    <>
      <TableCell align="center" sx={{ py: 0.25, bgcolor: gradeBg(grade, scheme) }}>
        <Tooltip title={hint}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
            {course.locked ? (
              <Typography variant="body2" sx={{ minWidth: 48 }}>{course.finalScore ?? '—'}</Typography>
            ) : (
              <TextField
                size="small"
                type="number"
                inputProps={{ min: 0, max: 100, step: 0.5 }}
                value={shown}
                onChange={(e) => onChange(e.target.value)}
                variant="outlined"
                sx={{ width: 76 }}
              />
            )}
            {course.locked && <Iconify icon="eva:lock-fill" width={14} />}
            {!course.locked && course.stale && <Iconify icon="eva:alert-triangle-fill" width={14} sx={{ color: 'warning.main' }} />}
            {!course.locked && !course.stale && !course.complete && course.missing?.length > 0 && course.calculatedScore != null && (
              <Iconify icon="eva:info-fill" width={14} sx={{ color: 'text.disabled' }} />
            )}
          </Stack>
        </Tooltip>
      </TableCell>
      <TableCell align="center" sx={{ py: 0.25, bgcolor: gradeBg(grade, scheme) }}>
        {grade ? (
          <Tooltip title={course.locked ? course.remark : (scheme?.bands?.find((b) => b.grade === grade)?.remark || '')}>
            <Chip size="small" label={grade} color={gradeTone(grade, scheme)} variant={course.resultId && !course.stale ? 'filled' : 'outlined'} />
          </Tooltip>
        ) : (
          <Typography variant="caption" color="text.secondary">{hasOverride(course) ? 'on save' : '—'}</Typography>
        )}
      </TableCell>
    </>
  );
}

ScoreCell.propTypes = {
  course: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  scheme: PropTypes.object,
};

export default function ResultTableView() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [classId, setClassId] = useState('');
  const [programId, setProgramId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [semester, setSemester] = useState('');
  const [builderData, setBuilderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statusAction, setStatusAction] = useState(null); // 'approve' | 'publish' | 'reopen'
  const [reopenReason, setReopenReason] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  const { data: classLevelOptions } = useQuery({ queryKey: ['classLevels'], queryFn: classLevelApi.getClassLevels });
  const { data: programOptions } = useQuery({ queryKey: ['programs'], queryFn: programApi.getPrograms });
  const { data: sessionOptions } = useQuery({ queryKey: ['sessions'], queryFn: SessionApi.getSessions });

  const scheme = builderData?.metadata?.gradingScheme || null;
  const statusCounts = builderData?.metadata?.statusCounts || {};

  const loadBuilder = async () => {
    if (!classId || !programId || !sessionId || !semester) {
      enqueueSnackbar('Please select class, program, session, and semester', { variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const data = await ResultApi.getBuilder({ classId, programId, sessionId, semester });
      setBuilderData(data);
    } catch (err) {
      enqueueSnackbar(errorText(err, 'Failed to load result table data'), { variant: 'error' });
      setBuilderData(null);
    } finally {
      setLoading(false);
    }
  };

  const updateCourseScore = (studentIndex, listKey, courseIndex, value) => {
    setBuilderData((prev) => {
      if (!prev?.students) return prev;
      const students = [...prev.students];
      const student = { ...students[studentIndex], [listKey]: [...students[studentIndex][listKey]] };
      student[listKey][courseIndex] = { ...student[listKey][courseIndex], overrideScore: value };
      students[studentIndex] = student;
      return { ...prev, students };
    });
  };

  const pendingRows = useMemo(() => {
    const rows = [];
    (builderData?.students || []).forEach((stu) => {
      [...(stu.courses || []), ...(stu.carryOvers || [])].forEach((co) => {
        if (co.locked) return;
        const score = scoreToSave(co);
        if (score === null || score === undefined || Number.isNaN(score)) return;
        rows.push({ studentId: stu.studentId, courseId: co.courseId, score });
      });
    });
    return rows;
  }, [builderData]);

  const handleSaveAll = async () => {
    if (!pendingRows.length) {
      enqueueSnackbar('Nothing to save: enter assessment scores first (approved/published rows are locked).', { variant: 'info' });
      return;
    }
    setSaving(true);
    try {
      const result = await ResultApi.bulkSave({ resultsData: pendingRows, sessionId, semester });
      enqueueSnackbar(`Saved ${result?.saved ?? pendingRows.length} result(s)`, { variant: 'success' });
      loadBuilder();
    } catch (err) {
      enqueueSnackbar(errorText(err, 'Failed to save results'), { variant: 'error', autoHideDuration: 10000 });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async () => {
    const action = statusAction;
    setChangingStatus(true);
    try {
      const body = { programId, classId, sessionId, semester };
      if (action === 'reopen') body.reason = reopenReason.trim();
      const result = await ResultApi[action](body);
      const verb = { approve: 'approved', publish: 'published', reopen: 'reopened' }[action];
      enqueueSnackbar(`${result?.count ?? 0} result(s) ${verb}`, { variant: 'success' });
      (result?.warnings || []).forEach((w) => enqueueSnackbar(w, { variant: 'warning', autoHideDuration: 10000 }));
      setStatusAction(null);
      setReopenReason('');
      loadBuilder();
    } catch (err) {
      enqueueSnackbar(errorText(err, `Could not ${action} results`), { variant: 'error' });
    } finally {
      setChangingStatus(false);
    }
  };

  const handleExport = async () => {
    if (!sessionId) {
      enqueueSnackbar('Select session and load data first', { variant: 'warning' });
      return;
    }
    setExporting(true);
    try {
      const params = { format: 'xlsx', sessionId };
      if (programId) params.programId = programId;
      if (classId) params.classLevelId = classId;
      if (semester) params.semester = semester;
      const blob = await ResultApi.exportResults(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results-export-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      enqueueSnackbar('Export downloaded', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.message || 'Export failed', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const classLevelSelectData = useMemo(
    () => (classLevelOptions || []).map((c) => ({ _id: c._id, name: c.name || c._id })),
    [classLevelOptions]
  );
  const programSelectData = useMemo(() => toProgrammeOptions(programOptions), [programOptions]);
  const sessionSelectData = useMemo(
    () => (sessionOptions || []).map((s) => ({ _id: s._id, name: s.name || s.code || s._id })),
    [sessionOptions]
  );

  const students = useMemo(() => builderData?.students ?? [], [builderData]);
  const courseColumns = useMemo(() => (students.length ? students[0]?.courses ?? [] : []), [students]);
  const carryOverRows = useMemo(
    () => students.flatMap((stu, studentIndex) =>
      (stu.carryOvers || []).map((course, courseIndex) => ({ stu, studentIndex, course, courseIndex }))),
    [students]
  );
  const staleCount = useMemo(
    () => students.reduce((n, s) => n + [...s.courses, ...(s.carryOvers || [])].filter((c) => c.stale && !c.locked).length, 0),
    [students]
  );

  const canLoad = Boolean(classId && programId && sessionId && semester);
  const resetBuilder = (setter) => (e) => { setter(e.target.value); setBuilderData(null); };

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2, pt: 4 }}>
        <Button startIcon={<Iconify icon="eva:arrow-back-fill" />} onClick={() => navigate('/')} variant="outlined">
          Back
        </Button>
        <Typography variant="h4" sx={{ flex: 1 }}>
          Result table
        </Typography>
      </Stack>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Class level</InputLabel>
            <Select value={classId} label="Class level" onChange={resetBuilder(setClassId)}>
              <MenuItem value="">Select</MenuItem>
              {classLevelSelectData.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Programme</InputLabel>
            <Select value={programId} label="Programme" onChange={resetBuilder(setProgramId)}>
              <MenuItem value="">Select</MenuItem>
              {programSelectData.map((p) => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Session</InputLabel>
            <Select value={sessionId} label="Session" onChange={resetBuilder(setSessionId)}>
              <MenuItem value="">Select</MenuItem>
              {sessionSelectData.map((s) => (
                <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Semester</InputLabel>
            <Select value={semester} label="Semester" onChange={resetBuilder(setSemester)}>
              <MenuItem value="">Select</MenuItem>
              {SEMESTERS.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <LoadingButton
            variant="contained"
            onClick={loadBuilder}
            loading={loading}
            disabled={!canLoad}
            startIcon={<Iconify icon="eva:refresh-fill" />}
          >
            Generate
          </LoadingButton>
          <Can anyOf={[PERMISSIONS.ADD_RESULT, PERMISSIONS.EDIT_RESULT]}>
            <LoadingButton
              variant="contained"
              color="primary"
              onClick={handleSaveAll}
              loading={saving}
              disabled={!builderData?.students?.length}
              startIcon={<Iconify icon="eva:save-fill" />}
            >
              Save drafts
            </LoadingButton>
          </Can>
          <Can do={PERMISSIONS.APPROVE_RESULT}>
            <Button
              variant="outlined"
              color="info"
              disabled={!statusCounts.draft}
              onClick={() => setStatusAction('approve')}
              startIcon={<Iconify icon="eva:checkmark-circle-2-outline" />}
            >
              Approve
            </Button>
          </Can>
          <Can do={PERMISSIONS.PUBLISH_RESULT}>
            <Button
              variant="outlined"
              color="success"
              disabled={!statusCounts.approved}
              onClick={() => setStatusAction('publish')}
              startIcon={<Iconify icon="eva:paper-plane-outline" />}
            >
              Publish
            </Button>
          </Can>
          <Can do={PERMISSIONS.REOPEN_RESULT}>
            <Button
              variant="outlined"
              color="warning"
              disabled={!statusCounts.approved && !statusCounts.published}
              onClick={() => setStatusAction('reopen')}
              startIcon={<Iconify icon="eva:unlock-outline" />}
            >
              Reopen
            </Button>
          </Can>
          <Can anyOf={[PERMISSIONS.EXPORT_RESULT, PERMISSIONS.VIEW_RESULT]}>
            <LoadingButton
              variant="outlined"
              onClick={handleExport}
              loading={exporting}
              disabled={!builderData}
              startIcon={<Iconify icon="eva:download-fill" />}
            >
              Export
            </LoadingButton>
          </Can>
        </Stack>

        {builderData?.metadata && (
          <Stack spacing={1} sx={{ mt: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="body2" color="text.secondary">
                {builderData.metadata.totalStudents ?? 0} students, {builderData.metadata.totalCourses ?? 0} courses
                {builderData.metadata.classLevel?.name && ` · ${builderData.metadata.classLevel.name}`}
                {builderData.metadata.program?.name && ` · ${builderData.metadata.program.name}`}
              </Typography>
              {['draft', 'approved', 'published'].map((s) => (statusCounts[s] ? (
                <Chip key={s} size="small" color={RESULT_STATUS_COLORS[s]} label={`${statusCounts[s]} ${s}`} />
              ) : null))}
              {statusCounts.unsaved > 0 && <Chip size="small" variant="outlined" label={`${statusCounts.unsaved} not saved`} />}
            </Stack>
            {scheme && (
              <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="caption" sx={{ fontWeight: 600, mr: 0.5 }}>
                  {scheme.name} · pass mark {scheme.passMark}:
                </Typography>
                {scheme.bands.map((b) => (
                  <Chip key={b.grade} size="small" variant="outlined" color={gradeTone(b.grade, scheme)}
                    label={`${b.grade} ${b.minScore}–${b.maxScore} (${b.point})`} />
                ))}
              </Stack>
            )}
            {builderData.metadata.incomplete > 0 && (
              <Alert severity="info" sx={{ py: 0 }}>
                {builderData.metadata.incomplete} course score(s) are missing at least one assessment; missing assessments count as 0.
              </Alert>
            )}
            {staleCount > 0 && (
              <Alert severity="warning" sx={{ py: 0 }}>
                {staleCount} saved result(s) no longer match the assessment scores. Save drafts to update them.
              </Alert>
            )}
          </Stack>
        )}
      </Card>

      <Card sx={{ overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 340px)', overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...STICKY_HEADER, left: 0, minWidth: 48, zIndex: 3 }}>#</TableCell>
                <TableCell sx={{ ...STICKY_HEADER, left: 48, minWidth: 110, zIndex: 3 }}>Reg No</TableCell>
                <TableCell sx={{ ...STICKY_HEADER, left: 158, minWidth: 160, zIndex: 3 }}>Name</TableCell>
                <TableCell sx={{ ...STICKY_HEADER, left: 318, minWidth: 64, zIndex: 3 }}>GPA</TableCell>
                <TableCell sx={{ ...STICKY_HEADER, left: 382, minWidth: 64, zIndex: 3 }}>CGPA</TableCell>
                <TableCell sx={{ ...STICKY_HEADER, minWidth: 120 }}>Class</TableCell>
                {courseColumns.map((course, idx) => (
                  <React.Fragment key={course.courseId || idx}>
                    {(course.assessments || []).map((assess) => (
                      <TableCell
                        key={assess.assessmentId}
                        align="center"
                        sx={{ ...STICKY_HEADER, minWidth: 72 }}
                        title={`${course.courseCode} ${assess.type} / ${assess.maxScore ?? 100}${assess.weight ? ` · ${assess.weight}%` : ''}`}
                      >
                        <Box sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{assess.type || '—'}</Box>
                        <Box sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>
                          / {assess.maxScore ?? 100}{assess.weight ? ` · ${assess.weight}%` : ''}
                        </Box>
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ ...STICKY_HEADER, minWidth: 96 }}>
                      {course.courseCode}
                      <Box sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>Score · {course.credit} units</Box>
                    </TableCell>
                    <TableCell align="center" sx={{ ...STICKY_HEADER, minWidth: 64 }}>
                      Grade
                    </TableCell>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student, rowIndex) => (
                <TableRow key={student.studentId || rowIndex} hover>
                  <TableCell sx={{ ...STICKY_CELL(0), minWidth: 48 }}>{rowIndex + 1}</TableCell>
                  <TableCell sx={{ ...STICKY_CELL(48), minWidth: 110 }}>{student.regNumber || '—'}</TableCell>
                  <TableCell sx={{ ...STICKY_CELL(158), minWidth: 160 }}>
                    {student.name || '—'}
                    {student.outstanding?.length > 0 && (
                      <Tooltip title={`Outstanding: ${student.outstanding.join(', ')}`}>
                        <Chip size="small" color="error" variant="outlined" label={`${student.outstanding.length} CO`} sx={{ ml: 0.5, height: 18 }} />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell sx={{ ...STICKY_CELL(318), minWidth: 64 }}>{formatGpa(student.gpa, scheme)}</TableCell>
                  <TableCell sx={{ ...STICKY_CELL(382), minWidth: 64 }}>{formatGpa(student.cgpa, scheme)}</TableCell>
                  <TableCell>
                    {student.classification ? (
                      <Chip size="small" label={student.classification.name} color={classTone(student.classification, scheme)} variant="outlined" />
                    ) : '—'}
                  </TableCell>
                  {(student.courses || []).map((course, colIndex) => (
                    <React.Fragment key={course.courseId || colIndex}>
                      {(course.assessments || []).map((assess) => (
                        <TableCell key={assess.assessmentId} align="center" sx={{ py: 0.25, fontSize: '0.8125rem' }}>
                          {assess.score != null ? assess.score : '—'}
                        </TableCell>
                      ))}
                      <ScoreCell
                        course={course}
                        scheme={scheme}
                        onChange={(value) => updateCourseScore(rowIndex, 'courses', colIndex, value)}
                      />
                    </React.Fragment>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && students.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Select class, programme, session, and semester, then click Generate to load the result table.
            </Typography>
          </Box>
        )}
      </Card>

      {carryOverRows.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <Box sx={{ p: 2, pb: 0 }}>
            <Typography variant="subtitle1">Carry-over courses</Typography>
            <Typography variant="body2" color="text.secondary">
              Courses these students failed in an earlier sitting and are retaking this semester. Saved results are recorded as a new attempt.
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Reg No</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Assessments</TableCell>
                  <TableCell align="center">Score</TableCell>
                  <TableCell align="center">Grade</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {carryOverRows.map(({ stu, studentIndex, course, courseIndex }) => (
                  <TableRow key={`${stu.studentId}-${course.courseId}`} hover>
                    <TableCell>{stu.regNumber}</TableCell>
                    <TableCell>{stu.name}</TableCell>
                    <TableCell>{course.courseCode} · {course.courseName} ({course.credit} units)</TableCell>
                    <TableCell>
                      {(course.assessments || []).map((a) => `${a.type}: ${a.score ?? '—'}/${a.maxScore}`).join(' · ') || '—'}
                    </TableCell>
                    <ScoreCell
                      course={course}
                      scheme={scheme}
                      onChange={(value) => updateCourseScore(studentIndex, 'carryOvers', courseIndex, value)}
                    />
                    <TableCell>
                      {course.status ? <Chip size="small" color={RESULT_STATUS_COLORS[course.status]} label={course.status} /> : 'not saved'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={Boolean(statusAction)} onClose={() => !changingStatus && setStatusAction(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {statusAction === 'approve' && 'Approve results'}
          {statusAction === 'publish' && 'Publish results'}
          {statusAction === 'reopen' && 'Reopen results'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {statusAction === 'approve' && (
              <Typography variant="body2">
                Approve the {statusCounts.draft || 0} draft result(s) of this class. Approved results are locked: their scores can no longer be changed unless they are reopened.
              </Typography>
            )}
            {statusAction === 'publish' && (
              <Typography variant="body2">
                Publish the {statusCounts.approved || 0} approved result(s). Students will see them on the student portal.
              </Typography>
            )}
            {statusAction === 'reopen' && (
              <>
                <Typography variant="body2">
                  Send the approved and published results of this class back to draft so they can be corrected. Students stop seeing them until they are published again.
                </Typography>
                <TextField
                  label="Reason (recorded in the audit log)"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  multiline
                  minRows={2}
                  required
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusAction(null)} disabled={changingStatus}>Cancel</Button>
          <LoadingButton
            variant="contained"
            loading={changingStatus}
            disabled={statusAction === 'reopen' && !reopenReason.trim()}
            onClick={handleStatusChange}
            color={statusAction === 'reopen' ? 'warning' : 'primary'}
          >
            {statusAction === 'approve' && 'Approve'}
            {statusAction === 'publish' && 'Publish'}
            {statusAction === 'reopen' && 'Reopen'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
