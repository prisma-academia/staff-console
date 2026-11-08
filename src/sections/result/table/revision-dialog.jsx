import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Chip,
  Alert,
  Radio,
  Stack,
  Button,
  Dialog,
  Divider,
  Tooltip,
  TextField,
  RadioGroup,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  LinearProgress,
  FormControlLabel,
} from '@mui/material';

import { fToNow, fDateTime } from 'src/utils/format-time';
import { gradeTone, gradeScore, RESULT_STATUS_COLORS } from 'src/utils/grading';

import { ResultApi } from 'src/api';

import Iconify from 'src/components/iconify';

import { ResitMarker } from '../result-markers';

const KINDS = {
  correction: { label: 'Correction', color: 'info', icon: 'eva:edit-2-outline' },
  resit: { label: 'Resit', color: 'secondary', icon: 'mdi:restore' },
  reopen: { label: 'Reopened', color: 'warning', icon: 'eva:unlock-outline' },
};

const LOCKED = ['approved', 'published'];

const errorText = (err, fallback) => err?.data?.message || err?.message || fallback;

const scoreText = (snapshot) =>
  snapshot ? `${snapshot.score ?? '—'}${snapshot.grade ? ` ${snapshot.grade}` : ''}` : '—';

/** One entry of the history: kind, before → after, reason, who and when. */
function RevisionRow({ revision }) {
  const kind = KINDS[revision.kind] || {
    label: revision.kind,
    color: 'default',
    icon: 'eva:edit-outline',
  };
  const { before, after } = revision;
  const statusChanged = before?.status && after?.status && before.status !== after.status;
  return (
    <Stack direction="row" spacing={1.5} sx={{ py: 1.5 }}>
      <Box
        sx={{
          width: 30,
          height: 30,
          flexShrink: 0,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'grey.100',
          color: kind.color === 'default' ? 'text.secondary' : `${kind.color}.main`,
        }}
      >
        <Iconify icon={kind.icon} width={16} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip
            size="small"
            variant="outlined"
            color={kind.color}
            label={kind.label}
            sx={{ height: 20 }}
          />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {scoreText(before)} → {scoreText(after)}
          </Typography>
          {statusChanged && (
            <Typography variant="caption" color="text.secondary">
              {before.status} → {after.status}
            </Typography>
          )}
        </Stack>
        {revision.reason && (
          <Box
            sx={{
              mt: 0.75,
              pl: 1.25,
              borderLeft: 2,
              borderColor: `${kind.color === 'default' ? 'grey' : kind.color}.main`,
            }}
          >
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              “{revision.reason}”
            </Typography>
          </Box>
        )}
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {revision.changedBy?.name || 'Someone'}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            ·
          </Typography>
          <Tooltip title={fDateTime(revision.createdAt)}>
            <Typography variant="caption" color="text.disabled">
              {fToNow(revision.createdAt)}
            </Typography>
          </Tooltip>
        </Stack>
      </Box>
    </Stack>
  );
}

RevisionRow.propTypes = { revision: PropTypes.object.isRequired };

/**
 * Changes the score of an approved or published result in place (a correction, or
 * the score of a resit of a failed course) and lists every change made to it after
 * it was locked. Opened from a broadsheet cell or the resit score sheet; `view`
 * 'history' starts on the history alone, `initialKind` 'resit' starts on a resit.
 */
export default function RevisionDialog({
  open,
  resultId,
  student,
  course,
  scheme,
  canRevise,
  view = 'change',
  initialKind = 'correction',
  onClose,
  onRevised,
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(view);
  const [kind, setKind] = useState(initialKind);
  const [score, setScore] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode(view);
    setKind(initialKind);
    setScore('');
    setReason('');
    setError('');
  }, [open, resultId, view, initialKind]);

  const query = useQuery({
    queryKey: ['result-revisions', resultId],
    queryFn: () => ResultApi.getRevisions(resultId),
    enabled: open && Boolean(resultId),
  });
  const info = query.data?.result;
  const revisions = query.data?.revisions || [];
  const resit = query.data?.resit || null;

  // The server's copy once loaded; the broadsheet row until then
  const current = {
    score: info ? info.score : course?.finalScore,
    grade: info ? info.grade : course?.finalGrade,
    status: info ? info.status : course?.status,
    isPass: info ? info.isPass : course?.isPass,
    isResit: info ? info.isResit : course?.isResit,
  };
  const locked = LOCKED.includes(current.status);
  const failed = current.isPass === false;
  const changing = canRevise && locked && mode === 'change';

  // A resit only replaces a failed result
  useEffect(() => {
    if (!failed && kind === 'resit') setKind('correction');
  }, [failed, kind]);

  const n = Number(score);
  const validScore = score.trim() !== '' && Number.isFinite(n) && n >= 0 && n <= 100;
  const preview = validScore ? gradeScore(n, scheme) : null;
  const sameScore = kind === 'correction' && preview && preview.score === current.score;
  const resitBlocked = kind === 'resit' && (!resit || !resit.entitled);
  const canSubmit =
    changing &&
    Boolean(info) &&
    validScore &&
    Boolean(reason.trim()) &&
    !sameScore &&
    !resitBlocked &&
    !busy;

  const courseCode = info?.course?.code || course?.courseCode || '';
  const courseName = info?.course?.name || course?.courseName || '';
  const studentName = info?.student?.name || student?.name || '';
  const regNumber = info?.student?.regNumber || student?.regNumber || '';

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const out = await ResultApi.revise(resultId, { score: n, reason: reason.trim(), kind });
      const { before, after } = out?.revision || {};
      // Same wording as the API's message, which the client does not pass back
      const verb = kind === 'resit' ? 'Resit score recorded' : 'Score changed';
      const message =
        before && after
          ? `${verb}: ${courseCode} ${before.score} (${before.grade}) → ${after.score} (${after.grade})`
          : verb;
      queryClient.invalidateQueries({ queryKey: ['result-revisions', resultId] });
      queryClient.invalidateQueries({ queryKey: ['student-academic-summary'] });
      onRevised(message);
    } catch (err) {
      setError(errorText(err, 'Could not change the score'));
      // The resit entitlement may have changed meanwhile
      queryClient.invalidateQueries({ queryKey: ['result-revisions', resultId] });
    } finally {
      setBusy(false);
    }
  };

  let resitAlert = null;
  if (changing && kind === 'resit') {
    if (query.isLoading) resitAlert = <LinearProgress sx={{ height: 2 }} />;
    else if (!resit) {
      resitAlert = (
        <Alert severity="warning">Could not check whether this student may record a resit.</Alert>
      );
    } else if (resit.entitled) {
      resitAlert = (
        <Alert severity={resit.registration ? 'success' : 'info'}>
          {resit.message}.{' '}
          {resit.registration
            ? 'Recording this resit uses up that registration (one payment covers one resit).'
            : 'The resit can be recorded without a payment.'}
        </Alert>
      );
    } else {
      resitAlert = (
        <Alert severity="warning">
          <strong>{resit.message}.</strong> A resit fee is set for this course, so the student must
          pay it from the student portal before the resit score can be recorded. Staff who manage
          resits can also register the student and waive the fee under Courses › Resit registrations.
        </Alert>
      );
    }
  }

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>
        {!changing && 'Score history'}
        {changing && (kind === 'resit' ? 'Record a resit score' : 'Correct a locked score')}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {/* The result */}
          <Box>
            <Typography variant="subtitle2">
              {studentName}
              {regNumber && (
                <Typography component="span" variant="body2" color="text.secondary">
                  {' '}
                  · {regNumber}
                </Typography>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {courseCode}
              {courseName ? ` · ${courseName}` : ''}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mt: 1 }}
              flexWrap="wrap"
              useFlexGap
            >
              <Typography variant="body2">Current score:</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {current.score ?? '—'}
              </Typography>
              {current.grade && (
                <Chip
                  size="small"
                  label={current.grade}
                  color={gradeTone(current.grade, scheme)}
                  sx={{ height: 20, minWidth: 30 }}
                />
              )}
              {current.status && (
                <Chip
                  size="small"
                  label={current.status}
                  color={RESULT_STATUS_COLORS[current.status] || 'default'}
                  sx={{ height: 20 }}
                />
              )}
              {current.isResit && (
                <Tooltip title="Resit score">
                  <ResitMarker />
                </Tooltip>
              )}
              {current.isPass === false && (
                <Typography variant="caption" color="error.main">
                  fail
                </Typography>
              )}
            </Stack>
          </Box>

          {query.isError && (
            <Alert severity="warning">{errorText(query.error, 'Could not load the history')}</Alert>
          )}

          {/* Change the score */}
          {changing && (
            <>
              <Divider />
              {/* A resit only replaces a failed result */}
              {failed && (
                <RadioGroup row value={kind} onChange={(e) => setKind(e.target.value)}>
                  <FormControlLabel
                    value="correction"
                    control={<Radio size="small" />}
                    label="Correction"
                  />
                  <FormControlLabel value="resit" control={<Radio size="small" />} label="Resit" />
                </RadioGroup>
              )}
              <Typography variant="body2" color="text.secondary">
                {kind === 'resit'
                  ? 'Record the score of the resit. It replaces the failed score, and the result is marked as a resit.'
                  : 'Fix a wrong score. The result keeps its status; the old score stays in the history.'}
              </Typography>
              {resitAlert}

              <Stack direction="row" spacing={2} alignItems="flex-start">
                <TextField
                  size="small"
                  label="New score"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  error={score !== '' && !validScore}
                  helperText={score !== '' && !validScore ? 'A number from 0 to 100' : '0–100'}
                  inputProps={{ inputMode: 'decimal' }}
                  sx={{ width: 140 }}
                  autoFocus
                />
                <Box sx={{ pt: 1 }}>
                  {preview ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        Becomes
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {preview.score}
                      </Typography>
                      <Chip
                        size="small"
                        label={preview.grade}
                        color={gradeTone(preview.grade, scheme)}
                        sx={{ height: 20, minWidth: 30 }}
                      />
                      <Typography
                        variant="caption"
                        color={preview.isPass ? 'success.main' : 'error.main'}
                      >
                        {preview.isPass ? 'pass' : 'fail'}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      {scheme
                        ? `Graded with ${scheme.name}`
                        : 'Graded with the result’s grading scheme when saved'}
                    </Typography>
                  )}
                  {sameScore && (
                    <Typography variant="caption" color="warning.dark" sx={{ display: 'block' }}>
                      That is the current score.
                    </Typography>
                  )}
                  {kind === 'resit' && preview && !preview.isPass && (
                    <Typography variant="caption" color="warning.dark" sx={{ display: 'block' }}>
                      The course is still failed with this score.
                    </Typography>
                  )}
                </Box>
              </Stack>

              <TextField
                label="Reason (kept in the history)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                minRows={2}
                required
                inputProps={{ maxLength: 1000 }}
              />

              {current.status === 'published' && (
                <Typography variant="caption" color="text.secondary">
                  This result is published: the student sees the new score straight away. Staff can
                  still see the old one here.
                </Typography>
              )}
              {error && <Alert severity="error">{error}</Alert>}
            </>
          )}

          {/* History */}
          <Divider />
          <Box>
            <Typography variant="subtitle2">
              Changes after it was locked{revisions.length ? ` (${revisions.length})` : ''}
            </Typography>
            {query.isLoading && <LinearProgress sx={{ mt: 1, height: 2 }} />}
            {!query.isLoading && !query.isError && !revisions.length && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                No changes since this result was locked.
              </Typography>
            )}
            {revisions.map((revision, index) => (
              <Box key={revision._id}>
                {index > 0 && <Divider />}
                <RevisionRow revision={revision} />
              </Box>
            ))}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        {!changing && canRevise && locked && (
          <Button
            startIcon={<Iconify icon="eva:edit-2-outline" />}
            onClick={() => setMode('change')}
            sx={{ mr: 'auto' }}
          >
            Change score
          </Button>
        )}
        <Button color="inherit" onClick={onClose} disabled={busy}>
          {changing ? 'Cancel' : 'Close'}
        </Button>
        {changing && (
          <LoadingButton
            variant="contained"
            color={kind === 'resit' ? 'secondary' : 'primary'}
            loading={busy}
            disabled={!canSubmit}
            onClick={submit}
          >
            {kind === 'resit' ? 'Record resit score' : 'Change score'}
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

RevisionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  resultId: PropTypes.string,
  student: PropTypes.object,
  course: PropTypes.object,
  scheme: PropTypes.object,
  canRevise: PropTypes.bool,
  view: PropTypes.oneOf(['change', 'history']),
  initialKind: PropTypes.oneOf(['correction', 'resit']),
  onClose: PropTypes.func.isRequired,
  onRevised: PropTypes.func.isRequired,
};
