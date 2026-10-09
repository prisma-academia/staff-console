import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Select,
  Switch,
  Tooltip,
  Checkbox,
  MenuItem,
  TableRow,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  InputAdornment,
  LinearProgress,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { describeSplit } from 'src/utils/grading';
import { usePermissions } from 'src/utils/permissions';
import { toProgrammeOptions } from 'src/utils/format-programme';

import { PERMISSIONS } from 'src/permissions/constants';
import { programApi, AssessmentApi, classLevelApi } from 'src/api';

import Iconify from 'src/components/iconify';

import ApplySplitDialog from '../apply-split-dialog';
import useScoringSession from '../use-scoring-session';
import AssessmentSetupDrawer from '../assessment-setup-drawer';

const SEMESTERS = ['First Semester', 'Second Semester'];

/** Where a course is in the assessment -> scores -> results pipeline. */
export function courseStage(course) {
  if (!course.setup?.ok) return 'setup';
  if (!course.students) return 'no-students';
  if (course.results.published && course.results.published >= course.students) return 'published';
  if (course.results.approved + course.results.published >= course.students) return 'approved';
  if (course.results.draft + course.results.approved + course.results.published > 0) return 'drafted';
  if (course.scoresComplete >= course.students) return 'scored';
  if (course.scoresStarted > 0) return 'scoring';
  return 'ready';
}

const STAGES = {
  setup: { label: 'Needs setup', color: 'error' },
  'no-students': { label: 'No students', color: 'default' },
  ready: { label: 'Ready for scores', color: 'default' },
  scoring: { label: 'Scoring', color: 'warning' },
  scored: { label: 'Scores complete', color: 'info' },
  drafted: { label: 'Results drafted', color: 'info' },
  approved: { label: 'Approved', color: 'primary' },
  published: { label: 'Published', color: 'success' },
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'setup', label: 'Needs setup' },
  { id: 'scoring', label: 'Scores outstanding', stages: ['ready', 'scoring'] },
  { id: 'scored', label: 'Ready to compute', stages: ['scored'] },
  { id: 'results', label: 'Results in progress', stages: ['drafted', 'approved'] },
  { id: 'published', label: 'Published' },
];

function StepCard({ number, title, value, caption, active = false, onClick }) {
  return (
    <Card
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 2,
        flex: 1,
        minWidth: 200,
        cursor: onClick ? 'pointer' : 'default',
        borderColor: active ? 'primary.main' : 'divider',
        bgcolor: active ? 'primary.lighter' : 'background.paper',
        transition: 'border-color .15s',
        '&:hover': onClick ? { borderColor: 'primary.main' } : undefined,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {number}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2">{title}</Typography>
          <Typography variant="h5" sx={{ lineHeight: 1.2 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {caption}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

StepCard.propTypes = {
  number: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.node,
  caption: PropTypes.node,
  active: PropTypes.bool,
  onClick: PropTypes.func,
};

export default function AssessmentHubView() {
  const navigate = useNavigate();
  const { check } = usePermissions();
  const [params, setParams] = useSearchParams();
  const { sessionId, session, sessions, setSessionId } = useScoringSession();

  const canSeeAll = check(PERMISSIONS.VIEW_ASSESSMENT) || check(PERMISSIONS.VIEW_RESULT);
  const canEditSetup = check(PERMISSIONS.EDIT_ASSESSMENT);

  const programId = params.get('programId') || '';
  const classLevelId = params.get('classLevelId') || '';
  const semester = params.get('semester') || '';
  const mine = params.get('mine') === 'true' || !canSeeAll;
  const filter = params.get('filter') || 'all';
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [setupCourse, setSetupCourse] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setSelected([]);
  };

  const { data: programs } = useQuery({ queryKey: ['programs'], queryFn: programApi.getPrograms, enabled: canSeeAll });
  const { data: classLevels } = useQuery({ queryKey: ['classLevels'], queryFn: classLevelApi.getClassLevels, enabled: canSeeAll });
  const programOptions = useMemo(() => toProgrammeOptions(programs), [programs]);

  const overviewQuery = useQuery({
    queryKey: ['assessment-overview', sessionId, programId, classLevelId, semester, mine],
    queryFn: () => AssessmentApi.getCourseOverview({ sessionId, programId, classLevelId, semester, mine: mine ? 'true' : '' }),
    enabled: Boolean(sessionId),
  });
  const courses = useMemo(() => overviewQuery.data?.courses ?? [], [overviewQuery.data]);

  const counts = useMemo(() => {
    const byStage = {};
    let students = 0;
    let complete = 0;
    courses.forEach((c) => {
      const stage = courseStage(c);
      byStage[stage] = (byStage[stage] || 0) + 1;
      if (c.setup?.ok) {
        students += c.students;
        complete += Math.min(c.scoresComplete, c.students);
      }
    });
    return { byStage, students, complete };
  }, [courses]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const active = FILTERS.find((f) => f.id === filter) || FILTERS[0];
    return courses.filter((c) => {
      if (term && !`${c.code} ${c.name}`.toLowerCase().includes(term)) return false;
      if (active.id === 'all') return true;
      const stage = courseStage(c);
      return active.stages ? active.stages.includes(stage) : stage === active.id;
    });
  }, [courses, search, filter]);

  const allSelected = visible.length > 0 && visible.every((c) => selected.includes(c._id));
  const toggleAll = () => setSelected(allSelected ? [] : visible.map((c) => c._id));
  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const scoreSheetLink = (course) => `/assessment/scores?courseId=${course._id}`;
  const resultsLink = (course) => {
    const q = new URLSearchParams({ classId: course.classLevel?._id || '', semester: course.semester });
    if (course.programs?.length === 1) q.set('programId', course.programs[0]._id);
    return `/result?${q.toString()}`;
  };

  let emptyMessage = 'No courses found.';
  if (courses.length) emptyMessage = 'No course matches these filters.';
  else if (mine) emptyMessage = 'You are not listed as an instructor on any course. Ask an administrator to assign you to your courses.';

  const needsSetup = counts.byStage.setup || 0;
  const resultsStarted = ['drafted', 'approved', 'published'].reduce((n, s) => n + (counts.byStage[s] || 0), 0);

  return (
    <Container maxWidth="xl">
      <Box sx={{ pt: 4, pb: 6 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }} justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4">Assessments</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
              Set up how each course is assessed, enter scores, then compute results for approval. Pick a course to
              open its score sheet.
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

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <StepCard
            number={1}
            title="Set up assessments"
            value={needsSetup ? `${needsSetup} to set up` : 'All set'}
            caption={`${courses.length} course(s) in view`}
            active={filter === 'setup'}
            onClick={() => setParam('filter', filter === 'setup' ? '' : 'setup')}
          />
          <StepCard
            number={2}
            title="Enter scores"
            value={counts.students ? `${Math.round((counts.complete / counts.students) * 100)}%` : '—'}
            caption={`${counts.complete} of ${counts.students} student scores complete`}
            active={filter === 'scoring'}
            onClick={() => setParam('filter', filter === 'scoring' ? '' : 'scoring')}
          />
          <StepCard
            number={3}
            title="Compile results"
            value={`${resultsStarted} course(s)`}
            caption={`${counts.byStage.scored || 0} ready to compute · ${counts.byStage.published || 0} published`}
            active={filter === 'scored'}
            onClick={() => setParam('filter', filter === 'scored' ? '' : 'scored')}
          />
        </Stack>

        <Card>
          <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ p: 2 }}>
            <TextField
              size="small"
              placeholder="Search course code or title"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 240, flex: { xs: 1, md: 'none' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            {canSeeAll && (
              <>
                <TextField select size="small" label="Programme" value={programId} onChange={(e) => setParam('programId', e.target.value)} sx={{ minWidth: 200 }}>
                  <MenuItem value="">All programmes</MenuItem>
                  {programOptions.map((p) => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField select size="small" label="Class level" value={classLevelId} onChange={(e) => setParam('classLevelId', e.target.value)} sx={{ minWidth: 150 }}>
                  <MenuItem value="">All levels</MenuItem>
                  {(classLevels || []).map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            )}
            <TextField select size="small" label="Semester" value={semester} onChange={(e) => setParam('semester', e.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value="">Both semesters</MenuItem>
              {SEMESTERS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            {canSeeAll && (
              <FormControlLabel
                control={<Switch checked={mine} onChange={(e) => setParam('mine', e.target.checked ? 'true' : '')} />}
                label="Only courses I teach"
              />
            )}
          </Stack>

          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ px: 2, pb: 2 }}>
            {FILTERS.map((f) => {
              const n = f.id === 'all'
                ? courses.length
                : (f.stages || [f.id]).reduce((sum, s) => sum + (counts.byStage[s] || 0), 0);
              return (
                <Chip
                  key={f.id}
                  label={`${f.label} · ${n}`}
                  color={filter === f.id ? 'primary' : 'default'}
                  variant={filter === f.id ? 'filled' : 'outlined'}
                  onClick={() => setParam('filter', f.id === 'all' ? '' : f.id)}
                />
              );
            })}
          </Stack>

          {selected.length > 0 && (
            <Stack direction="row" alignItems="center" spacing={2} sx={{ px: 2, py: 1.25, bgcolor: 'primary.lighter' }}>
              <Typography variant="subtitle2" sx={{ flex: 1 }}>
                {selected.length} course(s) selected
              </Typography>
              <Button size="small" onClick={() => setSelected([])} color="inherit">
                Clear
              </Button>
              <Button size="small" variant="contained" startIcon={<Iconify icon="mdi:tune-variant" />} onClick={() => setApplyOpen(true)}>
                Set up assessments
              </Button>
            </Stack>
          )}

          {overviewQuery.isFetching && <LinearProgress sx={{ height: 2 }} />}
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {canEditSetup && (
                    <TableCell padding="checkbox">
                      <Checkbox size="small" checked={allSelected} indeterminate={selected.length > 0 && !allSelected} onChange={toggleAll} />
                    </TableCell>
                  )}
                  <TableCell>Course</TableCell>
                  <TableCell>Assessments</TableCell>
                  <TableCell sx={{ minWidth: 180 }}>Scores</TableCell>
                  <TableCell>Results</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((course) => {
                  const stage = courseStage(course);
                  const pct = course.students ? Math.round((Math.min(course.scoresComplete, course.students) / course.students) * 100) : 0;
                  return (
                    <TableRow key={course._id} hover selected={selected.includes(course._id)}>
                      {canEditSetup && (
                        <TableCell padding="checkbox">
                          <Checkbox size="small" checked={selected.includes(course._id)} onChange={() => toggle(course._id)} />
                        </TableCell>
                      )}
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2">{course.code}</Typography>
                          {course.isMine && <Chip size="small" label="Mine" variant="outlined" sx={{ height: 20 }} />}
                        </Stack>
                        <Typography variant="body2" noWrap title={course.name}>
                          {course.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {[course.classLevel?.name, course.semester, `${course.credit} units`].filter(Boolean).join(' · ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {course.setup?.ok ? (
                          <Stack spacing={0.25}>
                            <Typography variant="body2">{describeSplit(course.assessments)}</Typography>
                            {course.setup.warnings?.[0] && (
                              <Typography variant="caption" color="warning.dark">
                                {course.setup.warnings[0]}
                              </Typography>
                            )}
                          </Stack>
                        ) : (
                          <Tooltip title={course.setup?.errors?.join(' · ') || ''}>
                            <Chip
                              size="small"
                              color="error"
                              variant="outlined"
                              icon={<Iconify icon="eva:alert-circle-fill" width={16} />}
                              label={course.assessments.length ? 'Fix setup' : 'Not set up'}
                              onClick={() => setSetupCourse(course)}
                            />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        {course.setup?.ok && course.students > 0 ? (
                          <Box>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="caption">
                                {Math.min(course.scoresComplete, course.students)} / {course.students} complete
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {pct}%
                              </Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={pct} color={pct === 100 ? 'success' : 'primary'} sx={{ height: 6, borderRadius: 3, my: 0.5 }} />
                            {course.scoresStarted > course.scoresComplete && (
                              <Typography variant="caption" color="text.secondary">
                                {course.scoresStarted - course.scoresComplete} partly scored
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {course.students ? '—' : 'No students in this class'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" gap={0.5} flexWrap="wrap">
                          <Chip size="small" label={STAGES[stage].label} color={STAGES[stage].color} variant={stage === 'published' ? 'filled' : 'outlined'} />
                          {course.results.draft > 0 && stage !== 'drafted' && <Chip size="small" label={`${course.results.draft} draft`} variant="outlined" />}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" color="inherit" onClick={() => setSetupCourse(course)} startIcon={<Iconify icon="mdi:tune-variant" width={18} />}>
                            {canEditSetup ? 'Setup' : 'View setup'}
                          </Button>
                          {['drafted', 'approved', 'published'].includes(stage) && canSeeAll && (
                            <Button size="small" color="inherit" onClick={() => navigate(resultsLink(course))}>
                              Results
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant={stage === 'ready' || stage === 'scoring' ? 'contained' : 'outlined'}
                            disabled={!course.setup?.ok}
                            onClick={() => navigate(scoreSheetLink(course))}
                            startIcon={<Iconify icon="mdi:table-edit" width={18} />}
                          >
                            Scores
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!overviewQuery.isLoading && visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {emptyMessage}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {session && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, py: 1.5 }}>
              Score progress and results are for {session.name || session.code}. Assessment setups apply to every session.
            </Typography>
          )}
        </Card>
      </Box>

      <AssessmentSetupDrawer
        open={Boolean(setupCourse)}
        course={setupCourse}
        readOnly={!canEditSetup}
        onClose={() => setSetupCourse(null)}
        onSaved={() => overviewQuery.refetch()}
      />
      <ApplySplitDialog
        open={applyOpen}
        courses={courses.filter((c) => selected.includes(c._id))}
        onClose={() => setApplyOpen(false)}
        onDone={() => overviewQuery.refetch()}
      />
    </Container>
  );
}
