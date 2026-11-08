import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Chip,
  Alert,
  Stack,
  Button,
  Divider,
  Popover,
  TableCell,
  TextField,
  IconButton,
  Typography,
} from '@mui/material';

import { gradeBg, gradeTone, RESULT_STATUS_COLORS } from 'src/utils/grading';

import Iconify from 'src/components/iconify';

import { ResitMarker } from '../result-markers';

const changesTip = (count) =>
  `Changed after it was locked — ${count} change${count === 1 ? '' : 's'}`;

/**
 * What a broadsheet cell shows: the saved result when it is current, otherwise
 * the total computed from the scores (marked "not saved").
 */
export function cellView(course) {
  const saved = course.resultId && !course.stale;
  return {
    score: saved ? course.finalScore : course.calculatedScore ?? course.finalScore,
    grade: saved ? course.finalGrade : course.calculatedGrade ?? course.finalGrade,
    saved,
  };
}

/**
 * One course cell of the broadsheet: score, grade and state icons. Click for details.
 * An "R" marks a resit score; the history icon (a result changed after it was locked)
 * opens the score history.
 */
export function ResultCell({ course, scheme, onOpen, onHistory }) {
  const { score, grade, saved } = cellView(course);
  const icons = [];
  if (course.locked) icons.push(['eva:lock-fill', 'text.disabled', `Locked (${course.status})`]);
  if (course.isOverride) icons.push(['eva:edit-2-fill', 'info.main', 'Score set on the broadsheet']);
  if (course.stale) icons.push(['eva:alert-triangle-fill', 'warning.main', `Saved ${course.finalScore} ${course.finalGrade}; the scores now give ${course.calculatedScore}`]);
  if (!course.resultId && course.calculatedScore != null) icons.push(['eva:radio-button-off-fill', 'text.disabled', 'Computed from the scores but not saved yet']);
  if (course.setupError) icons.push(['eva:alert-circle-fill', 'error.main', course.setupError]);
  else if (course.calculatedScore != null && !course.complete) icons.push(['eva:info-fill', 'text.disabled', `Missing: ${course.missing.join(', ')}`]);
  const changes = course.resultId ? course.revisionCount || 0 : 0;
  const markerTips = [course.isResit && 'Resit score', changes > 0 && changesTip(changes)].filter(Boolean);

  return (
    <TableCell
      align="center"
      onClick={(e) => onOpen(e.currentTarget)}
      title={[...icons.map((i) => i[2]), ...markerTips].join(' · ')}
      sx={{
        cursor: 'pointer',
        py: 0.5,
        px: 1,
        bgcolor: saved ? gradeBg(grade, scheme) : undefined,
        '&:hover': { boxShadow: (theme) => `inset 0 0 0 2px ${theme.palette.primary.light}` },
      }}
    >
      {score == null ? (
        <Typography variant="body2" color="text.disabled">
          —
        </Typography>
      ) : (
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
          <Typography variant="body2" sx={{ fontWeight: 600, fontStyle: saved ? 'normal' : 'italic', color: saved ? 'text.primary' : 'text.secondary' }}>
            {score}
          </Typography>
          {grade && <Chip size="small" label={grade} color={gradeTone(grade, scheme)} variant={saved ? 'filled' : 'outlined'} sx={{ height: 20, minWidth: 30 }} />}
          {icons.map(([icon, color]) => (
            <Iconify key={icon} icon={icon} width={13} sx={{ color }} />
          ))}
          {course.isResit && <ResitMarker title="Resit score" />}
          {changes > 0 && (
            <IconButton
              size="small"
              title={changesTip(changes)}
              aria-label="Score history"
              onClick={(e) => {
                e.stopPropagation();
                if (onHistory) onHistory();
                else onOpen(e.currentTarget.closest('td'));
              }}
              sx={{ p: 0.125, color: 'secondary.main' }}
            >
              <Iconify icon="mdi:history" width={14} />
            </IconButton>
          )}
        </Stack>
      )}
    </TableCell>
  );
}

ResultCell.propTypes = {
  course: PropTypes.object.isRequired,
  scheme: PropTypes.object,
  onOpen: PropTypes.func.isRequired,
  onHistory: PropTypes.func,
};

/**
 * Details of one student's course result: override and recompute actions on drafts,
 * change-score and reopen actions on locked results, and the score history.
 */
export function ResultCellPopover({ anchorEl, student, course, scheme, sessionId, permissions, busy, onClose, onOverride, onUseComputed, onDelete, onReopen, onRevise, onHistory }) {
  const navigate = useNavigate();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (course) setValue(course.isOverride ? String(course.finalScore ?? '') : '');
  }, [course]);

  if (!course || !student) return null;
  const n = Number(value);
  const valid = value !== '' && !Number.isNaN(n) && n >= 0 && n <= 100;
  const canAct = !course.locked;

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      PaperProps={{ sx: { width: 340, p: 2 } }}
    >
      <Typography variant="subtitle2">{student.name}</Typography>
      <Typography variant="caption" color="text.secondary">
        {student.regNumber} · {course.courseCode} ({course.credit} units){course.isCarryOver ? ' · earlier retake' : ''}
      </Typography>

      <Divider sx={{ my: 1.5 }} />
      <Stack spacing={0.5}>
        {(course.assessments || []).map((a) => (
          <Stack key={a.assessmentId} direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {a.type}
            </Typography>
            <Typography variant="body2">
              {a.score ?? '—'} / {a.maxScore}
            </Typography>
          </Stack>
        ))}
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Computed total
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {course.calculatedScore != null ? `${course.calculatedScore} ${course.calculatedGrade}` : '—'}
          </Typography>
        </Stack>
        {course.setupError && <Alert severity="error" sx={{ py: 0 }}>{course.setupError}</Alert>}
        {!course.setupError && course.calculatedScore != null && !course.complete && (
          <Typography variant="caption" color="warning.dark">
            Missing {course.missing.join(', ')} (counted as 0)
          </Typography>
        )}
      </Stack>

      <Divider sx={{ my: 1.5 }} />
      {course.resultId ? (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Typography variant="body2">Saved:</Typography>
          <Chip size="small" label={course.status} color={RESULT_STATUS_COLORS[course.status]} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {course.finalScore} {course.finalGrade}
          </Typography>
          {course.isOverride && <Chip size="small" variant="outlined" color="info" label="override" />}
          {course.attempt > 1 && <Chip size="small" variant="outlined" label={`attempt ${course.attempt}`} />}
          {course.isResit && <Chip size="small" variant="outlined" color="secondary" label="resit" />}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No result saved yet.
        </Typography>
      )}
      {course.stale && (
        <Typography variant="caption" color="warning.dark" sx={{ display: 'block', mt: 0.5 }}>
          The scores changed after this draft was computed.
        </Typography>
      )}

      {canAct && (permissions.compute || permissions.override || permissions.remove) && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Stack spacing={1.25}>
            {permissions.compute && course.calculatedScore != null && !course.setupError && (course.isOverride || course.stale || !course.resultId) && (
              <LoadingButton size="small" variant="contained" loading={busy === 'compute'} onClick={() => onUseComputed(student, course)}>
                Save computed score ({course.calculatedScore})
              </LoadingButton>
            )}
            {permissions.override && (
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  size="small"
                  label="Override score"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  error={value !== '' && !valid}
                  helperText="0–100; graded by the scheme"
                  inputProps={{ inputMode: 'decimal' }}
                  sx={{ flex: 1 }}
                />
                <LoadingButton size="small" variant="outlined" loading={busy === 'override'} disabled={!valid} onClick={() => onOverride(student, course, n)} sx={{ mt: 0.5 }}>
                  Save
                </LoadingButton>
              </Stack>
            )}
            {permissions.remove && course.resultId && course.status === 'draft' && (
              <LoadingButton size="small" color="error" loading={busy === 'delete'} onClick={() => onDelete(student, course)} startIcon={<Iconify icon="eva:trash-2-outline" />}>
                Delete draft result
              </LoadingButton>
            )}
          </Stack>
        </>
      )}
      {course.locked && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {course.status === 'published' ? 'Published' : 'Approved'} results are locked.
          </Typography>
          {onReopen && course.resultId && (
            <Button size="small" color="warning" variant="outlined" startIcon={<Iconify icon="eva:unlock-outline" />} onClick={() => onReopen(student, course)}>
              Reopen this result
            </Button>
          )}
        </Stack>
      )}
      {/* Record a resit or correct a locked score in place, and the history of such changes */}
      {course.resultId && ((course.locked && onRevise) || (onHistory && course.revisionCount > 0)) && (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          {course.locked && onRevise && course.isPass === false && (
            <Button
              size="small"
              variant="contained"
              color="secondary"
              startIcon={<Iconify icon="mdi:restore" />}
              onClick={() => onRevise(student, course, 'resit')}
            >
              Record resit score
            </Button>
          )}
          {course.locked && onRevise && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="eva:edit-2-outline" />}
              onClick={() => onRevise(student, course, 'correction')}
            >
              Correct score
            </Button>
          )}
          {onHistory && course.revisionCount > 0 && (
            <Button
              size="small"
              color="inherit"
              startIcon={<Iconify icon="mdi:history" />}
              onClick={() => onHistory(student, course)}
            >
              History ({course.revisionCount})
            </Button>
          )}
        </Stack>
      )}

      <Box sx={{ mt: 1.5, textAlign: 'right' }}>
        <Button size="small" color="inherit" endIcon={<Iconify icon="eva:arrow-forward-fill" />} onClick={() => navigate(`/assessment/scores?courseId=${course.courseId}&sessionId=${sessionId}`)}>
          Score sheet
        </Button>
      </Box>
    </Popover>
  );
}

ResultCellPopover.propTypes = {
  anchorEl: PropTypes.any,
  student: PropTypes.object,
  course: PropTypes.object,
  scheme: PropTypes.object,
  sessionId: PropTypes.string,
  permissions: PropTypes.object.isRequired,
  busy: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onOverride: PropTypes.func.isRequired,
  onUseComputed: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onReopen: PropTypes.func,
  onRevise: PropTypes.func,
  onHistory: PropTypes.func,
};
