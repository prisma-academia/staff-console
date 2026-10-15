import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import {
  Chip,
  Stack,
  Table,
  Button,
  Tooltip,
  Checkbox,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  LinearProgress,
} from '@mui/material';

import { describeSplit, RESULT_STATUS_COLORS } from 'src/utils/grading';

import Iconify from 'src/components/iconify';

import { selectTip } from './publish-selection';

/**
 * Per-course state of a broadsheet: setup, score progress, saved results and issues.
 * With `onToggle`, courses whose score sheets are complete can be selected for publishing;
 * `stateOf(courseId)` gives `{ eligible, blockers }`.
 */
export default function CourseReadiness({ courses, sessionId, selected, onToggle, stateOf }) {
  const navigate = useNavigate();
  const selectable = Boolean(onToggle && stateOf);

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {selectable && <TableCell padding="checkbox" />}
          <TableCell>Course</TableCell>
          <TableCell>Assessments</TableCell>
          <TableCell sx={{ minWidth: 170 }}>Scores</TableCell>
          <TableCell>Results</TableCell>
          <TableCell>Needs attention</TableCell>
          <TableCell align="right" />
        </TableRow>
      </TableHead>
      <TableBody>
        {courses.map((c) => {
          const pct = c.students ? Math.round((c.complete / c.students) * 100) : 0;
          const issues = [];
          if (!c.setup.ok) issues.push({ color: 'error', label: c.assessments.length ? 'Setup invalid' : 'Not set up', tip: c.setup.errors.join(' · ') });
          if (c.unsaved) issues.push({ color: 'warning', label: `${c.unsaved} not computed`, tip: 'Totals from scores that have no draft result yet' });
          if (c.stale) issues.push({ color: 'warning', label: `${c.stale} out of date`, tip: 'Scores changed after the draft was computed' });
          if (c.scored > c.complete) issues.push({ color: 'default', label: `${c.scored - c.complete} incomplete`, tip: 'Some assessments have no score' });
          if (c.overrides) issues.push({ color: 'info', label: `${c.overrides} override(s)`, tip: 'Scores typed in on the broadsheet' });
          const state = selectable ? stateOf(c.courseId) : null;
          const checked = Boolean(selected?.has(c.courseId));
          return (
            <TableRow key={c.courseId} hover selected={checked}>
              {selectable && (
                <TableCell padding="checkbox">
                  <Tooltip title={selectTip(state, checked)}>
                    <span>
                      <Checkbox size="small" checked={checked} disabled={!checked && !state.eligible} onChange={() => onToggle(c.courseId)} />
                    </span>
                  </Tooltip>
                </TableCell>
              )}
              <TableCell>
                <Typography variant="subtitle2">
                  {c.code}
                  {c.isCarryOver && <Chip size="small" label="carry-over" variant="outlined" sx={{ ml: 1, height: 18 }} />}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {c.name} · {c.credit} units
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{c.assessments.length ? describeSplit(c.assessments) : '—'}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption">
                  {c.complete} / {c.students} complete
                </Typography>
                <LinearProgress variant="determinate" value={pct} color={pct === 100 ? 'success' : 'primary'} sx={{ height: 5, borderRadius: 3 }} />
              </TableCell>
              <TableCell>
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  {['draft', 'approved', 'published'].map((s) =>
                    c[s] ? <Chip key={s} size="small" label={`${c[s]} ${s}`} color={RESULT_STATUS_COLORS[s]} variant="outlined" sx={{ height: 20 }} /> : null
                  )}
                  {!c.draft && !c.approved && !c.published && (
                    <Typography variant="caption" color="text.disabled">
                      none
                    </Typography>
                  )}
                </Stack>
              </TableCell>
              <TableCell>
                <Stack direction="row" gap={0.5} flexWrap="wrap">
                  {issues.map((i) => (
                    <Tooltip key={i.label} title={i.tip}>
                      <Chip size="small" label={i.label} color={i.color} variant="outlined" sx={{ height: 20 }} />
                    </Tooltip>
                  ))}
                  {!issues.length && <Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: 'success.main' }} />}
                </Stack>
              </TableCell>
              <TableCell align="right">
                <Button size="small" color="inherit" onClick={() => navigate(`/assessment/scores?courseId=${c.courseId}&sessionId=${sessionId}`)} endIcon={<Iconify icon="eva:arrow-forward-fill" width={16} />}>
                  Scores
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

CourseReadiness.propTypes = {
  courses: PropTypes.array.isRequired,
  sessionId: PropTypes.string,
  selected: PropTypes.instanceOf(Set),
  onToggle: PropTypes.func,
  stateOf: PropTypes.func,
};
