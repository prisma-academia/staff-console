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
  Typography,
} from '@mui/material';

import { gradeBg, gradeTone, RESULT_STATUS_COLORS } from 'src/utils/grading';

import Iconify from 'src/components/iconify';

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

/** One course cell of the broadsheet: score, grade and state icons. Click for details. */
export function ResultCell({ course, scheme, onOpen }) {
  const { score, grade, saved } = cellView(course);
  const icons = [];
  if (course.locked) icons.push(['eva:lock-fill', 'text.disabled', `Locked (${course.status})`]);
  if (course.isOverride) icons.push(['eva:edit-2-fill', 'info.main', 'Score set on the broadsheet']);
  if (course.stale) icons.push(['eva:alert-triangle-fill', 'warning.main', `Saved ${course.finalScore} ${course.finalGrade}; the scores now give ${course.calculatedScore}`]);
  if (!course.resultId && course.calculatedScore != null) icons.push(['eva:radio-button-off-fill', 'text.disabled', 'Computed from the scores but not saved yet']);
  if (course.setupError) icons.push(['eva:alert-circle-fill', 'error.main', course.setupError]);
  else if (course.calculatedScore != null && !course.complete) icons.push(['eva:info-fill', 'text.disabled', `Missing: ${course.missing.join(', ')}`]);

  return (
    <TableCell
      align="center"
      onClick={(e) => onOpen(e.currentTarget)}
      title={icons.map((i) => i[2]).join(' · ')}
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
        </Stack>
      )}
    </TableCell>
  );
}

ResultCell.propTypes = {
  course: PropTypes.object.isRequired,
  scheme: PropTypes.object,
  onOpen: PropTypes.func.isRequired,
};

/** Details of one student's course result, with override and recompute actions. */
export function ResultCellPopover({ anchorEl, student, course, scheme, sessionId, permissions, busy, onClose, onOverride, onUseComputed, onDelete }) {
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
        {student.regNumber} · {course.courseCode} ({course.credit} units){course.isCarryOver ? ' · carry-over' : ''}
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
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Reopen this class&apos;s results to change it.
        </Typography>
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
};
