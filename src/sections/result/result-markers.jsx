import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import { Box, Chip, Tooltip } from '@mui/material';

import Iconify from 'src/components/iconify';

// Small markers shared by the broadsheet and the student's academic record:
// the exam outcome of a sitting and the "R" beside a resit score.

/** MUI palette key per exam outcome status. */
export const OUTCOME_COLORS = { pass: 'success', pass_co: 'warning', fail: 'error' };

/** The lines of an outcome's tooltip: failed count against the rule, failed courses, provisional. */
export function outcomeLines(outcome) {
  if (!outcome) return [];
  const period = outcome.scope === 'session' ? 'session' : 'semester';
  const lines = [
    `${outcome.failedCount} of ${outcome.courseCount} course${outcome.courseCount === 1 ? '' : 's'} failed · ${outcome.threshold} or more fails the ${period}`,
  ];
  if (outcome.failedCourses?.length) lines.push(`Failed: ${outcome.failedCourses.join(', ')}`);
  if (outcome.message) lines.push(`Message to the student: ${outcome.message}`);
  if (outcome.provisional) {
    lines.push('Provisional: not every result counted here is published yet');
  }
  return lines;
}

/** An outcome chip (Passed / Passed with resit / Failed); outlined with a clock while provisional. */
export function OutcomeChip({ outcome, prefix, sx }) {
  if (!outcome) return null;
  const label = `${prefix ? `${prefix}: ` : ''}${outcome.label}`;
  return (
    <Tooltip
      title={
        <Box>
          {outcomeLines(outcome).map((line) => (
            <div key={line}>{line}</div>
          ))}
        </Box>
      }
    >
      <Chip
        size="small"
        label={label}
        color={OUTCOME_COLORS[outcome.status] || 'default'}
        variant={outcome.provisional ? 'outlined' : 'filled'}
        icon={outcome.provisional ? <Iconify icon="eva:clock-outline" width={14} /> : undefined}
        sx={{ height: 22, ...sx }}
      />
    </Tooltip>
  );
}

OutcomeChip.propTypes = {
  outcome: PropTypes.object,
  prefix: PropTypes.string,
  sx: PropTypes.object,
};

/**
 * The "R" beside a resit score. Forwards its ref and props so it can sit inside a
 * MUI Tooltip, or carry a native `title` where the parent already uses one.
 */
export const ResitMarker = forwardRef(({ sx, ...other }, ref) => (
  <Box
    ref={ref}
    component="span"
    aria-label="Resit score"
    {...other}
    sx={{
      display: 'inline-grid',
      placeItems: 'center',
      minWidth: 15,
      height: 15,
      px: 0.25,
      borderRadius: 0.5,
      fontSize: 10,
      fontWeight: 700,
      lineHeight: 1,
      bgcolor: 'secondary.main',
      color: 'secondary.contrastText',
      ...sx,
    }}
  >
    R
  </Box>
));

ResitMarker.propTypes = { sx: PropTypes.object };
