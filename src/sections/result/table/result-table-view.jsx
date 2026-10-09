import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useSearchParams } from 'react-router-dom';
import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Card,
  Chip,
  Menu,
  Alert,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
  Switch,
  Tooltip,
  Checkbox,
  Collapse,
  MenuItem,
  TableRow,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
  LinearProgress,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';
import { toProgrammeOptions } from 'src/utils/format-programme';
import { classTone, formatGpa, gradeTone } from 'src/utils/grading';

import { PERMISSIONS } from 'src/permissions/constants';
import { ResultApi, programApi, classLevelApi } from 'src/api';

import Iconify from 'src/components/iconify';

import CourseReadiness from './course-readiness';
import { ResultCell, ResultCellPopover } from './result-cell';
import useScoringSession from '../../assessment/use-scoring-session';

const SEMESTERS = ['First Semester', 'Second Semester'];

const errorText = (err, fallback) => {
  const errors = err?.data?.errors;
  if (Array.isArray(errors) && errors.length) {
    const list = errors.map((e) => (typeof e === 'string' ? e : e.message)).slice(0, 4).join('; ');
    return `${err?.data?.message || fallback}: ${list}${errors.length > 4 ? ` (+${errors.length - 4} more)` : ''}`;
  }
  return err?.data?.message || err?.message || fallback;
};

function Step({ number, title, value, caption, action, done }) {
  return (
    <Box sx={{ flex: 1, minWidth: 190, p: 2, borderRight: { md: 1 }, borderBottom: { xs: 1, md: 0 }, borderColor: 'divider', '&:last-of-type': { border: 0 } }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            typography: 'caption',
            fontWeight: 700,
            bgcolor: done ? 'success.main' : 'grey.300',
            color: done ? 'common.white' : 'text.primary',
          }}
        >
          {done ? <Iconify icon="eva:checkmark-fill" width={16} /> : number}
        </Box>
        <Typography variant="subtitle2">{title}</Typography>
      </Stack>
      <Typography variant="h5">{value}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', minHeight: 20 }}>
        {caption}
      </Typography>
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  );
}

Step.propTypes = {
  number: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.node,
  caption: PropTypes.node,
  action: PropTypes.node,
  done: PropTypes.bool,
};

const STICKY = (left, header = false) => ({
  position: 'sticky',
  left,
  zIndex: header ? 4 : 2,
  bgcolor: header ? 'grey.100' : 'background.paper',
});

export default function ResultTableView() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { check, checkAny } = usePermissions();
  const [params, setParams] = useSearchParams();
  const { sessionId, sessions, setSessionId } = useScoringSession();

  const programId = params.get('programId') || '';
  const classId = params.get('classId') || '';
  const semester = params.get('semester') || '';
  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const [search, setSearch] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showCourses, setShowCourses] = useState(true);
  const [statusAction, setStatusAction] = useState(null); // approve | publish | reopen
  const [reopenReason, setReopenReason] = useState('');
  const [busy, setBusy] = useState(null);
  const [computeOpen, setComputeOpen] = useState(false);
  const [computeOptions, setComputeOptions] = useState({ includeIncomplete: false, replaceOverrides: false });
  const [computeOutcome, setComputeOutcome] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [popover, setPopover] = useState(null); // { anchorEl, studentId, courseId, carry }

  const permissions = {
    compute: check(PERMISSIONS.ADD_RESULT),
    override: check(PERMISSIONS.ADD_RESULT),
    remove: check(PERMISSIONS.DELETE_RESULT),
  };

  const { data: classLevels } = useQuery({ queryKey: ['classLevels'], queryFn: classLevelApi.getClassLevels });
  const { data: programs } = useQuery({ queryKey: ['programs'], queryFn: programApi.getPrograms });
  const programOptions = useMemo(() => toProgrammeOptions(programs), [programs]);

  const ready = Boolean(programId && classId && semester && sessionId);
  const builderQuery = useQuery({
    queryKey: ['result-builder', programId, classId, sessionId, semester],
    queryFn: () => ResultApi.getBuilder({ classId, programId, sessionId, semester }),
    enabled: ready,
    retry: false,
  });
  const data = ready ? builderQuery.data : null;
  const meta = data?.metadata;
  const scheme = meta?.gradingScheme || null;
  const reload = () => queryClient.invalidateQueries({ queryKey: ['result-builder'] });

  useEffect(() => setPopover(null), [programId, classId, semester, sessionId]);

  const students = useMemo(() => data?.students ?? [], [data]);
  const courseColumns = students[0]?.courses ?? [];
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? students.filter((s) => `${s.regNumber} ${s.name}`.toLowerCase().includes(term)) : students;
  }, [students, search]);

  const totals = useMemo(() => {
    const t = { students: 0, complete: 0, unsaved: 0, stale: 0, draft: 0, approved: 0, published: 0, setupIssues: 0 };
    (meta?.courses || []).forEach((c) => {
      t.students += c.students;
      t.complete += c.complete;
      t.unsaved += c.unsaved;
      t.stale += c.stale;
      t.draft += c.draft;
      t.approved += c.approved;
      t.published += c.published;
      if (!c.setup.ok) t.setupIssues += 1;
    });
    return t;
  }, [meta]);
  const totalResults = totals.draft + totals.approved + totals.published;

  const carryOverRows = useMemo(
    () => visible.flatMap((stu) => (stu.carryOvers || []).map((course) => ({ stu, course }))),
    [visible]
  );

  const popoverStudent = popover && students.find((s) => s.studentId === popover.studentId);
  const popoverCourse = popoverStudent && (popover.carry ? popoverStudent.carryOvers : popoverStudent.courses).find((c) => c.courseId === popover.courseId);

  // ------------------------------------------------------------------
  // Actions

  const runCompute = async () => {
    setBusy('compute-all');
    try {
      const outcome = await ResultApi.compute({ sessionId, programId, classId, semester, ...computeOptions });
      setComputeOutcome(outcome);
      reload();
    } catch (err) {
      enqueueSnackbar(errorText(err, 'Could not compute results'), { variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const saveComputed = async (student, course) => {
    setBusy('compute');
    try {
      await ResultApi.compute({ sessionId, courseId: course.courseId, studentIds: [student.studentId], replaceOverrides: true, includeIncomplete: true });
      enqueueSnackbar(`${student.regNumber} ${course.courseCode}: saved ${course.calculatedScore}`, { variant: 'success' });
      reload();
    } catch (err) {
      enqueueSnackbar(errorText(err, 'Could not save the result'), { variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const saveOverride = async (student, course, score) => {
    setBusy('override');
    try {
      await ResultApi.bulkSave({ resultsData: [{ studentId: student.studentId, courseId: course.courseId, score }], sessionId, semester });
      enqueueSnackbar(`${student.regNumber} ${course.courseCode}: score set to ${score}`, { variant: 'success' });
      reload();
    } catch (err) {
      enqueueSnackbar(errorText(err, 'Could not save the override'), { variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const deleteDraft = async (student, course) => {
    if (!window.confirm(`Delete the draft result of ${student.regNumber} for ${course.courseCode}?`)) return;
    setBusy('delete');
    try {
      await ResultApi.bulkDelete({ ids: [course.resultId] });
      enqueueSnackbar('Draft result deleted', { variant: 'success' });
      setPopover(null);
      reload();
    } catch (err) {
      enqueueSnackbar(errorText(err, 'Could not delete the draft'), { variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const changeStatus = async () => {
    const action = statusAction;
    setBusy('status');
    try {
      const body = { programId, classId, sessionId, semester };
      if (action === 'reopen') body.reason = reopenReason.trim();
      const result = await ResultApi[action](body);
      const verb = { approve: 'approved', publish: 'published', reopen: 'reopened' }[action];
      enqueueSnackbar(`${result?.count ?? 0} result(s) ${verb}`, { variant: 'success' });
      (result?.warnings || []).forEach((w) => enqueueSnackbar(w, { variant: 'warning', autoHideDuration: 10000 }));
      setStatusAction(null);
      setReopenReason('');
      reload();
    } catch (err) {
      enqueueSnackbar(errorText(err, `Could not ${action} results`), { variant: 'error' });
    } finally {
      setBusy(null);
    }
  };

  const exportResults = async () => {
    setMenuAnchor(null);
    try {
      const blob = await ResultApi.exportResults({ format: 'xlsx', sessionId, programId, classLevelId: classId, semester });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results-${meta?.program?.code || 'class'}-${meta?.classLevel?.name || ''}-${semester}.xlsx`.replace(/[\\/:*?"<>|\s]+/g, '_');
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      enqueueSnackbar(err?.message || 'Export failed', { variant: 'error' });
    }
  };

  // ------------------------------------------------------------------

  const missingFilters = [!programId && 'programme', !classId && 'class level', !semester && 'semester'].filter(Boolean);
  const pendingCompute = totals.unsaved + totals.stale;

  return (
    <Container maxWidth="xl">
      <Box sx={{ pt: 4, pb: 6 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'flex-end' }} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4">Results</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
              The broadsheet of one class for one semester. Compute drafts from the assessment scores, check them, then
              approve and publish so students can see them.
            </Typography>
          </Box>
          <Select size="small" value={sessionId} onChange={(e) => setSessionId(e.target.value)} sx={{ minWidth: 200 }} startAdornment={<Iconify icon="solar:calendar-linear" width={18} sx={{ mr: 1 }} />}>
            {sessions.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {s.name || s.code}
                {s.isCurrent ? ' (current)' : ''}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <Card sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center">
            <TextField select size="small" label="Programme" value={programId} onChange={(e) => setParam('programId', e.target.value)} sx={{ minWidth: 240 }}>
              {programOptions.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField select size="small" label="Class level" value={classId} onChange={(e) => setParam('classId', e.target.value)} sx={{ minWidth: 160 }}>
              {(classLevels || []).map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField select size="small" label="Semester" value={semester} onChange={(e) => setParam('semester', e.target.value)} sx={{ minWidth: 170 }}>
              {SEMESTERS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            {ready && (
              <Button color="inherit" startIcon={<Iconify icon="eva:refresh-fill" />} onClick={reload} disabled={builderQuery.isFetching}>
                Refresh
              </Button>
            )}
            <Box sx={{ flex: 1 }} />
            {ready && meta && (
              <>
                <Button color="inherit" endIcon={<Iconify icon="eva:more-vertical-fill" />} onClick={(e) => setMenuAnchor(e.currentTarget)}>
                  More
                </Button>
                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
                  {checkAny([PERMISSIONS.EXPORT_RESULT]) && (
                    <MenuItem onClick={exportResults}>
                      <Iconify icon="eva:download-fill" sx={{ mr: 1 }} /> Export to Excel
                    </MenuItem>
                  )}
                  {check(PERMISSIONS.REOPEN_RESULT) && (
                    <MenuItem
                      disabled={!totals.approved && !totals.published}
                      onClick={() => {
                        setMenuAnchor(null);
                        setStatusAction('reopen');
                      }}
                    >
                      <Iconify icon="eva:unlock-outline" sx={{ mr: 1 }} /> Reopen for corrections
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
          </Stack>
        </Card>

        {!ready && (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <Iconify icon="eva:clipboard-outline" width={40} sx={{ color: 'text.disabled', mb: 1 }} />
            <Typography variant="subtitle1">Choose a class</Typography>
            <Typography variant="body2" color="text.secondary">
              Select the {missingFilters.join(', ')} to open its broadsheet.
            </Typography>
          </Card>
        )}

        {ready && builderQuery.isLoading && <LinearProgress />}
        {ready && builderQuery.isError && <Alert severity="warning">{errorText(builderQuery.error, 'Could not load the broadsheet')}</Alert>}

        {meta && (
          <>
            {/* Workflow */}
            <Card sx={{ mb: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }}>
                <Step
                  number={1}
                  title="Scores"
                  done={totals.students > 0 && totals.complete === totals.students}
                  value={totals.students ? `${Math.round((totals.complete / totals.students) * 100)}%` : '—'}
                  caption={`${totals.complete} of ${totals.students} course scores complete${totals.setupIssues ? ` · ${totals.setupIssues} course(s) not set up` : ''}`}
                />
                <Step
                  number={2}
                  title="Draft results"
                  done={totalResults > 0 && pendingCompute === 0}
                  value={totalResults}
                  caption={pendingCompute ? `${totals.unsaved} not computed · ${totals.stale} out of date` : 'Up to date with the scores'}
                  action={
                    permissions.compute && (
                      <Button size="small" variant={pendingCompute ? 'contained' : 'outlined'} startIcon={<Iconify icon="mdi:calculator-variant-outline" />} onClick={() => { setComputeOutcome(null); setComputeOpen(true); }}>
                        Compute drafts
                      </Button>
                    )
                  }
                />
                <Step
                  number={3}
                  title="Approved"
                  done={totalResults > 0 && totals.draft === 0}
                  value={totals.approved + totals.published}
                  caption={totals.draft ? `${totals.draft} draft(s) waiting` : 'Approved results are locked'}
                  action={
                    check(PERMISSIONS.APPROVE_RESULT) && (
                      <Button size="small" variant={totals.draft && !pendingCompute ? 'contained' : 'outlined'} color="info" disabled={!totals.draft} onClick={() => setStatusAction('approve')}>
                        Approve drafts
                      </Button>
                    )
                  }
                />
                <Step
                  number={4}
                  title="Published"
                  done={totalResults > 0 && totals.published === totalResults}
                  value={totals.published}
                  caption={totals.approved ? `${totals.approved} approved, not yet published` : 'Visible on the student portal'}
                  action={
                    check(PERMISSIONS.PUBLISH_RESULT) && (
                      <Button size="small" variant={totals.approved ? 'contained' : 'outlined'} color="success" disabled={!totals.approved} onClick={() => setStatusAction('publish')}>
                        Publish
                      </Button>
                    )
                  }
                />
              </Stack>
            </Card>

            {/* Courses */}
            <Card sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1.5, cursor: 'pointer' }} onClick={() => setShowCourses((v) => !v)}>
                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                  Courses ({meta.courses.length})
                </Typography>
                <Iconify icon={showCourses ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'} />
              </Stack>
              <Collapse in={showCourses}>
                <Box sx={{ overflowX: 'auto' }}>
                  <CourseReadiness courses={meta.courses} sessionId={sessionId} />
                </Box>
              </Collapse>
            </Card>

            {/* Broadsheet */}
            <Card>
              <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ p: 2 }}>
                <Typography variant="subtitle1">Broadsheet</Typography>
                <Typography variant="body2" color="text.secondary">
                  {meta.totalStudents} students · {[meta.program?.name, meta.classLevel?.name, semester].filter(Boolean).join(' · ')}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <TextField
                  size="small"
                  placeholder="Search name or reg no"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ width: 220 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControlLabel control={<Switch size="small" checked={showBreakdown} onChange={(e) => setShowBreakdown(e.target.checked)} />} label="Show assessment scores" />
              </Stack>
              {scheme && (
                <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ px: 2, pb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, mr: 0.5 }}>
                    {scheme.name} · pass mark {scheme.passMark}:
                  </Typography>
                  {scheme.bands.map((b) => (
                    <Chip key={b.grade} size="small" variant="outlined" color={gradeTone(b.grade, scheme)} label={`${b.grade} ${b.minScore}–${b.maxScore}`} sx={{ height: 20 }} />
                  ))}
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    Italic = computed, not saved · click a cell for details
                  </Typography>
                </Stack>
              )}
              {builderQuery.isFetching && <LinearProgress sx={{ height: 2 }} />}
              <TableContainer sx={{ maxHeight: 'calc(100vh - 220px)' }}>
                <Table stickyHeader size="small" sx={{ '& td, & th': { borderRight: 1, borderColor: 'divider', whiteSpace: 'nowrap' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ ...STICKY(0, true), minWidth: 44 }}>#</TableCell>
                      <TableCell sx={{ ...STICKY(44, true), minWidth: 120 }}>Reg No</TableCell>
                      <TableCell sx={{ minWidth: 180 }}>Name</TableCell>
                      {courseColumns.map((course) => (
                        <React.Fragment key={course.courseId}>
                          {showBreakdown &&
                            course.assessments.map((a) => (
                              <TableCell key={a.assessmentId} align="center" sx={{ minWidth: 56, bgcolor: 'grey.50' }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {a.type}
                                </Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                  /{a.maxScore}
                                </Typography>
                              </TableCell>
                            ))}
                          <TableCell align="center" sx={{ minWidth: 110 }}>
                            <Tooltip title={`${course.courseName} · ${course.credit} units`}>
                              <span>{course.courseCode}</span>
                            </Tooltip>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {course.credit} units
                            </Typography>
                          </TableCell>
                        </React.Fragment>
                      ))}
                      <TableCell align="center" sx={{ minWidth: 64 }}>GPA</TableCell>
                      <TableCell align="center" sx={{ minWidth: 64 }}>CGPA</TableCell>
                      <TableCell sx={{ minWidth: 130 }}>Class</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visible.map((student, i) => (
                      <TableRow key={student.studentId} hover>
                        <TableCell sx={{ ...STICKY(0), color: 'text.secondary' }}>{i + 1}</TableCell>
                        <TableCell sx={STICKY(44)}>{student.regNumber}</TableCell>
                        <TableCell>
                          {student.name}
                          {student.outstanding?.length > 0 && (
                            <Tooltip title={`Owes: ${student.outstanding.join(', ')}`}>
                              <Chip size="small" color="error" variant="outlined" label={`${student.outstanding.length} CO`} sx={{ ml: 0.75, height: 18 }} />
                            </Tooltip>
                          )}
                        </TableCell>
                        {student.courses.map((course) => (
                          <React.Fragment key={course.courseId}>
                            {showBreakdown &&
                              course.assessments.map((a) => (
                                <TableCell key={a.assessmentId} align="center" sx={{ color: a.score == null ? 'text.disabled' : 'text.secondary', bgcolor: 'grey.50' }}>
                                  {a.score ?? '—'}
                                </TableCell>
                              ))}
                            <ResultCell course={course} scheme={scheme} onOpen={(anchorEl) => setPopover({ anchorEl, studentId: student.studentId, courseId: course.courseId, carry: false })} />
                          </React.Fragment>
                        ))}
                        <TableCell align="center" sx={{ fontWeight: 600 }}>{formatGpa(student.gpa, scheme)}</TableCell>
                        <TableCell align="center">{formatGpa(student.cgpa, scheme)}</TableCell>
                        <TableCell>
                          {student.classification ? (
                            <Chip size="small" label={student.classification.name} color={classTone(student.classification, scheme)} variant="outlined" />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!visible.length && (
                      <TableRow>
                        <TableCell colSpan={6 + courseColumns.length} sx={{ py: 5, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            {students.length ? 'No student matches your search.' : 'No students in this class.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

            {carryOverRows.length > 0 && (
              <Card sx={{ mt: 2 }}>
                <Box sx={{ p: 2, pb: 1 }}>
                  <Typography variant="subtitle1">Carry-over courses ({carryOverRows.length})</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Courses these students failed earlier and are retaking this semester. Their results are saved as a new attempt.
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
                        <TableCell align="center">Result</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {carryOverRows.map(({ stu, course }) => (
                        <TableRow key={`${stu.studentId}-${course.courseId}`} hover>
                          <TableCell>{stu.regNumber}</TableCell>
                          <TableCell>{stu.name}</TableCell>
                          <TableCell>
                            {course.courseCode} · {course.courseName}
                          </TableCell>
                          <TableCell>{course.assessments.map((a) => `${a.type} ${a.score ?? '—'}/${a.maxScore}`).join(' · ') || '—'}</TableCell>
                          <ResultCell course={course} scheme={scheme} onOpen={(anchorEl) => setPopover({ anchorEl, studentId: stu.studentId, courseId: course.courseId, carry: true })} />
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
          </>
        )}
      </Box>

      <ResultCellPopover
        anchorEl={popover?.anchorEl}
        student={popoverStudent}
        course={popoverCourse}
        scheme={scheme}
        sessionId={sessionId}
        permissions={permissions}
        busy={busy}
        onClose={() => setPopover(null)}
        onOverride={saveOverride}
        onUseComputed={saveComputed}
        onDelete={deleteDraft}
      />

      {/* Compute drafts */}
      <Dialog open={computeOpen} onClose={() => busy !== 'compute-all' && setComputeOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Compute draft results</DialogTitle>
        <DialogContent>
          {computeOutcome ? (
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Alert severity="success">
                {computeOutcome.created + computeOutcome.updated} draft result(s) computed ({computeOutcome.created} new, {computeOutcome.updated} updated).
              </Alert>
              {computeOutcome.notes?.map((n) => (
                <Alert key={n} severity="info">
                  {n}
                </Alert>
              ))}
              {computeOutcome.errors?.map((e) => (
                <Alert key={e} severity="error">
                  {e}
                </Alert>
              ))}
            </Stack>
          ) : (
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Typography variant="body2">
                Works out every student&apos;s course totals from the saved assessment scores, for the class&apos;s courses and
                any carry-overs, and saves them as drafts graded with {scheme?.name || 'the programme’s grading scheme'}.
                Approved and published results are not touched.
              </Typography>
              <FormControlLabel
                control={<Checkbox checked={computeOptions.includeIncomplete} onChange={(e) => setComputeOptions((o) => ({ ...o, includeIncomplete: e.target.checked }))} />}
                label={<Typography variant="body2">Include students with missing scores (a missing score counts as 0)</Typography>}
              />
              <FormControlLabel
                control={<Checkbox checked={computeOptions.replaceOverrides} onChange={(e) => setComputeOptions((o) => ({ ...o, replaceOverrides: e.target.checked }))} />}
                label={<Typography variant="body2">Replace scores typed in on the broadsheet with the computed totals</Typography>}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setComputeOpen(false)} disabled={busy === 'compute-all'}>
            {computeOutcome ? 'Close' : 'Cancel'}
          </Button>
          {!computeOutcome && (
            <LoadingButton variant="contained" loading={busy === 'compute-all'} onClick={runCompute}>
              Compute drafts
            </LoadingButton>
          )}
        </DialogActions>
      </Dialog>

      {/* Approve / publish / reopen */}
      <Dialog open={Boolean(statusAction)} onClose={() => busy !== 'status' && setStatusAction(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {statusAction === 'approve' && 'Approve draft results'}
          {statusAction === 'publish' && 'Publish results'}
          {statusAction === 'reopen' && 'Reopen results'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {statusAction === 'approve' && (
              <>
                <Typography variant="body2">
                  Approve the {totals.draft} draft result(s) of this class. Approved results are locked: their scores can&apos;t
                  change unless they are reopened.
                </Typography>
                {pendingCompute > 0 && (
                  <Alert severity="warning">
                    {totals.unsaved} course total(s) have not been computed and {totals.stale} draft(s) are out of date. Compute
                    drafts first if those should be included.
                  </Alert>
                )}
              </>
            )}
            {statusAction === 'publish' && (
              <Typography variant="body2">
                Publish the {totals.approved} approved result(s). Students will see them on the student portal.
              </Typography>
            )}
            {statusAction === 'reopen' && (
              <>
                <Typography variant="body2">
                  Send this class&apos;s approved and published results back to draft so they can be corrected. Students stop
                  seeing them until they are published again.
                </Typography>
                <TextField label="Reason (recorded in the audit log)" value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} multiline minRows={2} required />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setStatusAction(null)} disabled={busy === 'status'}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            loading={busy === 'status'}
            disabled={statusAction === 'reopen' && !reopenReason.trim()}
            onClick={changeStatus}
            color={{ approve: 'info', publish: 'success', reopen: 'warning' }[statusAction] || 'primary'}
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
