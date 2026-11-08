import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Card,
  Chip,
  Alert,
  Paper,
  Stack,
  Table,
  alpha,
  Button,
  Tooltip,
  Skeleton,
  TableRow,
  useTheme,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  Autocomplete,
  InputAdornment,
  TableContainer,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';
import { gradeTone, gradeScore } from 'src/utils/grading';

import { ResitApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

import { formatDate } from 'src/sections/fee/fee-format';
import { ResitMarker } from 'src/sections/result/result-markers';
import RevisionDialog from 'src/sections/result/table/revision-dialog';

import { formatPrice } from './resit-format';
import useResitCatalogue from './use-resit-catalogue';
import RegisterResitDialog from './register-resit-dialog';
import { WaiveResitDialog } from './resit-action-dialogs';

// ----------------------------------------------------------------------

/** Payment state of a row that still needs a resit score (entitlement.state from the API). */
const PAYMENT_STATES = {
  paid: { label: 'Paid', color: 'success' },
  waived: { label: 'Fee waived', color: 'info' },
  no_fee: { label: 'No fee needed', color: 'default' },
  pending_payment: { label: 'Awaiting payment', color: 'warning' },
  not_registered: { label: 'Not registered', color: 'error' },
  cancelled: { label: 'Not registered', color: 'error' },
};

// Each student is in exactly one of the first three views
const VIEWS = [
  { value: 'ready', label: 'Ready to record' },
  { value: 'waiting', label: 'Waiting for payment' },
  { value: 'recorded', label: 'Resit recorded' },
  { value: 'all', label: 'All' },
];

const viewOf = (row) => {
  if (row.status === 'recorded') return 'recorded';
  return row.entitlement?.entitled ? 'ready' : 'waiting';
};

const parseScore = (text) => {
  const value = String(text ?? '').trim();
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : NaN;
};

const courseLabel = (course) => (course ? `${course.code} · ${course.name}` : '');

/** Moves focus to the next open score box, so a column of scores can be typed with Enter. */
const focusNext = (current) => {
  const inputs = [...document.querySelectorAll('input[data-resit-input]')].filter((el) => !el.disabled);
  const next = inputs[inputs.indexOf(current) + 1];
  if (next) next.focus();
};

/** A broadsheet-style score and grade: "30 F". */
function ScoreGrade({ score, grade, scheme, isResit }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 22, textAlign: 'right' }}>
        {score ?? '—'}
      </Typography>
      {grade && (
        <Chip
          size="small"
          label={grade}
          color={gradeTone(grade, scheme)}
          sx={{ height: 20, minWidth: 30 }}
        />
      )}
      {isResit && (
        <Tooltip title="Resit score">
          <ResitMarker />
        </Tooltip>
      )}
    </Stack>
  );
}

ScoreGrade.propTypes = {
  score: PropTypes.number,
  grade: PropTypes.string,
  scheme: PropTypes.object,
  isResit: PropTypes.bool,
};

// ----------------------------------------------------------------------

/**
 * The resit score sheet: pick a course, see every student who failed it with whether
 * their resit is paid for, type the resit scores and save them together. Each score
 * replaces the failed score on the original result; the old one stays in its history.
 */
export default function ResitScoresTab({ courseId, onCourseChange }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { check } = usePermissions();
  const canRecord = check(PERMISSIONS.REVISE_RESULT);
  const canManage = check(PERMISSIONS.MANAGE_RESIT);
  const catalogue = useResitCatalogue();

  const [drafts, setDrafts] = useState({}); // resultId -> typed text
  const [rowErrors, setRowErrors] = useState({}); // resultId -> refusal from the API
  const [reason, setReason] = useState('');
  const [view, setView] = useState('ready');
  const [search, setSearch] = useState('');
  const [waiving, setWaiving] = useState(null);
  const [registering, setRegistering] = useState(null);
  const [history, setHistory] = useState(null);

  const sheetQuery = useQuery({
    queryKey: ['resit', 'sheet', courseId],
    queryFn: () => ResitApi.getSheet(courseId),
    enabled: Boolean(courseId),
  });
  const sheet = sheetQuery.data;
  const rows = useMemo(() => sheet?.rows ?? [], [sheet]);
  const schemes = sheet?.schemes || {};

  // A new course starts clean
  useEffect(() => {
    setDrafts({});
    setRowErrors({});
    setSearch('');
    setView('ready');
  }, [courseId]);

  useEffect(() => {
    if (sheet && !reason) {
      setReason(`Resit examination${sheet.session?.name ? ` — ${sheet.session.name}` : ''}`);
    }
  }, [sheet, reason]);

  const counts = useMemo(() => {
    const out = { ready: 0, waiting: 0, recorded: 0, all: rows.length };
    rows.forEach((row) => {
      out[viewOf(row)] += 1;
    });
    return out;
  }, [rows]);

  // A course opens on the students whose resit can be recorded, else on everyone
  useEffect(() => {
    if (!sheet) return;
    const ready = sheet.rows.some((row) => viewOf(row) === 'ready');
    setView((current) => (current === 'ready' && !ready ? 'all' : current));
  }, [sheet]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (term && !`${row.student.regNumber} ${row.student.name}`.toLowerCase().includes(term)) return false;
      return view === 'all' || viewOf(row) === view;
    });
  }, [rows, search, view]);

  // Typed scores, checked
  const entries = useMemo(() => {
    const valid = [];
    let invalid = 0;
    rows.forEach((row) => {
      const text = drafts[row.result._id];
      if (text === undefined || String(text).trim() === '') return;
      const score = parseScore(text);
      if (Number.isNaN(score) || row.status !== 'to_record' || !row.entitlement?.entitled) invalid += 1;
      else valid.push({ resultId: row.result._id, score });
    });
    return { valid, invalid };
  }, [rows, drafts]);
  const dirty = entries.valid.length + entries.invalid;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['resit'] });
    queryClient.invalidateQueries({ queryKey: ['result-revisions'] });
    queryClient.invalidateQueries({ queryKey: ['student-academic-summary'] });
  };

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => ResitApi.saveScores({ reason: reason.trim(), entries: entries.valid }),
    onSuccess: (out) => {
      const results = out?.rows || [];
      const failed = results.filter((r) => !r.ok);
      setRowErrors(Object.fromEntries(failed.map((r) => [r.resultId, r.message])));
      setDrafts((prev) => {
        const next = { ...prev };
        results.filter((r) => r.ok).forEach((r) => delete next[r.resultId]);
        return next;
      });
      const recorded = out?.recorded ?? results.length - failed.length;
      if (recorded) {
        enqueueSnackbar(`${recorded} resit score${recorded === 1 ? '' : 's'} recorded`, { variant: 'success' });
      }
      if (failed.length) {
        enqueueSnackbar(`${failed.length} not recorded; see the highlighted rows`, { variant: 'warning' });
      }
      invalidate();
    },
    onError: (error) =>
      enqueueSnackbar(error?.data?.message || error.message || 'Could not save the resit scores', { variant: 'error' }),
  });

  const setDraft = (resultId, value) => {
    setDrafts((prev) => ({ ...prev, [resultId]: value }));
    if (rowErrors[resultId]) {
      setRowErrors((prev) => {
        const next = { ...prev };
        delete next[resultId];
        return next;
      });
    }
  };

  const courseOptions = useMemo(
    () =>
      [...catalogue.courses].sort(
        (a, b) =>
          String(a.classLevel?.name || '').localeCompare(String(b.classLevel?.name || '')) ||
          String(a.code).localeCompare(String(b.code))
      ),
    [catalogue.courses]
  );
  const pickedCourse = courseOptions.find((c) => c.courseId === courseId) || null;

  // ------------------------------------------------------------------ cells

  const paymentCell = (row) => {
    if (row.status === 'recorded') {
      return <Label color="success">Resit recorded</Label>;
    }
    const ent = row.entitlement || {};
    const state = PAYMENT_STATES[ent.state] || { label: ent.state || '—', color: 'default' };
    const label = ent.state === 'pending_payment' && ent.registration?.paymentStarted ? 'Paying' : state.label;
    return (
      <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
        <Tooltip title={ent.message || ''}>
          <Label color={state.color}>{label}</Label>
        </Tooltip>
        {canManage && ent.state === 'pending_payment' && ent.registration && (
          <Button
            size="small"
            color="primary"
            onClick={() => setWaiving({ ...ent.registration, student: row.student })}
            sx={{ minWidth: 0, px: 1, fontWeight: 600 }}
          >
            Waive
          </Button>
        )}
        {canManage && ent.state === 'not_registered' && (
          <Button
            size="small"
            color="primary"
            onClick={() =>
              setRegistering({
                _id: row.student._id,
                regNumber: row.student.regNumber,
                personalInfo: { firstName: row.student.name },
              })
            }
            sx={{ minWidth: 0, px: 1, fontWeight: 600 }}
          >
            Register
          </Button>
        )}
      </Stack>
    );
  };

  const scoreCell = (row, index) => {
    const scheme = schemes[row.schemeKey];
    if (row.status === 'recorded') {
      const recordedAt = row.result.failedBefore?.recordedAt || row.result.lastRevisedAt;
      return (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <ScoreGrade score={row.result.score} grade={row.result.grade} scheme={scheme} isResit />
          <Tooltip title={`History (${row.result.revisionCount}): the failed score, who replaced it and why`}>
            <IconButton size="small" onClick={() => setHistory(row)} sx={{ color: 'secondary.main' }}>
              <Iconify icon="mdi:history" width={18} />
            </IconButton>
          </Tooltip>
          {recordedAt && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {formatDate(recordedAt)}
            </Typography>
          )}
        </Stack>
      );
    }
    const entitled = Boolean(row.entitlement?.entitled);
    const text = drafts[row.result._id] ?? '';
    const score = parseScore(text);
    const bad = Number.isNaN(score);
    const preview = score != null && !bad ? gradeScore(score, scheme) : null;
    const error = rowErrors[row.result._id];
    if (!canRecord || !entitled) {
      const why = !canRecord
        ? 'Recording resit scores needs the revise result permission'
        : `${row.entitlement?.message || 'Not entitled to a resit yet'}.`;
      return (
        <Tooltip title={why} placement="left">
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.disabled' }}>
            <Iconify icon="eva:lock-outline" width={16} />
            <Typography variant="caption">{canRecord ? 'Pay or waive first' : 'View only'}</Typography>
          </Stack>
        </Tooltip>
      );
    }

    return (
      <Stack spacing={0.25}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
                size="small"
                value={text}
                placeholder="0–100"
                onChange={(e) => setDraft(row.result._id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    focusNext(e.target);
                  }
                }}
                onWheel={(e) => e.currentTarget.querySelector('input')?.blur()}
                disabled={saving}
                error={bad || Boolean(error)}
                inputProps={{
                  inputMode: 'decimal',
                  'data-resit-input': index,
                  'aria-label': `Resit score for ${row.student.regNumber}`,
                  style: { textAlign: 'center' },
                }}
                sx={{ width: 84 }}
              />
          {preview && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Iconify icon="eva:arrow-forward-fill" width={14} sx={{ color: 'text.disabled' }} />
              <Chip
                size="small"
                label={preview.grade}
                color={gradeTone(preview.grade, scheme)}
                sx={{ height: 20, minWidth: 30 }}
              />
              <Typography variant="caption" color={preview.isPass ? 'success.main' : 'error.main'}>
                {preview.isPass ? 'pass' : 'still failed'}
              </Typography>
            </Stack>
          )}
        </Stack>
        {bad && (
          <Typography variant="caption" color="error.main">
            A number from 0 to 100
          </Typography>
        )}
        {error && (
          <Typography variant="caption" color="error.main" sx={{ maxWidth: 280 }}>
            {error}
          </Typography>
        )}
      </Stack>
    );
  };

  // ------------------------------------------------------------------ render

  const renderBody = () => {
    if (!courseId) {
      return (
        <Card sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
          <Iconify icon="mdi:restore" width={44} sx={{ color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" gutterBottom>
            Pick a course to enter resit scores
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, mx: 'auto' }}>
            Every student who failed the course is listed with whether their resit is paid for. A
            resit score replaces the failed score on the original result and is marked as a resit;
            the failed score stays in the result&apos;s history.
          </Typography>
        </Card>
      );
    }
    if (sheetQuery.isLoading) {
      return (
        <Card sx={{ p: 2 }}>
          <Stack spacing={1}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={44} />
            ))}
          </Stack>
        </Card>
      );
    }
    if (sheetQuery.isError) {
      return (
        <Alert severity="error">
          {sheetQuery.error?.data?.message || sheetQuery.error?.message || 'Could not load the resit sheet'}
        </Alert>
      );
    }
    if (!rows.length) {
      return (
        <Alert severity="success">
          Nobody has a failed published result for {sheet?.course?.code || 'this course'}.
        </Alert>
      );
    }

    return (
      <Card
        sx={{
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)},
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          sx={{ p: 2 }}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {VIEWS.map((v) => (
              <Chip
                key={v.value}
                label={`${v.label} · ${counts[v.value] || 0}`}
                color={view === v.value ? 'primary' : 'default'}
                variant={view === v.value ? 'filled' : 'outlined'}
                onClick={() => setView(v.value)}
              />
            ))}
          </Stack>
          <TextField
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reg number or name..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { md: 280 } }}
          />
        </Stack>

        <TableContainer sx={{ maxHeight: { md: 'calc(100vh - 360px)' }, minHeight: 200 }}>
          <Table size="small" stickyHeader sx={{ minWidth: 860 }}>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Failed in</TableCell>
                <TableCell>Failed score</TableCell>
                <TableCell>Resit fee</TableCell>
                <TableCell sx={{ minWidth: 220 }}>Resit score</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!visible.length && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ py: 5, textAlign: 'center', color: 'text.secondary' }}>
                    {view === 'ready' && !search
                      ? 'No student has a paid or waived resit for this course waiting for a score.'
                      : 'No students in this view.'}
                  </TableCell>
                </TableRow>
              )}
              {visible.map((row, index) => {
                const scheme = schemes[row.schemeKey];
                const hasDraft = String(drafts[row.result._id] ?? '').trim() !== '';
                return (
                  <TableRow
                    key={row.result._id}
                    hover
                    sx={{
                      ...(hasDraft && { bgcolor: alpha(theme.palette.warning.main, 0.06) }),
                      ...(rowErrors[row.result._id] && { bgcolor: alpha(theme.palette.error.main, 0.06) }),
                    }}
                  >
                    <TableCell>
                      <Typography variant="subtitle2" noWrap>
                        {row.student.name || 'Unknown'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {row.student.regNumber}
                        {row.student.classLevel?.name ? ` · now ${row.student.classLevel.name}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {row.result.session?.name || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {row.result.semester}
                        {row.result.classLevel?.name ? ` · ${row.result.classLevel.name}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {row.result.failedBefore ? (
                        <Stack spacing={0.25}>
                          <ScoreGrade
                            score={row.result.failedBefore.score}
                            grade={row.result.failedBefore.grade}
                            scheme={scheme}
                          />
                          {row.status === 'recorded' ? (
                            <Typography variant="caption" color="text.secondary">
                              Replaced by the resit
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="warning.dark">
                              Resat: {row.result.score} {row.result.grade}, still failed
                            </Typography>
                          )}
                        </Stack>
                      ) : (
                        <ScoreGrade
                          score={row.result.score}
                          grade={row.result.grade}
                          scheme={scheme}
                          isResit={row.result.isResit}
                        />
                      )}
                    </TableCell>
                    <TableCell>{paymentCell(row)}</TableCell>
                    <TableCell>{scoreCell(row, index)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
      >
        <Tooltip title={dirty ? 'Save or discard the typed scores first' : ''}>
          <Box sx={{ flex: 1, maxWidth: { md: 520 } }}>
            <Autocomplete
              value={pickedCourse}
              options={courseOptions}
              loading={catalogue.isLoading}
              disabled={dirty > 0 || saving}
              groupBy={(option) => option.classLevel?.name || 'No class level'}
              getOptionLabel={courseLabel}
              isOptionEqualToValue={(a, b) => a.courseId === b.courseId}
              onChange={(_, value) => onCourseChange(value ? value.courseId : '')}
              renderOption={(props, option) => (
                <li {...props} key={option.courseId}>
                  <Stack sx={{ minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {courseLabel(option)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {option.semester}
                      {option.effectivePrice != null ? ` · resit fee ${formatPrice(option.effectivePrice)}` : ' · no resit fee'}
                    </Typography>
                  </Stack>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} size="small" label="Course" placeholder="Search code or title" />
              )}
            />
          </Box>
        </Tooltip>
        {sheet?.course && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <Chip
              size="small"
              variant="outlined"
              label={[sheet.course.semester, sheet.course.classLevel?.name].filter(Boolean).join(' · ')}
            />
            <Chip
              size="small"
              color={sheet.price != null ? 'primary' : 'default'}
              variant="outlined"
              icon={<Iconify icon="mdi:tag-outline" width={16} />}
              label={
                sheet.price != null
                  ? `Resit fee ${formatPrice(sheet.price)}${sheet.session?.name ? ` in ${sheet.session.name}` : ''}`
                  : 'No resit fee: students need not pay'
              }
            />
          </Stack>
        )}
      </Stack>

      {renderBody()}

      {/* Save bar: stays in view while scores are typed */}
      {dirty > 0 && (
        <Paper
          elevation={12}
          sx={{
            position: 'sticky',
            bottom: 16,
            zIndex: 5,
            p: 2,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Box sx={{ minWidth: 180 }}>
              <Typography variant="subtitle2">
                {entries.valid.length} resit score{entries.valid.length === 1 ? '' : 's'} to save
              </Typography>
              {entries.invalid > 0 && (
                <Typography variant="caption" color="error.main">
                  Fix {entries.invalid} score{entries.invalid === 1 ? '' : 's'} first
                </Typography>
              )}
              {!entries.invalid && (
                <Typography variant="caption" color="text.secondary">
                  Students see them at once
                </Typography>
              )}
            </Box>
            <TextField
              size="small"
              label="Reason (kept in each result's history)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              inputProps={{ maxLength: 1000 }}
              disabled={saving}
              sx={{ flex: 1 }}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                color="inherit"
                disabled={saving}
                onClick={() => {
                  setDrafts({});
                  setRowErrors({});
                }}
              >
                Discard
              </Button>
              <LoadingButton
                variant="contained"
                color="secondary"
                loading={saving}
                disabled={!entries.valid.length || entries.invalid > 0 || !reason.trim()}
                onClick={() => save()}
                startIcon={<Iconify icon="mdi:restore" />}
              >
                Save {entries.valid.length || ''} resit score{entries.valid.length === 1 ? '' : 's'}
              </LoadingButton>
            </Stack>
          </Stack>
        </Paper>
      )}

      <WaiveResitDialog registration={waiving} onClose={() => setWaiving(null)} />
      {canManage && (
        <RegisterResitDialog
          open={Boolean(registering)}
          initialStudent={registering}
          onClose={() => setRegistering(null)}
        />
      )}
      <RevisionDialog
        open={Boolean(history)}
        resultId={history?.result?._id}
        student={history?.student}
        course={
          history
            ? {
                courseCode: sheet?.course?.code,
                courseName: sheet?.course?.name,
                finalScore: history.result.score,
                finalGrade: history.result.grade,
                status: 'published',
                isPass: history.result.isPass,
                isResit: history.result.isResit,
              }
            : null
        }
        scheme={history ? schemes[history.schemeKey] : null}
        canRevise={canRecord}
        view="history"
        onClose={() => setHistory(null)}
        onRevised={(message) => {
          enqueueSnackbar(message, { variant: 'success' });
          setHistory(null);
          invalidate();
        }}
      />
    </Stack>
  );
}

ResitScoresTab.propTypes = {
  courseId: PropTypes.string,
  onCourseChange: PropTypes.func.isRequired,
};
