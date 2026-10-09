import PropTypes from 'prop-types';

import {
  Box,
  Chip,
  Alert,
  Stack,
  Button,
  Select,
  Tooltip,
  MenuItem,
  TextField,
  IconButton,
  Typography,
} from '@mui/material';

import { SPLIT_PRESETS, ASSESSMENT_TYPES, checkAssessmentSetup } from 'src/utils/grading';

import Iconify from 'src/components/iconify';

let keySeed = 0;
const newKey = () => {
  keySeed += 1;
  return `row-${keySeed}`;
};

/** Assessment rows from the API (or a preset) as editable rows. */
export const toEditableRows = (assessments) =>
  (assessments || []).map((a) => ({
    key: newKey(),
    type: a.type,
    maxScore: a.maxScore ?? '',
    weight: a.weight ?? '',
  }));

/** Editable rows as the API body: numbers, blank weights as null. */
export const toPayloadRows = (rows) =>
  rows.map((r) => ({
    type: r.type,
    maxScore: Number(r.maxScore),
    weight: r.weight === '' || r.weight == null ? null : Number(r.weight),
  }));

/** The setup check for editable rows. */
export const checkRows = (rows) => checkAssessmentSetup(toPayloadRows(rows));

/**
 * Edits a course's assessment split: what each assessment is marked out of and
 * how much of the total it counts for. Presets mark each assessment out of its
 * weight, so lecturers enter raw marks that add up to 100.
 */
export default function SplitEditor({ rows, onChange, disabled = false }) {
  const check = checkRows(rows);
  const usedTypes = new Set(rows.map((r) => r.type));
  const freeTypes = ASSESSMENT_TYPES.filter((t) => !usedTypes.has(t));
  const shareOf = (type) => check.shares.find((s) => s.type === type)?.share;

  const update = (key, field, value) =>
    onChange(
      rows.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, [field]: value };
        // In a weighted split, a weight that matched "marked out of" keeps following it
        const othersWeighted = rows.some((o) => o.key !== key && Number(o.weight) > 0);
        if (field === 'maxScore' && othersWeighted && (r.weight === '' || String(r.weight) === String(r.maxScore))) {
          next.weight = value;
        }
        return next;
      })
    );

  const addRow = () => {
    const type = freeTypes.find((t) => t !== 'Exam') || freeTypes[0];
    onChange([...rows, { key: newKey(), type, maxScore: '', weight: '' }]);
  };

  const applyPreset = (preset) => onChange(toEditableRows(preset.rows));

  return (
    <Stack spacing={2}>
      {!disabled && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            Quick start
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {SPLIT_PRESETS.map((preset) => (
              <Chip key={preset.id} label={preset.label} size="small" variant="outlined" onClick={() => applyPreset(preset)} />
            ))}
          </Stack>
        </Box>
      )}

      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr 72px 40px',
            gap: 1,
            px: 1.5,
            py: 1,
            bgcolor: 'grey.100',
            typography: 'caption',
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          <span>Assessment</span>
          <span>Marked out of</span>
          <Tooltip title="Share of the course total. Leave blank on every row to simply add up the marks.">
            <span>Counts for (%)</span>
          </Tooltip>
          <span>Share</span>
          <span />
        </Box>
        {rows.map((row) => (
          <Box
            key={row.key}
            sx={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr 1fr 72px 40px',
              gap: 1,
              px: 1.5,
              py: 1,
              alignItems: 'center',
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Select size="small" value={row.type} disabled={disabled} onChange={(e) => update(row.key, 'type', e.target.value)}>
              {ASSESSMENT_TYPES.map((t) => (
                <MenuItem key={t} value={t} disabled={t !== row.type && usedTypes.has(t)}>
                  {t}
                </MenuItem>
              ))}
            </Select>
            <TextField
              size="small"
              type="number"
              value={row.maxScore}
              disabled={disabled}
              inputProps={{ min: 1, step: 1 }}
              onChange={(e) => update(row.key, 'maxScore', e.target.value)}
            />
            <TextField
              size="small"
              type="number"
              value={row.weight}
              disabled={disabled}
              placeholder={check.mode === 'raw-sum' ? 'auto' : ''}
              inputProps={{ min: 0, max: 100, step: 1 }}
              onChange={(e) => update(row.key, 'weight', e.target.value)}
            />
            <Typography variant="body2" color={shareOf(row.type) != null ? 'text.primary' : 'text.disabled'}>
              {shareOf(row.type) != null ? `${shareOf(row.type)}%` : '—'}
            </Typography>
            {!disabled ? (
              <IconButton size="small" onClick={() => onChange(rows.filter((r) => r.key !== row.key))} aria-label={`Remove ${row.type}`}>
                <Iconify icon="eva:trash-2-outline" width={18} />
              </IconButton>
            ) : (
              <span />
            )}
          </Box>
        ))}
        {!rows.length && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1.5, py: 2, borderTop: 1, borderColor: 'divider' }}>
            No assessments yet. Pick a quick start above or add one.
          </Typography>
        )}
      </Box>

      {!disabled && freeTypes.length > 0 && (
        <Box>
          <Button size="small" startIcon={<Iconify icon="eva:plus-fill" />} onClick={addRow}>
            Add assessment
          </Button>
        </Box>
      )}

      {rows.length > 0 && check.ok && (
        <Alert severity="success" icon={<Iconify icon="eva:checkmark-circle-2-fill" />}>
          {check.mode === 'weighted'
            ? 'Weights add up to 100%.'
            : 'No weights: the marks are added up and scaled to 100.'}{' '}
          A student with full marks in every assessment scores 100.
        </Alert>
      )}
      {rows.length > 0 &&
        check.errors.map((error) => (
          <Alert key={error} severity="error">
            {error}
          </Alert>
        ))}
      {check.warnings.map((warning) => (
        <Alert key={warning} severity="warning">
          {warning}
        </Alert>
      ))}
    </Stack>
  );
}

SplitEditor.propTypes = {
  rows: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
