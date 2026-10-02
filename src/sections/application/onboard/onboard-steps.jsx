import { getIn } from 'formik';
import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { stateList } from 'src/utils/state-list';

import Iconify from 'src/components/iconify';
import PhotoCaptureDialog from 'src/components/photo-capture/photo-capture-dialog';

import { GRADES, SUBJECTS, emptyExam, EXAM_TYPES, FIXED_SUBJECTS } from './constants';

// ----------------------------------------------------------------------

// TextField props bound to a (possibly nested) Formik field.
const bind = (formik, name, helperText) => {
  const error = getIn(formik.touched, name) && getIn(formik.errors, name);
  return {
    name,
    value: getIn(formik.values, name) ?? '',
    onChange: formik.handleChange,
    onBlur: formik.handleBlur,
    error: Boolean(error),
    helperText: (typeof error === 'string' && error) || helperText,
    fullWidth: true,
  };
};

const lgasOf = (state) => stateList.find((item) => item.state === state)?.lgas ?? [];

const formikShape = PropTypes.shape({
  values: PropTypes.object,
  errors: PropTypes.object,
  touched: PropTypes.object,
  handleChange: PropTypes.func,
  handleBlur: PropTypes.func,
  setFieldValue: PropTypes.func,
  setFieldTouched: PropTypes.func,
});

// ----------------------------------------------------------------------

export function ApplicantStep({ formik, programmes, session }) {
  return (
    <Stack spacing={2.5}>
      {session ? (
        <Alert severity="info">
          The application will be filed under the active session <strong>{session.name}</strong>.
        </Alert>
      ) : (
        <Alert severity="warning">There is no active application session; applications cannot be submitted.</Alert>
      )}
      <TextField
        {...bind(formik, 'email', 'The applicant receives a link at this address to set a password and pay.')}
        label="Applicant email"
        type="email"
      />
      <TextField {...bind(formik, 'programme')} select label="Programme">
        {programmes.map((programme) => (
          <MenuItem key={programme._id} value={programme._id}>
            {programme.name} — ₦{Number(programme.price || 0).toLocaleString()}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  );
}

ApplicantStep.propTypes = {
  formik: formikShape,
  programmes: PropTypes.array,
  session: PropTypes.object,
};

// ----------------------------------------------------------------------

export function BioDataStep({ formik }) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const { values, setFieldValue } = formik;
  const photoError = formik.touched.photo && formik.errors.photo;

  const changeState = (stateField, lgaField) => (event) => {
    setFieldValue(stateField, event.target.value);
    setFieldValue(lgaField, '');
  };

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={3}>
        <Stack alignItems="center" spacing={1}>
          <Avatar
            variant="rounded"
            src={values.photo || undefined}
            sx={{ width: 140, height: 140, border: (theme) => `2px solid ${photoError ? theme.palette.error.main : theme.palette.divider}` }}
          >
            <Iconify icon="eva:person-fill" width={64} />
          </Avatar>
          <Button size="small" variant="outlined" startIcon={<Iconify icon="eva:camera-outline" />} onClick={() => setPhotoOpen(true)}>
            {values.photo ? 'Change photo' : 'Add photo'}
          </Button>
          {photoError && (
            <Typography variant="caption" color="error">
              {photoError}
            </Typography>
          )}
        </Stack>
        <PhotoCaptureDialog
          open={photoOpen}
          onClose={() => setPhotoOpen(false)}
          onConfirm={(dataUrl) => {
            setFieldValue('photo', dataUrl);
            formik.setFieldTouched('photo', true, false);
          }}
        />
      </Grid>

      <Grid item xs={12} md={9}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField {...bind(formik, 'firstName')} label="First name" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField {...bind(formik, 'lastName')} label="Last name" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField {...bind(formik, 'otherName')} label="Other name" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField {...bind(formik, 'dob')} label="Date of birth" type="date" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField {...bind(formik, 'gender')} select label="Gender">
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField {...bind(formik, 'religion')} select label="Religion">
              <MenuItem value="Islam">Islam</MenuItem>
              <MenuItem value="Christianity">Christianity</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...bind(formik, 'phoneNumber')} label="Phone number" inputProps={{ inputMode: 'numeric', maxLength: 11 }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField {...bind(formik, 'nin', 'Optional')} label="NIN" inputProps={{ inputMode: 'numeric', maxLength: 11 }} />
          </Grid>
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <Divider textAlign="left">
          <Typography variant="overline">Origin & residence</Typography>
        </Divider>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField {...bind(formik, 'stateOfOrigin')} select label="State of origin" onChange={changeState('stateOfOrigin', 'lgaOfOrigin')}>
          {stateList.map(({ state }) => (
            <MenuItem key={state} value={state}>
              {state}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField {...bind(formik, 'lgaOfOrigin')} select label="LGA of origin" disabled={!values.stateOfOrigin}>
          {lgasOf(values.stateOfOrigin).map((lga) => (
            <MenuItem key={lga} value={lga}>
              {lga}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField {...bind(formik, 'stateOfResidence')} select label="State of residence" onChange={changeState('stateOfResidence', 'lgaOfResidence')}>
          {stateList.map(({ state }) => (
            <MenuItem key={state} value={state}>
              {state}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField {...bind(formik, 'lgaOfResidence')} select label="LGA of residence" disabled={!values.stateOfResidence}>
          {lgasOf(values.stateOfResidence).map((lga) => (
            <MenuItem key={lga} value={lga}>
              {lga}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={12}>
        <TextField {...bind(formik, 'address')} label="Residential address" multiline minRows={2} />
      </Grid>
    </Grid>
  );
}

BioDataStep.propTypes = { formik: formikShape };

// ----------------------------------------------------------------------

export function ExaminationsStep({ formik }) {
  const exams = formik.values.examinations;
  const listError = typeof formik.errors.examinations === 'string' ? formik.errors.examinations : null;

  return (
    <Stack spacing={2}>
      {listError && <Alert severity="error">{listError}</Alert>}
      {exams.map((exam, index) => (
        <Box key={index} sx={{ p: 2, borderRadius: 1.5, border: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Sitting {index + 1}</Typography>
            {exams.length > 1 && (
              <IconButton
                size="small"
                aria-label="Remove sitting"
                onClick={() => formik.setFieldValue('examinations', exams.filter((_, i) => i !== index))}
              >
                <Iconify icon="eva:trash-2-outline" />
              </IconButton>
            )}
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField {...bind(formik, `examinations[${index}].school`)} label="School" />
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <TextField {...bind(formik, `examinations[${index}].examType`)} select label="Exam type">
                {EXAM_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <TextField
                {...bind(formik, `examinations[${index}].examNumber`)}
                label="Exam number"
                disabled={exam.examType === 'primary'}
              />
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <TextField {...bind(formik, `examinations[${index}].examYear`)} label="Year" inputProps={{ inputMode: 'numeric', maxLength: 4 }} />
            </Grid>
          </Grid>
        </Box>
      ))}
      {exams.length < 2 && (
        <Box>
          <Button startIcon={<Iconify icon="eva:plus-fill" />} onClick={() => formik.setFieldValue('examinations', [...exams, emptyExam()])}>
            Add second sitting
          </Button>
        </Box>
      )}
    </Stack>
  );
}

ExaminationsStep.propTypes = { formik: formikShape };

// ----------------------------------------------------------------------

export function ResultsStep({ formik }) {
  const rows = formik.values.result;
  const listError = typeof formik.errors.result === 'string' ? formik.errors.result : null;

  const optionsFor = (index) => {
    const taken = rows.filter((_, i) => i !== index).map((row) => row.subject);
    return SUBJECTS.filter((subject) => !taken.includes(subject));
  };

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        Nine subjects across at most two sittings. The first {FIXED_SUBJECTS} subjects are compulsory.
      </Alert>
      {listError && <Alert severity="error">{listError}</Alert>}
      {rows.map((row, index) => (
        <Grid container spacing={2} key={index} alignItems="flex-start">
          <Grid item xs={8} sm={9}>
            <TextField
              {...bind(formik, `result[${index}].subject`)}
              select
              size="small"
              label={`Subject ${index + 1}`}
              disabled={index < FIXED_SUBJECTS}
            >
              {(index < FIXED_SUBJECTS ? [row.subject] : optionsFor(index)).map((subject) => (
                <MenuItem key={subject} value={subject}>
                  {subject}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={4} sm={3}>
            <TextField {...bind(formik, `result[${index}].result`)} select size="small" label="Grade">
              {GRADES.map((grade) => (
                <MenuItem key={grade} value={grade}>
                  {grade}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      ))}
    </Stack>
  );
}

ResultsStep.propTypes = { formik: formikShape };

// ----------------------------------------------------------------------

const Row = ({ label, value }) => (
  <Stack direction="row" spacing={2} sx={{ py: 0.5 }}>
    <Typography variant="body2" color="text.secondary" sx={{ width: 160, flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2">{value || '—'}</Typography>
  </Stack>
);

Row.propTypes = { label: PropTypes.string, value: PropTypes.node };

export function ReviewStep({ values, programme, session }) {
  const examLabel = (type) => EXAM_TYPES.find((t) => t.value === type)?.label ?? type;
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Avatar variant="rounded" src={values.photo} sx={{ width: 140, height: 140 }} />
      </Grid>
      <Grid item xs={12} md={9}>
        <Row label="Email" value={values.email} />
        <Row label="Programme" value={programme?.name} />
        <Row label="Application fee" value={programme ? `₦${Number(programme.price || 0).toLocaleString()}` : ''} />
        <Row label="Session" value={session?.name} />
        <Divider sx={{ my: 1 }} />
        <Row label="Name" value={[values.firstName, values.otherName, values.lastName].filter(Boolean).join(' ')} />
        <Row label="Gender / religion" value={`${values.gender} · ${values.religion}`} />
        <Row label="Date of birth" value={values.dob} />
        <Row label="Phone" value={values.phoneNumber} />
        <Row label="NIN" value={values.nin} />
        <Row label="Origin" value={`${values.lgaOfOrigin}, ${values.stateOfOrigin}`} />
        <Row label="Residence" value={`${values.lgaOfResidence}, ${values.stateOfResidence}`} />
        <Row label="Address" value={values.address} />
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Examinations
        </Typography>
        {values.examinations.map((exam, index) => (
          <Typography key={index} variant="body2">
            {examLabel(exam.examType)} {exam.examYear} — {exam.school}
            {exam.examNumber ? ` (${exam.examNumber})` : ''}
          </Typography>
        ))}
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          O-level results
        </Typography>
        {values.result.map((row) => (
          <Stack key={row.subject} direction="row" justifyContent="space-between">
            <Typography variant="body2">{row.subject}</Typography>
            <Typography variant="body2" fontWeight={600}>
              {row.result}
            </Typography>
          </Stack>
        ))}
      </Grid>
    </Grid>
  );
}

ReviewStep.propTypes = {
  values: PropTypes.object,
  programme: PropTypes.object,
  session: PropTypes.object,
};
