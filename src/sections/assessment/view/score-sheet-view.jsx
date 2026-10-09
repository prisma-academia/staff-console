import Papa from 'papaparse';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { memo, useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Card,
  Chip,
  Link,
  Alert,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
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
  DialogTitle,
  Autocomplete,
  DialogActions,
  DialogContent,
  InputAdornment,
  LinearProgress,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';
import { gradeBg, gradeTone, courseTotal, gradeScore, describeSplit, RESULT_STATUS_COLORS } from 'src/utils/grading';

import { PERMISSIONS } from 'src/permissions/constants';
import { ResultApi, AssessmentApi } from 'src/api';

import Iconify from 'src/components/iconify';

import useScoringSession from '../use-scoring-session';
import AssessmentSetupDrawer from '../assessment-setup-drawer';

const cellKey = (studentId, assessmentId) => `${studentId}|${assessmentId}`;
const asText = (score) => (score === null || score === undefined ? '' : String(score));

/** '' (empty) is fine; anything else must be a number from 0 to max. */
const cellError = (value, max) => {
  if (value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n) || !/^\s*\d*\.?\d+\s*$/.test(value)) return 'Not a number';
  if (n < 0 || n > max) return `Must be between 0 and ${max}`;
  return null;
};

const errorText = (err, fallback) => {
  const errors = err?.data?.errors;
  if (Array.isArray(errors) && errors.length) {
    const list = errors.map((e) => (typeof e === 'string' ? e : e.message)).slice(0, 4).join('; ');
    return `${err?.data?.message || fallback}: ${list}${errors.length > 4 ? ` (+${errors.length - 4} more)` : ''}`;
  }
  return err?.data?.message || err?.message || fallback;
};

// ----------------------------------------------------------------------

/** One score cell. Memoised with stable handlers so typing re-renders only the edited cell. */
const ScoreInput = memo(({ rowIdx, colIdx, value, original, max, disabled, onCellChange, onCellKeyDown, onCellPaste }) => {
  const error = cellError(value, max);
  const changed = value !== original;
  let bg = 'transparent';
  if (error) bg = 'error.lighter';
  else if (changed) bg = 'warning.lighter';
  return (
    <Box
      component="input"
      data-cell={`${rowIdx}-${colIdx}`}
      inputMode="decimal"
      autoComplete="off"
      value={value}
      disabled={disabled}
      title={error || (changed ? `Unsaved (was ${original === '' ? 'empty' : original})` : `Out of ${max}`)}
      aria-label={`Score out of ${max}`}
      aria-invalid={Boolean(error)}
      onChange={(e) => onCellChange(rowIdx, colIdx, e.target.value)}
      onKeyDown={(e) => onCellKeyDown(rowIdx, colIdx, e)}
      onPaste={(e) => onCellPaste(rowIdx, colIdx, e)}
      onFocus={(e) => e.target.select()}
      sx={{
        width: '100%',
        height: 36,
        border: 'none',
        outline: 'none',
        textAlign: 'center',
        font: 'inherit',
        fontSize: '0.875rem',
        fontWeight: changed ? 700 : 400,
        color: error ? 'error.dark' : 'text.primary',
        bgcolor: bg,
        '&:focus': { boxShadow: (theme) => `inset 0 0 0 2px ${theme.palette.primary.main}` },
        '&:disabled': { color: 'text.disabled', bgcolor: 'transparent', cursor: 'not-allowed' },
      }}
    />
  );
});

ScoreInput.propTypes = {
  rowIdx: PropTypes.number.isRequired,
  colIdx: PropTypes.number.isRequired,
  value: PropTypes.string.isRequired,
  original: PropTypes.string.isRequired,
  max: PropTypes.number.isRequired,
  disabled: PropTypes.bool,
  onCellChange: PropTypes.func.isRequired,
  onCellKeyDown: PropTypes.func.isRequired,
  onCellPaste: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

function CoursePicker({ value, onChange, courses, loading, size = 'medium', sx }) {
  const options = useMemo(
    () => [...courses].sort((a, b) => Number(b.isMine) - Number(a.isMine) || a.code.localeCompare(b.code)),
    [courses]
  );
  return (
    <Autocomplete
      size={size}
      options={options}
      loading={loading}
      value={options.find((c) => c._id === value) || null}
      onChange={(_, course) => course && onChange(course._id)}
      groupBy={(c) => (c.isMine ? 'My courses' : 'Other courses')}
      getOptionLabel={(c) => `${c.code} · ${c.name}`}
      isOptionEqualToValue={(a, b) => a._id === b._id}
      renderOption={(props, c) => (
        <li {...props} key={c._id}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2">
              <b>{c.code}</b> · {c.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {[c.classLevel?.name, c.semester, c.setup?.ok ? `${Math.min(c.scoresComplete, c.students)}/${c.students} scored` : 'not set up'].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => <TextField {...params} label="Course" placeholder="Type a course code or title" />}
      sx={sx}
    />
  );
}

CoursePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  courses: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  size: PropTypes.string,
  sx: PropTypes.object,
};

// ----------------------------------------------------------------------

function ComputeDialog({ open, onClose, sheet, onDone }) {
  const { enqueueSnackbar } = useSnackbar();
  const [includeIncomplete, setIncludeIncomplete] = useState(false);
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState(null);

  useEffect(() => {
    if (open) {
      setOutcome(null);
      setIncludeIncomplete(false);
    }
  }, [open]);

  const run = async () => {
    setRunning(true);
    try {
      const data = await ResultApi.compute({ sessionId: sheet.session.id, courseId: sheet.course.id, includeIncomplete });
      setOutcome(data);
      onDone();
    } catch (err) {
      enqueueSnackbar(errorText(err, 'Could not compute results'), { variant: 'error' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !running && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Compute results for {sheet?.course?.code}</DialogTitle>
      <DialogContent>
        {outcome ? (
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Alert severity="success">
              {outcome.created + outcome.updated} draft result(s) computed ({outcome.created} new, {outcome.updated} updated).
            </Alert>
            {outcome.notes?.map((n) => (
              <Alert key={n} severity="info">
                {n}
              </Alert>
            ))}
            {outcome.errors?.map((e) => (
              <Alert key={e} severity="error">
                {e}
              </Alert>
            ))}
            <Typography variant="body2" color="text.secondary">
              The exam officer approves and publishes them from the Results page.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2">
              Works out each student&apos;s course total from the saved scores and grades it with their programme&apos;s
              grading scheme. The results are saved as <b>drafts</b>; nothing is visible to students until it is
              approved and published.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approved or published results and scores typed in on the broadsheet are left alone. Run this again any
              time scores change.
            </Typography>
            <FormControlLabel
              control={<Checkbox checked={includeIncomplete} onChange={(e) => setIncludeIncomplete(e.target.checked)} />}
              label={<Typography variant="body2">Include students with missing scores (a missing score counts as 0)</Typography>}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={running}>
          {outcome ? 'Close' : 'Cancel'}
        </Button>
        {!outcome && (
          <LoadingButton variant="contained" loading={running} onClick={run}>
            Compute drafts
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

ComputeDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sheet: PropTypes.object,
  onDone: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

const FILTERS = [
  { id: 'all', label: 'All students' },
  { id: 'missing', label: 'Missing scores' },
  { id: 'changed', label: 'Unsaved changes' },
  { id: 'errors', label: 'Errors' },
  { id: 'carry', label: 'Carry-overs' },
];

export default function ScoreSheetView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { check } = usePermissions();
  const [params, setParams] = useSearchParams();
  const courseId = params.get('courseId') || '';
  const { sessionId, sessions, setSessionId } = useScoringSession();

  const [edits, setEdits] = useState({}); // cellKey -> text, only cells that differ from the saved score
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [computeOpen, setComputeOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const tableRef = useRef(null);
  const fileRef = useRef(null);

  // An old link may carry a session: follow it once
  const linkedSession = params.get('sessionId');
  useEffect(() => {
    if (linkedSession && sessions.some((s) => s._id === linkedSession)) setSessionId(linkedSession);
  }, [linkedSession, sessions, setSessionId]);

  const coursesQuery = useQuery({
    queryKey: ['assessment-overview', sessionId, 'picker'],
    queryFn: () => AssessmentApi.getCourseOverview({ sessionId }),
    enabled: Boolean(sessionId),
    staleTime: 60 * 1000,
  });
  const courses = coursesQuery.data?.courses ?? [];

  const sheetQuery = useQuery({
    queryKey: ['score-sheet', courseId, sessionId],
    queryFn: () => AssessmentApi.getScoreSheet({ courseId, sessionId }),
    enabled: Boolean(courseId && sessionId),
  });
  const sheet = sheetQuery.data || null;
  const assessments = useMemo(() => sheet?.assessments ?? [], [sheet]);
  const canEdit = Boolean(sheet?.access?.canEdit) && check(PERMISSIONS.EDIT_ASSESSMENT_SCORES);

  // Unsaved edits belong to one course and session
  useEffect(() => {
    setEdits({});
  }, [courseId, sessionId]);

  const dirtyCount = Object.keys(edits).length;

  useEffect(() => {
    if (!dirtyCount) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirtyCount]);

  const confirmDiscard = () => !dirtyCount || window.confirm(`Discard ${dirtyCount} unsaved change(s)?`);

  const changeCourse = (id) => {
    if (id === courseId || !confirmDiscard()) return;
    const next = new URLSearchParams(params);
    next.set('courseId', id);
    next.delete('sessionId');
    setParams(next);
  };

  // ------------------------------------------------------------------
  // Rows with live totals

  const rows = useMemo(() => {
    if (!sheet) return [];
    return sheet.students.map((s) => {
      const original = {};
      s.scores.forEach((sc) => {
        original[sc.assessmentId] = asText(sc.score);
      });
      const values = {};
      let invalid = 0;
      let changed = 0;
      assessments.forEach((a) => {
        const key = cellKey(s.studentId, a._id);
        values[a._id] = key in edits ? edits[key] : original[a._id] ?? '';
        if (key in edits) changed += 1;
        if (cellError(values[a._id], a.maxScore)) invalid += 1;
      });
      const numeric = {};
      Object.entries(values).forEach(([aid, v]) => {
        numeric[aid] = v === '' || cellError(v, Infinity) ? null : Number(v);
      });
      const total = courseTotal(assessments, numeric);
      const scheme = sheet.schemes?.[s.programId] || null;
      const graded = total.total != null ? gradeScore(total.total, scheme) : null;
      const stale = s.result?.status === 'draft' && !s.result.isOverride && graded && total.complete && graded.score !== s.result.score;
      return { ...s, original, values, invalid, changed, total, graded, scheme, stale };
    });
  }, [sheet, assessments, edits]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (term && !`${r.regNumber} ${r.name}`.toLowerCase().includes(term)) return false;
      if (filter === 'missing') return !r.total.complete;
      if (filter === 'changed') return r.changed > 0;
      if (filter === 'errors') return r.invalid > 0;
      if (filter === 'carry') return r.isCarryOver;
      return true;
    });
  }, [rows, search, filter]);

  const stats = useMemo(() => {
    const graded = rows.filter((r) => r.graded);
    const complete = rows.filter((r) => r.total.complete).length;
    const invalid = rows.reduce((n, r) => n + r.invalid, 0);
    const average = graded.length ? graded.reduce((sum, r) => sum + r.total.total, 0) / graded.length : null;
    const passed = graded.filter((r) => r.graded.isPass).length;
    const grades = {};
    graded.forEach((r) => {
      grades[r.graded.grade] = (grades[r.graded.grade] || 0) + 1;
    });
    const results = { draft: 0, approved: 0, published: 0 };
    rows.forEach((r) => {
      if (r.result) results[r.result.status] += 1;
    });
    return { complete, invalid, average, passed, graded: graded.length, grades, results, locked: rows.filter((r) => r.locked).length, stale: rows.filter((r) => r.stale).length };
  }, [rows]);

  // ------------------------------------------------------------------
  // Editing

  // Handlers read the latest rows through refs so they stay stable for ScoreInput
  const visibleRef = useRef(visible);
  const assessmentsRef = useRef(assessments);
  const editsRef = useRef(edits);
  visibleRef.current = visible;
  assessmentsRef.current = assessments;
  editsRef.current = edits;

  /** Applies cell values ([row, assessment, text]); a value equal to the saved score drops the edit. */
  const applyValues = useCallback((changes) => {
    const next = { ...editsRef.current };
    changes.forEach(([row, a, raw]) => {
      const value = raw.trim();
      const key = cellKey(row.studentId, a._id);
      if (value === (row.original[a._id] ?? '')) delete next[key];
      else next[key] = value;
    });
    setEdits(next);
  }, []);

  const onCellChange = useCallback(
    (rowIdx, colIdx, value) => {
      const row = visibleRef.current[rowIdx];
      const a = assessmentsRef.current[colIdx];
      if (row && a) applyValues([[row, a, value]]);
    },
    [applyValues]
  );

  const focusCell = (row, col) => {
    const el = tableRef.current?.querySelector(`[data-cell="${row}-${col}"]:not(:disabled)`);
    if (!el) return false;
    el.focus();
    return true;
  };

  const onCellKeyDown = useCallback(
    (rowIdx, colIdx, e) => {
      const { key, shiftKey, target } = e;
      const rowCount = visibleRef.current.length;
      let moved = false;
      if (key === 'Enter' || key === 'ArrowDown' || key === 'ArrowUp') {
        const step = key === 'ArrowUp' || (key === 'Enter' && shiftKey) ? -1 : 1;
        for (let r = rowIdx + step; r >= 0 && r < rowCount && !moved; r += step) moved = focusCell(r, colIdx);
        e.preventDefault();
      } else if (key === 'ArrowRight' && target.selectionStart === target.value.length) {
        moved = focusCell(rowIdx, colIdx + 1);
      } else if (key === 'ArrowLeft' && target.selectionEnd === 0) {
        moved = focusCell(rowIdx, colIdx - 1);
      } else if (key === 'Escape') {
        const row = visibleRef.current[rowIdx];
        const a = assessmentsRef.current[colIdx];
        if (row && a) applyValues([[row, a, row.original[a._id] ?? '']]);
      }
      if (moved) e.preventDefault();
    },
    [applyValues]
  );

  /** Pasting a block copied from a spreadsheet fills cells down and to the right. */
  const onCellPaste = useCallback(
    (rowIdx, colIdx, e) => {
      const text = e.clipboardData?.getData('text') ?? '';
      if (!/[\t\n]/.test(text.trim())) return;
      e.preventDefault();
      const lines = text.replace(/\r/g, '').replace(/\n+$/, '').split('\n');
      const changes = [];
      let skipped = 0;
      lines.forEach((line, r) => {
        const row = visibleRef.current[rowIdx + r];
        if (!row) return;
        line.split('\t').forEach((raw, c) => {
          const a = assessmentsRef.current[colIdx + c];
          if (!a) return;
          if (row.locked) skipped += 1;
          else changes.push([row, a, raw]);
        });
      });
      applyValues(changes);
      enqueueSnackbar(`Pasted ${changes.length} score(s)${skipped ? `; ${skipped} skipped on locked rows` : ''}. Review, then save.`, { variant: 'info' });
    },
    [applyValues, enqueueSnackbar]
  );

  const saveMutation = useMutation({
    mutationFn: (body) => AssessmentApi.saveScoreSheet(body),
    onSuccess: (data) => {
      enqueueSnackbar(`Saved ${data?.saved ?? 0} score(s)${data?.cleared ? `, cleared ${data.cleared}` : ''}`, { variant: 'success' });
      setEdits({});
      queryClient.invalidateQueries({ queryKey: ['score-sheet', courseId, sessionId] });
      queryClient.invalidateQueries({ queryKey: ['assessment-overview'] });
    },
    onError: (err) => enqueueSnackbar(errorText(err, 'Could not save the scores'), { variant: 'error', autoHideDuration: 10000 }),
  });

  const save = useCallback(() => {
    if (!dirtyCount || stats.invalid || saveMutation.isPending || !sheet) return;
    const byStudent = new Map();
    Object.entries(edits).forEach(([key, value]) => {
      const [studentId, assessmentId] = key.split('|');
      if (!byStudent.has(studentId)) byStudent.set(studentId, []);
      byStudent.get(studentId).push({ assessmentId, score: value === '' ? null : Number(value) });
    });
    saveMutation.mutate({
      sessionId: sheet.session.id,
      courseId: sheet.course.id,
      rows: [...byStudent.entries()].map(([studentId, assessmentScores]) => ({ studentId, assessmentScores })),
    });
  }, [dirtyCount, stats.invalid, saveMutation, sheet, edits]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);

  // ------------------------------------------------------------------
  // CSV

  const exportCsv = () => {
    const fields = ['Reg No', 'Name', ...assessments.map((a) => `${a.type} (/${a.maxScore})`), 'Total', 'Grade'];
    const data = rows.map((r) => [
      r.regNumber,
      r.name,
      ...assessments.map((a) => r.values[a._id]),
      r.total.total ?? '',
      r.graded?.grade ?? '',
    ]);
    const blob = new Blob([Papa.unparse({ fields, data })], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sheet.course.code}-${sheet.session.code || sheet.session.name}-scores.csv`.replace(/[\\/:*?"<>|\s]+/g, '_');
    link.click();
    URL.revokeObjectURL(url);
  };

  const importCsv = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        const headers = meta.fields || [];
        const regHeader = headers.find((h) => /reg/i.test(h));
        if (!regHeader) {
          enqueueSnackbar('The file needs a "Reg No" column', { variant: 'error' });
          return;
        }
        const norm = (h) => h.toLowerCase().replace(/[^a-z0-9]/g, '');
        const columns = assessments
          .map((a) => ({ a, header: headers.find((h) => norm(h).startsWith(norm(a.type))) }))
          .filter((c) => c.header);
        if (!columns.length) {
          enqueueSnackbar(`No assessment columns found. Use headings like ${assessments.map((a) => a.type).join(', ')}.`, { variant: 'error' });
          return;
        }
        const byReg = new Map(rows.map((r) => [r.regNumber.trim().toLowerCase(), r]));
        const unknown = [];
        let students = 0;
        let lockedRows = 0;
        const next = { ...edits };
        data.forEach((line) => {
          const reg = String(line[regHeader] || '').trim();
          if (!reg) return;
          const row = byReg.get(reg.toLowerCase());
          if (!row) { unknown.push(reg); return; }
          if (row.locked) { lockedRows += 1; return; }
          let touched = false;
          columns.forEach(({ a, header }) => {
            const value = String(line[header] ?? '').trim();
            if (value === '') return;
            const key = cellKey(row.studentId, a._id);
            if (value === (row.original[a._id] ?? '')) delete next[key];
            else next[key] = value;
            touched = true;
          });
          if (touched) students += 1;
        });
        setEdits(next);
        const notes = [`Imported scores for ${students} student(s) from ${columns.map((c) => c.a.type).join(', ')}`];
        if (unknown.length) notes.push(`${unknown.length} reg number(s) not on this sheet: ${unknown.slice(0, 5).join(', ')}${unknown.length > 5 ? '…' : ''}`);
        if (lockedRows) notes.push(`${lockedRows} locked student(s) skipped`);
        enqueueSnackbar(`${notes.join('. ')}. Review, then save.`, { variant: unknown.length ? 'warning' : 'info', autoHideDuration: 10000 });
      },
      error: (err) => enqueueSnackbar(err?.message || 'Could not read the file', { variant: 'error' }),
    });
  };

  // ------------------------------------------------------------------

  const setupCourse = sheet && {
    _id: sheet.course.id,
    code: sheet.course.code,
    name: sheet.course.name,
    credit: sheet.course.credit,
    semester: sheet.course.semester,
    classLevel: sheet.course.classLevel,
    assessments,
    results: stats.results,
  };

  const sessionSelect = (
    <Select size="small" value={sessionId} onChange={(e) => confirmDiscard() && setSessionId(e.target.value)} sx={{ minWidth: 180 }}>
      {sessions.map((s) => (
        <MenuItem key={s._id} value={s._id}>
          {s.name || s.code}
          {s.isCurrent ? ' (current)' : ''}
        </MenuItem>
      ))}
    </Select>
  );

  // No course yet: pick one
  if (!courseId) {
    return (
      <Container maxWidth="md">
        <Box sx={{ pt: 6, pb: 6 }}>
          <Typography variant="h4">Score entry</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            Choose a course to open its score sheet.
          </Typography>
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="subtitle2" sx={{ width: 80 }}>
                  Session
                </Typography>
                {sessionSelect}
              </Stack>
              <CoursePicker courses={courses} loading={coursesQuery.isLoading} onChange={changeCourse} />
              <Typography variant="caption" color="text.secondary">
                Lecturers see the courses they are assigned to. <Link component="button" variant="caption" onClick={() => navigate('/assessment')}>Browse all courses</Link>
              </Typography>
            </Stack>
          </Card>
        </Box>
      </Container>
    );
  }

  const pctComplete = rows.length ? Math.round((stats.complete / rows.length) * 100) : 0;
  const canCompute = check(PERMISSIONS.ADD_RESULT) && sheet?.setup?.ok;

  return (
    <Container maxWidth="xl">
      <Box sx={{ pt: 3, pb: dirtyCount ? 12 : 5 }}>
        <Button size="small" color="inherit" startIcon={<Iconify icon="eva:arrow-back-fill" />} onClick={() => confirmDiscard() && navigate('/assessment')} sx={{ mb: 1 }}>
          Assessments
        </Button>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ md: 'flex-start' }} sx={{ mb: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" noWrap>
              {sheet ? `${sheet.course.code} · ${sheet.course.name}` : 'Score sheet'}
            </Typography>
            {sheet && (
              <Typography variant="body2" color="text.secondary">
                {[
                  sheet.course.classLevel?.name,
                  sheet.course.semester,
                  `${sheet.course.credit} units`,
                  sheet.course.programs.map((p) => p.code || p.name).join(', '),
                  sheet.course.instructors.length ? `Lecturer: ${sheet.course.instructors.join(', ')}` : null,
                ].filter(Boolean).join(' · ')}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CoursePicker size="small" value={courseId} courses={courses} loading={coursesQuery.isLoading} onChange={changeCourse} sx={{ width: 280 }} />
            {sessionSelect}
          </Stack>
        </Stack>

        {sheetQuery.isLoading && <LinearProgress />}
        {sheetQuery.isError && <Alert severity="error">{errorText(sheetQuery.error, 'Could not load the score sheet')}</Alert>}

        {sheet && (
          <>
            {/* Summary */}
            <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Stack direction={{ xs: 'column', lg: 'row' }} spacing={{ xs: 2, lg: 4 }} divider={<Box sx={{ borderLeft: { lg: 1 }, borderColor: 'divider' }} />}>
                <Box sx={{ minWidth: 220 }}>
                  <Typography variant="overline" color="text.secondary">
                    Assessments
                  </Typography>
                  <Typography variant="body2">{assessments.length ? describeSplit(assessments) : 'Not set up'}</Typography>
                  <Link component="button" variant="caption" onClick={() => setSetupOpen(true)}>
                    {check(PERMISSIONS.EDIT_ASSESSMENT) ? 'Change setup' : 'View setup'}
                  </Link>
                </Box>
                <Box sx={{ minWidth: 220 }}>
                  <Typography variant="overline" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="body2">
                    {stats.complete} of {rows.length} students fully scored
                  </Typography>
                  <LinearProgress variant="determinate" value={pctComplete} color={pctComplete === 100 ? 'success' : 'primary'} sx={{ height: 6, borderRadius: 3, mt: 0.75 }} />
                </Box>
                <Box sx={{ minWidth: 200 }}>
                  <Typography variant="overline" color="text.secondary">
                    Class performance
                  </Typography>
                  <Typography variant="body2">
                    {stats.average != null ? `Average ${stats.average.toFixed(1)} · ${stats.passed}/${stats.graded} passing` : 'No totals yet'}
                  </Typography>
                  <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                    {Object.entries(stats.grades)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([grade, n]) => (
                        <Chip key={grade} size="small" label={`${grade} ${n}`} color={gradeTone(grade, Object.values(sheet.schemes)[0])} variant="outlined" sx={{ height: 20 }} />
                      ))}
                  </Stack>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="overline" color="text.secondary">
                    Results
                  </Typography>
                  <Stack direction="row" gap={0.5} flexWrap="wrap" alignItems="center">
                    {['draft', 'approved', 'published'].map((s) =>
                      stats.results[s] ? <Chip key={s} size="small" color={RESULT_STATUS_COLORS[s]} label={`${stats.results[s]} ${s}`} /> : null
                    )}
                    {!stats.results.draft && !stats.results.approved && !stats.results.published && (
                      <Typography variant="body2" color="text.secondary">
                        None computed yet
                      </Typography>
                    )}
                  </Stack>
                  {stats.stale > 0 && (
                    <Typography variant="caption" color="warning.dark">
                      {stats.stale} draft(s) out of date — compute again
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Card>

            {!sheet.setup.ok && (
              <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => setSetupOpen(true)}>Fix setup</Button>}>
                {sheet.setup.errors[0]}. Scores can be entered, but no totals or results until the setup is fixed.
              </Alert>
            )}
            {Object.entries(sheet.schemeErrors || {}).map(([pid, message]) => (
              <Alert key={pid} severity="warning" sx={{ mb: 2 }}>
                {message}
              </Alert>
            ))}
            {!canEdit && (
              <Alert severity="info" sx={{ mb: 2 }}>
                You can view this score sheet. Only the course&apos;s lecturers and exam officers can change it.
              </Alert>
            )}
            {stats.locked > 0 && canEdit && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {stats.locked} student(s) have approved or published results; their scores are locked until the results are reopened.
              </Alert>
            )}

            {/* Toolbar */}
            <Card>
              <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ p: 2 }}>
                <TextField
                  size="small"
                  placeholder="Search name or reg no"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ width: 240 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Stack direction="row" gap={0.75} flexWrap="wrap">
                  {FILTERS.map((f) => (
                    <Chip
                      key={f.id}
                      label={f.label}
                      size="small"
                      color={filter === f.id ? 'primary' : 'default'}
                      variant={filter === f.id ? 'filled' : 'outlined'}
                      onClick={() => setFilter(f.id)}
                    />
                  ))}
                </Stack>
                <Box sx={{ flex: 1 }} />
                <Button size="small" color="inherit" startIcon={<Iconify icon="eva:download-outline" />} onClick={exportCsv} disabled={!rows.length}>
                  Export CSV
                </Button>
                {canEdit && (
                  <>
                    <Tooltip title="Upload a CSV with a Reg No column and one column per assessment (e.g. the exported file). Nothing is saved until you press Save.">
                      <Button size="small" color="inherit" startIcon={<Iconify icon="eva:upload-outline" />} onClick={() => fileRef.current?.click()} disabled={!rows.length}>
                        Import CSV
                      </Button>
                    </Tooltip>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      hidden
                      onChange={(e) => {
                        if (e.target.files?.[0]) importCsv(e.target.files[0]);
                        e.target.value = '';
                      }}
                    />
                  </>
                )}
                {canCompute && (
                  <Tooltip title={dirtyCount ? 'Save your changes first' : 'Create or update draft results from these scores'}>
                    <span>
                      <Button size="small" variant="outlined" startIcon={<Iconify icon="mdi:calculator-variant-outline" />} disabled={dirtyCount > 0 || !stats.graded} onClick={() => setComputeOpen(true)}>
                        Compute results
                      </Button>
                    </span>
                  </Tooltip>
                )}
                {canEdit && (
                  <LoadingButton size="small" variant="contained" startIcon={<Iconify icon="eva:save-fill" />} loading={saveMutation.isPending} disabled={!dirtyCount || stats.invalid > 0} onClick={save}>
                    Save{dirtyCount ? ` (${dirtyCount})` : ''}
                  </LoadingButton>
                )}
              </Stack>

              {canEdit && rows.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, pb: 1 }}>
                  Type a score and press Enter to move down. Arrow keys move between cells, Esc undoes a cell, Ctrl+S saves.
                  You can paste a block of scores copied from Excel.
                </Typography>
              )}

              <TableContainer ref={tableRef} sx={{ maxHeight: 'calc(100vh - 260px)' }}>
                <Table stickyHeader size="small" sx={{ '& td, & th': { borderRight: 1, borderColor: 'divider' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 48, position: 'sticky', left: 0, zIndex: 3 }}>#</TableCell>
                      <TableCell sx={{ minWidth: 130, position: 'sticky', left: 48, zIndex: 3 }}>Reg No</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>Name</TableCell>
                      {assessments.map((a) => (
                        <TableCell key={a._id} align="center" sx={{ minWidth: 88 }}>
                          {a.type}
                          <Typography variant="caption" display="block" color="text.secondary">
                            out of {a.maxScore}
                            {a.weight && Number(a.weight) !== Number(a.maxScore) ? ` · ${a.weight}%` : ''}
                          </Typography>
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{ minWidth: 80 }}>
                        Total
                        <Typography variant="caption" display="block" color="text.secondary">
                          out of 100
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 64 }}>
                        Grade
                      </TableCell>
                      <TableCell sx={{ minWidth: 130 }}>Result</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visible.map((row, rowIdx) => (
                      <TableRow key={row.studentId} hover sx={{ bgcolor: row.locked ? 'grey.50' : undefined }}>
                        <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1, color: 'text.secondary' }}>{rowIdx + 1}</TableCell>
                        <TableCell sx={{ position: 'sticky', left: 48, bgcolor: 'background.paper', zIndex: 1, whiteSpace: 'nowrap' }}>{row.regNumber}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography variant="body2" noWrap sx={{ maxWidth: 220 }} title={row.name}>
                              {row.name}
                            </Typography>
                            {row.isCarryOver && (
                              <Tooltip title="Carry-over: retaking this course from a higher level">
                                <Chip size="small" label="CO" color="error" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                              </Tooltip>
                            )}
                            {row.locked && (
                              <Tooltip title="Result approved or published: reopen it on the Results page to change scores">
                                <Iconify icon="eva:lock-fill" width={14} sx={{ color: 'text.disabled' }} />
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                        {assessments.map((a, colIdx) => (
                          <TableCell key={a._id} sx={{ p: 0 }}>
                            <ScoreInput
                              rowIdx={rowIdx}
                              colIdx={colIdx}
                              value={row.values[a._id]}
                              original={row.original[a._id] ?? ''}
                              max={a.maxScore}
                              disabled={!canEdit || row.locked}
                              onCellChange={onCellChange}
                              onCellKeyDown={onCellKeyDown}
                              onCellPaste={onCellPaste}
                            />
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <Tooltip title={!row.total.complete && row.total.missing?.length && row.total.total != null ? `Missing: ${row.total.missing.join(', ')} (counted as 0)` : ''}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: row.total.complete ? 'text.primary' : 'text.disabled' }}>
                              {row.total.total != null ? row.total.total : '—'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center" sx={{ bgcolor: row.total.complete ? gradeBg(row.graded?.grade, row.scheme) : undefined }}>
                          {row.graded ? (
                            <Chip size="small" label={row.graded.grade} color={gradeTone(row.graded.grade, row.scheme)} variant={row.total.complete ? 'filled' : 'outlined'} sx={{ minWidth: 36 }} />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {row.result ? (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Chip size="small" label={row.result.status} color={RESULT_STATUS_COLORS[row.result.status]} variant="outlined" sx={{ height: 20 }} />
                              <Typography variant="caption">
                                {row.result.score} {row.result.grade}
                              </Typography>
                              {row.result.isOverride && (
                                <Tooltip title="The exam officer set this score on the broadsheet">
                                  <Iconify icon="eva:edit-2-fill" width={14} sx={{ color: 'info.main' }} />
                                </Tooltip>
                              )}
                              {row.stale && (
                                <Tooltip title="Scores changed since this draft was computed; compute results again">
                                  <Iconify icon="eva:alert-triangle-fill" width={14} sx={{ color: 'warning.main' }} />
                                </Tooltip>
                              )}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              Not computed
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!visible.length && (
                      <TableRow>
                        <TableCell colSpan={6 + assessments.length} sx={{ py: 5, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            {rows.length ? 'No student matches this filter.' : 'No students are registered in this course’s class.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </>
        )}
      </Box>

      {/* Sticky save bar */}
      {dirtyCount > 0 && (
        <Card
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1200,
            px: 2.5,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderRadius: 2,
          }}
        >
          <Iconify icon="eva:edit-2-fill" sx={{ color: 'warning.main' }} />
          <Typography variant="body2">
            <b>{dirtyCount}</b> unsaved change{dirtyCount === 1 ? '' : 's'}
            {stats.invalid > 0 && (
              <Typography component="span" variant="body2" color="error.main">
                {' '}· fix {stats.invalid} invalid score{stats.invalid === 1 ? '' : 's'}
              </Typography>
            )}
          </Typography>
          <Button size="small" color="inherit" onClick={() => setEdits({})}>
            Discard
          </Button>
          <LoadingButton size="small" variant="contained" loading={saveMutation.isPending} disabled={stats.invalid > 0} onClick={save}>
            Save changes
          </LoadingButton>
        </Card>
      )}

      <ComputeDialog
        open={computeOpen}
        sheet={sheet}
        onClose={() => setComputeOpen(false)}
        onDone={() => {
          queryClient.invalidateQueries({ queryKey: ['score-sheet', courseId, sessionId] });
          queryClient.invalidateQueries({ queryKey: ['assessment-overview'] });
        }}
      />
      <AssessmentSetupDrawer
        open={setupOpen}
        course={setupCourse}
        readOnly={!check(PERMISSIONS.EDIT_ASSESSMENT)}
        onClose={() => setSetupOpen(false)}
        onSaved={() => {
          setEdits({});
          queryClient.invalidateQueries({ queryKey: ['score-sheet', courseId, sessionId] });
          queryClient.invalidateQueries({ queryKey: ['assessment-overview'] });
        }}
      />
    </Container>
  );
}
