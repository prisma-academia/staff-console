import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';
import { Form, getIn, Formik, FieldArray } from 'formik';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Dialog,
  Switch,
  Divider,
  Checkbox,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  FormControlLabel,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';

import { GradingSchemeApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const ASSESSMENT_TYPES = ['Exam', 'CA1', 'CA2', 'CA3'];

const BLANK_SCHEME = {
  name: '',
  code: '',
  description: '',
  maxPoint: 4,
  scoreRounding: { mode: 'round', decimals: 0 },
  gpaDecimals: 2,
  gpaRounding: 'round',
  retakePolicy: 'latest',
  bands: [
    { grade: 'A', minScore: 70, maxScore: 100, point: 4, remark: 'Excellent', isPass: true },
    { grade: 'B', minScore: 60, maxScore: 69, point: 3, remark: 'Very Good', isPass: true },
    { grade: 'C', minScore: 50, maxScore: 59, point: 2, remark: 'Good', isPass: true },
    { grade: 'D', minScore: 40, maxScore: 49, point: 1, remark: 'Pass', isPass: true },
    { grade: 'F', minScore: 0, maxScore: 39, point: 0, remark: 'Fail', isPass: false },
  ],
  classes: [
    { name: 'Distinction', minGpa: 3.5, maxGpa: 4, isPass: true },
    { name: 'Upper Credit', minGpa: 3, maxGpa: 3.49, isPass: true },
    { name: 'Lower Credit', minGpa: 2.5, maxGpa: 2.99, isPass: true },
    { name: 'Pass', minGpa: 2, maxGpa: 2.49, isPass: true },
    { name: 'Fail', minGpa: 0, maxGpa: 1.99, isPass: false },
  ],
  assessmentWeights: [],
  isDefault: false,
  isActive: true,
};

const RETAKE_HELP = {
  latest: 'Only the latest attempt of a retaken course counts in the CGPA.',
  best: 'The best attempt of a retaken course counts in the CGPA.',
  all: 'Every attempt, including failed ones, counts in the CGPA.',
};

const num = (value) => (value === '' || value === null || value === undefined ? value : Number(value));

// The exam-outcome rule of a scheme that has none yet (as the API defaults it)
const OUTCOME_DEFAULTS = {
  enabled: false,
  scope: 'semester',
  failThreshold: 3,
  countCarryOvers: true,
  labels: { pass: 'Passed', passCarryOver: 'Passed with resit', fail: 'Failed' },
  failMessage: '',
};

const validThreshold = (value) => Number.isInteger(value) && value >= 1 && value <= 50;

function toOutcomeValues(rule) {
  const source = rule || {};
  const labels = source.labels || {};
  return {
    enabled: Boolean(source.enabled),
    scope: source.scope === 'session' ? 'session' : 'semester',
    failThreshold: source.failThreshold ?? OUTCOME_DEFAULTS.failThreshold,
    countCarryOvers: source.countCarryOvers !== false,
    labels: {
      pass: labels.pass || OUTCOME_DEFAULTS.labels.pass,
      // The old default reads as today's (failed courses are resat, not carried over)
      passCarryOver:
        labels.passCarryOver && labels.passCarryOver !== 'Passed with carry-over'
          ? labels.passCarryOver
          : OUTCOME_DEFAULTS.labels.passCarryOver,
      fail: labels.fail || OUTCOME_DEFAULTS.labels.fail,
    },
    failMessage: source.failMessage || '',
  };
}

function toOutcomePayload(rule) {
  const threshold = num(rule.failThreshold);
  return {
    enabled: Boolean(rule.enabled),
    scope: rule.scope,
    // While the rule is off, an unfinished threshold falls back to the default instead of blocking the save
    failThreshold: rule.enabled || validThreshold(threshold) ? threshold : OUTCOME_DEFAULTS.failThreshold,
    countCarryOvers: Boolean(rule.countCarryOvers),
    labels: {
      pass: String(rule.labels.pass || '').trim(),
      passCarryOver: String(rule.labels.passCarryOver || '').trim(),
      fail: String(rule.labels.fail || '').trim(),
    },
    failMessage: String(rule.failMessage || '').trim(),
  };
}

/** "A student who fails 3 or more courses in a semester is marked Failed; 1–2 failed courses is ..." */
function outcomeExample(rule) {
  const threshold = Number(rule.failThreshold);
  if (rule.failThreshold === '' || !validThreshold(threshold)) {
    return 'Enter how many failed courses fail the exam (1 to 50).';
  }
  const period = rule.scope === 'session' ? 'session' : 'semester';
  const label = (key) => String(rule.labels[key] || '').trim() || OUTCOME_DEFAULTS.labels[key];
  const parts = [
    `A student who fails ${threshold} or more courses in a ${period} is marked ${label('fail')}`,
  ];
  if (threshold === 2) parts.push(`1 failed course is ${label('passCarryOver')}`);
  if (threshold > 2) parts.push(`1–${threshold - 1} failed courses is ${label('passCarryOver')}`);
  parts.push(`no failed course is ${label('pass')}`);
  return `${parts.join('; ')}. A course passed at a resit no longer counts as failed.`;
}

/** Form values -> API payload (numbers as numbers, weights as a list). */
function toPayload(values) {
  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    description: values.description || '',
    maxPoint: num(values.maxPoint),
    scoreRounding: { mode: values.scoreRounding.mode, decimals: num(values.scoreRounding.decimals) },
    gpaDecimals: num(values.gpaDecimals),
    gpaRounding: values.gpaRounding,
    retakePolicy: values.retakePolicy,
    bands: values.bands.map((b) => ({
      grade: String(b.grade || '').trim().toUpperCase(),
      minScore: num(b.minScore),
      maxScore: num(b.maxScore),
      point: num(b.point),
      remark: b.remark || '',
      isPass: Boolean(b.isPass),
    })),
    classes: values.classes.map((c) => ({
      name: String(c.name || '').trim(),
      minGpa: num(c.minGpa),
      maxGpa: num(c.maxGpa),
      isPass: Boolean(c.isPass),
    })),
    assessmentWeights: ASSESSMENT_TYPES
      .map((type) => ({ type, weight: num(values.weights[type]) || 0 }))
      .filter((w) => w.weight > 0),
    examOutcome: toOutcomePayload(values.examOutcome),
    isDefault: Boolean(values.isDefault),
    isActive: Boolean(values.isActive),
  };
}

function toFormValues(scheme) {
  const source = scheme || BLANK_SCHEME;
  const weights = Object.fromEntries(ASSESSMENT_TYPES.map((type) => [type, '']));
  (source.assessmentWeights || []).forEach((w) => { weights[w.type] = w.weight; });
  return {
    name: source.name || '',
    code: source.code || '',
    description: source.description || '',
    maxPoint: source.maxPoint ?? 4,
    scoreRounding: { mode: source.scoreRounding?.mode || 'round', decimals: source.scoreRounding?.decimals ?? 0 },
    gpaDecimals: source.gpaDecimals ?? 2,
    gpaRounding: source.gpaRounding || 'round',
    retakePolicy: source.retakePolicy || 'latest',
    bands: [...(source.bands || [])].sort((a, b) => b.minScore - a.minScore).map((b) => ({ remark: '', ...b })),
    classes: [...(source.classes || [])].sort((a, b) => b.minGpa - a.minGpa),
    weights,
    // Missing on schemes made before the rule existed
    examOutcome: toOutcomeValues(source.examOutcome),
    isDefault: Boolean(source.isDefault),
    isActive: source.isActive !== false,
  };
}

const validationSchema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
  code: Yup.string().trim().max(40).required('Code is required'),
  maxPoint: Yup.number().typeError('Must be a number').positive('Must be positive').required('Required'),
  bands: Yup.array().of(Yup.object({
    grade: Yup.string().trim().required('Required').max(4, 'Max 4 characters'),
    minScore: Yup.number().typeError('Number').min(0).max(100).required('Required'),
    maxScore: Yup.number().typeError('Number').min(0).max(100).required('Required'),
    point: Yup.number().typeError('Number').min(0).required('Required'),
  })).min(2, 'At least two bands'),
  classes: Yup.array().of(Yup.object({
    name: Yup.string().trim().required('Required'),
    minGpa: Yup.number().typeError('Number').min(0).required('Required'),
    maxGpa: Yup.number().typeError('Number').min(0).required('Required'),
  })).min(1, 'At least one class'),
  examOutcome: Yup.object({
    failThreshold: Yup.mixed().when('enabled', {
      is: true,
      then: () =>
        Yup.number()
          .typeError('Enter a whole number')
          .integer('Enter a whole number')
          .min(1, 'From 1 to 50')
          .max(50, 'From 1 to 50')
          .required('Required'),
    }),
    labels: Yup.object({
      pass: Yup.string().max(40, 'At most 40 characters'),
      passCarryOver: Yup.string().max(40, 'At most 40 characters'),
      fail: Yup.string().max(40, 'At most 40 characters'),
    }),
    failMessage: Yup.string().max(500, 'At most 500 characters'),
  }),
});

// ----------------------------------------------------------------------

/**
 * Live check of the draft against the server's own rules (the same
 * validateScheme the API runs on save) plus a score -> grade tester.
 */
function SchemeChecker({ values }) {
  const [samples, setSamples] = useState('39.5, 44, 49.5, 59, 69.5, 70');
  const [result, setResult] = useState(null);
  const payload = useMemo(() => toPayload(values), [values]);

  useEffect(() => {
    const scores = samples.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n)).slice(0, 30);
    const timer = setTimeout(() => {
      GradingSchemeApi.preview({ scheme: payload, scores })
        .then(setResult)
        .catch(() => setResult(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [payload, samples]);

  return (
    <Stack spacing={1.5}>
      {result && !result.valid && (
        <Alert severity="warning">
          <Typography variant="subtitle2" gutterBottom>Fix these before saving:</Typography>
          {result.errors.map((e) => <div key={e}>• {e}</div>)}
        </Alert>
      )}
      {result?.valid && (
        <Alert severity="success">Scheme is valid. Pass mark: {result.passMark}.</Alert>
      )}
      <TextField
        size="small"
        label="Try scores (comma separated)"
        value={samples}
        onChange={(e) => setSamples(e.target.value)}
      />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {(result?.scores || []).map((s, i) => {
          let color = 'default';
          if (s.grade) color = s.isPass ? 'success' : 'error';
          return (
          <Chip
            key={`${s.input}-${i}`}
            size="small"
            color={color}
            variant="outlined"
            label={s.grade ? `${s.input} → ${s.score} ${s.grade} (${s.point})` : `${s.input} → —`}
          />
          );
        })}
      </Stack>
    </Stack>
  );
}

SchemeChecker.propTypes = { values: PropTypes.object.isRequired };

// ----------------------------------------------------------------------

export default function GradingSchemeEditor({ open, scheme, onClose, onSaved, onDuplicate }) {
  const { enqueueSnackbar } = useSnackbar();
  const { check } = usePermissions();
  const isNew = !scheme?._id;
  const canSave = check(isNew ? PERMISSIONS.ADD_GRADING_SCHEME : PERMISSIONS.EDIT_GRADING_SCHEME);
  const locked = Boolean(scheme?.locked);
  const [serverErrors, setServerErrors] = useState([]);

  const handleSubmit = async (values, { setSubmitting }) => {
    setServerErrors([]);
    try {
      const payload = toPayload(values);
      const saved = isNew
        ? await GradingSchemeApi.createScheme(payload)
        : await GradingSchemeApi.updateScheme(scheme._id, payload);
      enqueueSnackbar(isNew ? `Created "${saved.name}"` : `Saved "${saved.name}"`, { variant: 'success' });
      onSaved(saved);
      onClose();
    } catch (error) {
      const errors = error.data?.errors;
      if (Array.isArray(errors)) {
        setServerErrors(errors.map((e) => (typeof e === 'string' ? e : `${e.field || ''} ${e.message}`.trim())));
      }
      enqueueSnackbar(error.data?.message || error.message || 'Could not save the scheme', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const gradingDisabled = locked || !canSave;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <Formik initialValues={toFormValues(scheme)} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
        {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => {
          const fieldProps = (name, extra = {}) => ({
            name,
            size: 'small',
            value: getIn(values, name) ?? '',
            onChange: handleChange,
            onBlur: handleBlur,
            error: Boolean(getIn(touched, name) && getIn(errors, name)),
            helperText: getIn(touched, name) && getIn(errors, name),
            ...extra,
          });
          const weightTotal = ASSESSMENT_TYPES.reduce((sum, type) => sum + (Number(values.weights[type]) || 0), 0);
          // The exam outcome stays editable on a locked scheme: it never changes a grade
          const outcomeDisabled = !canSave || !values.examOutcome.enabled;
          const thresholdError =
            getIn(touched, 'examOutcome.failThreshold') && getIn(errors, 'examOutcome.failThreshold');

          return (
            <Form noValidate>
              <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>{isNew ? 'New grading scheme' : scheme.name}</span>
                  {locked && <Chip size="small" color="warning" icon={<Iconify icon="eva:lock-fill" />} label="Locked" />}
                </Stack>
              </DialogTitle>

              <DialogContent dividers>
                <Stack spacing={3}>
                  {locked && (
                    <Alert
                      severity="warning"
                      action={canSave && (
                        <Button color="inherit" size="small" onClick={() => onDuplicate(scheme._id)}>
                          Duplicate
                        </Button>
                      )}
                    >
                      This scheme grades approved or published results, so its bands, classes and rules can no longer change.
                      Duplicate it, edit the copy and assign the copy to the programmes. Name, description, default,
                      default assessment split and the exam outcome rule can still be edited.
                    </Alert>
                  )}
                  {serverErrors.length > 0 && (
                    <Alert severity="error">
                      {serverErrors.map((e) => <div key={e}>• {e}</div>)}
                    </Alert>
                  )}

                  {/* Details */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={5}>
                      <TextField fullWidth label="Name" {...fieldProps('name')} disabled={!canSave} />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField fullWidth label="Code" {...fieldProps('code')} disabled={!canSave} inputProps={{ style: { textTransform: 'uppercase' } }} />
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField fullWidth type="number" label="Max grade point" {...fieldProps('maxPoint')} disabled={gradingDisabled} inputProps={{ step: 0.5, min: 1 }} />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Stack>
                        <FormControlLabel
                          control={<Switch checked={values.isDefault} onChange={(e) => setFieldValue('isDefault', e.target.checked)} disabled={!canSave} />}
                          label="Default"
                        />
                        <FormControlLabel
                          control={<Switch checked={values.isActive} onChange={(e) => setFieldValue('isActive', e.target.checked)} disabled={!canSave} />}
                          label="Active"
                        />
                      </Stack>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline minRows={1} label="Description" {...fieldProps('description')} disabled={!canSave} />
                    </Grid>
                  </Grid>

                  <Divider />

                  {/* Bands */}
                  <Box>
                    <Typography variant="subtitle1">Grade bands</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Score ranges (0–100) after rounding, highest first. Bands must not overlap or leave gaps. Ticked bands are passes.
                    </Typography>
                    <FieldArray name="bands">
                      {({ push, remove }) => (
                        <>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Grade</TableCell>
                                <TableCell>Min score</TableCell>
                                <TableCell>Max score</TableCell>
                                <TableCell>Grade point</TableCell>
                                <TableCell>Remark</TableCell>
                                <TableCell align="center">Pass</TableCell>
                                <TableCell />
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {values.bands.map((band, index) => (
                                <TableRow key={index}>
                                  <TableCell sx={{ width: 90 }}>
                                    <TextField {...fieldProps(`bands.${index}.grade`)} disabled={gradingDisabled} inputProps={{ style: { textTransform: 'uppercase' } }} />
                                  </TableCell>
                                  <TableCell sx={{ width: 110 }}>
                                    <TextField type="number" {...fieldProps(`bands.${index}.minScore`)} disabled={gradingDisabled} />
                                  </TableCell>
                                  <TableCell sx={{ width: 110 }}>
                                    <TextField type="number" {...fieldProps(`bands.${index}.maxScore`)} disabled={gradingDisabled} />
                                  </TableCell>
                                  <TableCell sx={{ width: 110 }}>
                                    <TextField type="number" {...fieldProps(`bands.${index}.point`)} disabled={gradingDisabled} inputProps={{ step: 0.25 }} />
                                  </TableCell>
                                  <TableCell>
                                    <TextField fullWidth {...fieldProps(`bands.${index}.remark`)} disabled={gradingDisabled} />
                                  </TableCell>
                                  <TableCell align="center">
                                    <Checkbox
                                      checked={Boolean(band.isPass)}
                                      onChange={(e) => setFieldValue(`bands.${index}.isPass`, e.target.checked)}
                                      disabled={gradingDisabled}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <IconButton size="small" color="error" onClick={() => remove(index)} disabled={gradingDisabled || values.bands.length <= 2}>
                                      <Iconify icon="eva:trash-2-outline" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {!gradingDisabled && (
                            <Button size="small" sx={{ mt: 1 }} startIcon={<Iconify icon="eva:plus-fill" />}
                              onClick={() => push({ grade: '', minScore: '', maxScore: '', point: '', remark: '', isPass: true })}>
                              Add band
                            </Button>
                          )}
                        </>
                      )}
                    </FieldArray>
                  </Box>

                  {/* Classes */}
                  <Box>
                    <Typography variant="subtitle1">Classes of award</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      CGPA ranges from 0 to the max grade point (e.g. Distinction, Upper Credit, Lower Credit, Pass, Fail).
                    </Typography>
                    <FieldArray name="classes">
                      {({ push, remove }) => (
                        <>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Class</TableCell>
                                <TableCell>Min CGPA</TableCell>
                                <TableCell>Max CGPA</TableCell>
                                <TableCell align="center">Pass</TableCell>
                                <TableCell />
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {values.classes.map((c, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <TextField fullWidth {...fieldProps(`classes.${index}.name`)} disabled={gradingDisabled} />
                                  </TableCell>
                                  <TableCell sx={{ width: 130 }}>
                                    <TextField type="number" {...fieldProps(`classes.${index}.minGpa`)} disabled={gradingDisabled} inputProps={{ step: 0.01 }} />
                                  </TableCell>
                                  <TableCell sx={{ width: 130 }}>
                                    <TextField type="number" {...fieldProps(`classes.${index}.maxGpa`)} disabled={gradingDisabled} inputProps={{ step: 0.01 }} />
                                  </TableCell>
                                  <TableCell align="center">
                                    <Checkbox
                                      checked={Boolean(c.isPass)}
                                      onChange={(e) => setFieldValue(`classes.${index}.isPass`, e.target.checked)}
                                      disabled={gradingDisabled}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <IconButton size="small" color="error" onClick={() => remove(index)} disabled={gradingDisabled || values.classes.length <= 1}>
                                      <Iconify icon="eva:trash-2-outline" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {!gradingDisabled && (
                            <Button size="small" sx={{ mt: 1 }} startIcon={<Iconify icon="eva:plus-fill" />}
                              onClick={() => push({ name: '', minGpa: '', maxGpa: '', isPass: true })}>
                              Add class
                            </Button>
                          )}
                        </>
                      )}
                    </FieldArray>
                  </Box>

                  <Divider />

                  {/* Rules */}
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                      <TextField select fullWidth label="Score rounding" {...fieldProps('scoreRounding.mode')} disabled={gradingDisabled}
                        helperText="Applied to the course total before banding">
                        <MenuItem value="round">Round half up (69.5 → 70)</MenuItem>
                        <MenuItem value="floor">Round down (69.9 → 69)</MenuItem>
                        <MenuItem value="none">No rounding</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField select fullWidth label="Score decimals" {...fieldProps('scoreRounding.decimals')} disabled={gradingDisabled}>
                        {[0, 1, 2].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField select fullWidth label="GPA decimals" {...fieldProps('gpaDecimals')} disabled={gradingDisabled}>
                        {[1, 2, 3].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={6} md={2}>
                      <TextField select fullWidth label="GPA rounding" {...fieldProps('gpaRounding')} disabled={gradingDisabled}>
                        <MenuItem value="round">Round</MenuItem>
                        <MenuItem value="truncate">Truncate</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField select fullWidth label="Retaken courses" {...fieldProps('retakePolicy')} disabled={gradingDisabled}
                        helperText={RETAKE_HELP[values.retakePolicy]}>
                        <MenuItem value="latest">Latest attempt counts</MenuItem>
                        <MenuItem value="best">Best attempt counts</MenuItem>
                        <MenuItem value="all">All attempts count</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>

                  {/* Assessment split */}
                  <Box>
                    <Typography variant="subtitle1">Starting split for new courses (optional)</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      New courses of these programmes start with these assessments, each marked out of its weight (e.g. CA1 /20 +
                      CA2 /20 + Exam /60). Each course&apos;s split can then be changed on the Assessments page. Leave empty to set
                      up every course there.
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                      {ASSESSMENT_TYPES.map((type) => (
                        <TextField key={type} type="number" label={`${type} %`} sx={{ width: 110 }} {...fieldProps(`weights.${type}`)} disabled={!canSave} />
                      ))}
                      <Chip
                        label={`Total ${weightTotal}%`}
                        color={weightTotal === 0 || weightTotal === 100 ? 'default' : 'error'}
                      />
                    </Stack>
                  </Box>

                  <Divider />

                  {/* Exam outcome */}
                  <Box>
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography variant="subtitle1">Exam outcome</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Marks each student&apos;s sitting as passed, passed with resit or failed by
                          how many courses they failed. It shows on the broadsheet, the student portal,
                          result slips and transcripts, and never changes a grade.
                        </Typography>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={values.examOutcome.enabled}
                            onChange={(e) => setFieldValue('examOutcome.enabled', e.target.checked)}
                            disabled={!canSave}
                          />
                        }
                        label={values.examOutcome.enabled ? 'On' : 'Off'}
                        sx={{ flexShrink: 0, mr: 0 }}
                      />
                    </Stack>
                    {locked && canSave && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Still editable on this locked scheme: the outcome only labels sittings, so changing
                        it leaves every approved and published grade as it is.
                      </Typography>
                    )}
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          label="Counted"
                          {...fieldProps('examOutcome.scope')}
                          disabled={outcomeDisabled}
                          helperText="Which failed courses add up"
                        >
                          <MenuItem value="semester">Per semester</MenuItem>
                          <MenuItem value="session">Per session</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Failed courses that fail"
                          {...fieldProps('examOutcome.failThreshold')}
                          helperText={thresholdError || 'Failing this many courses or more fails the exam'}
                          disabled={outcomeDisabled}
                          inputProps={{ min: 1, max: 50, step: 1 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Label: passed"
                          {...fieldProps('examOutcome.labels.pass')}
                          disabled={outcomeDisabled}
                          inputProps={{ maxLength: 40 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Label: passed with resit"
                          {...fieldProps('examOutcome.labels.passCarryOver')}
                          disabled={outcomeDisabled}
                          inputProps={{ maxLength: 40 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth
                          label="Label: failed"
                          {...fieldProps('examOutcome.labels.fail')}
                          disabled={outcomeDisabled}
                          inputProps={{ maxLength: 40 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          label="Message for students who fail"
                          {...fieldProps('examOutcome.failMessage')}
                          helperText={
                            getIn(touched, 'examOutcome.failMessage') && getIn(errors, 'examOutcome.failMessage')
                              ? getIn(errors, 'examOutcome.failMessage')
                              : `Shown to students who fail · ${values.examOutcome.failMessage.length}/500`
                          }
                          disabled={outcomeDisabled}
                          inputProps={{ maxLength: 500 }}
                        />
                      </Grid>
                    </Grid>
                    <Alert severity="info" icon={<Iconify icon="eva:bulb-outline" />} sx={{ mt: 2 }}>
                      {values.examOutcome.enabled
                        ? outcomeExample(values.examOutcome)
                        : `Off: no outcome is shown. When on: ${outcomeExample(values.examOutcome)}`}
                    </Alert>
                  </Box>

                  <Divider />
                  <SchemeChecker values={values} />
                </Stack>
              </DialogContent>

              <DialogActions>
                <Button onClick={onClose}>{canSave ? 'Cancel' : 'Close'}</Button>
                {canSave && (
                  <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                    {isNew ? 'Create scheme' : 'Save changes'}
                  </LoadingButton>
                )}
              </DialogActions>
            </Form>
          );
        }}
      </Formik>
    </Dialog>
  );
}

GradingSchemeEditor.propTypes = {
  open: PropTypes.bool.isRequired,
  scheme: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
};
