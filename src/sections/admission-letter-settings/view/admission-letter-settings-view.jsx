import * as Yup from 'yup';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Grid,
  Stack,
  Alert,
  Button,
  Divider,
  Tooltip,
  Checkbox,
  TextField,
  Container,
  Accordion,
  IconButton,
  Typography,
  LinearProgress,
  FormControlLabel,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import { PERMISSIONS } from 'src/permissions/constants';
import { getLetterSettings, resetLetterSettings, updateLetterSettings } from 'src/api/adminApplicationApi';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

// ----------------------------------------------------------------------

const TOKEN_HELP =
  'Placeholders: {{applicantName}} {{applicationId}} {{admissionNumber}} {{date}} {{programmeName}} ' +
  '{{programmeCode}} {{programmeTitle}} {{professionalTitle}} {{set}} {{duration}} {{modeOfStudy}} ' +
  '{{sessionName}} {{acceptanceFee}} {{acceptanceFeeDeadline}} {{registrationOpens}} {{registrationCloses}} ' +
  '{{lateRegistrationOpens}} {{lateRegistrationCloses}} {{institutionName}} {{institutionShortName}}. ' +
  'Wrap text in [[ ... ]] to drop it entirely when a placeholder inside it has no value.';

const validationSchema = Yup.object({
  branding: Yup.object({
    watermarkOpacity: Yup.number().min(0, 'Must be 0 or more').max(1, 'Must be 1 or less'),
    watermarkWidth: Yup.number().positive('Must be positive'),
    logoHeight: Yup.number().positive('Must be positive'),
  }),
  institution: Yup.object({
    name: Yup.string().required('Institution name is required'),
  }),
  letter: Yup.object({
    title: Yup.string().required('Letter title is required'),
  }),
});

// ----------------------------------------------------------------------

/** Add/remove/reorder editor for the document and note lists. */
function ListEditor({ label, helper, items, onChange }) {
  const update = (index, value) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };
  const remove = (index) => onChange(items.filter((_, i) => i !== index));
  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{label}</Typography>
      {helper && (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      )}
      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No entries yet.
        </Typography>
      )}
      {items.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
          <TextField
            fullWidth
            multiline
            size="small"
            value={item}
            onChange={(e) => update(index, e.target.value)}
          />
          <Tooltip title="Move up">
            <span>
              <IconButton size="small" disabled={index === 0} onClick={() => move(index, -1)}>
                <Iconify icon="eva:arrow-up-fill" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move down">
            <span>
              <IconButton
                size="small"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <Iconify icon="eva:arrow-down-fill" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Remove">
            <IconButton size="small" color="error" onClick={() => remove(index)}>
              <Iconify icon="eva:trash-2-outline" />
            </IconButton>
          </Tooltip>
        </Stack>
      ))}
      <Box>
        <Button size="small" startIcon={<Iconify icon="eva:plus-fill" />} onClick={() => onChange([...items, ''])}>
          Add
        </Button>
      </Box>
    </Stack>
  );
}

ListEditor.propTypes = {
  label: PropTypes.string,
  helper: PropTypes.string,
  items: PropTypes.array,
  onChange: PropTypes.func,
};

// ----------------------------------------------------------------------

export default function AdmissionLetterSettingsView() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [expanded, setExpanded] = useState('branding');

  const { data: result, isLoading } = useQuery({
    queryKey: ['letter-settings'],
    queryFn: () => getLetterSettings(),
  });

  const settings = result?.data;

  const updateMutation = useMutation({
    mutationFn: (values) => updateLetterSettings(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admission-letter-preview'] });
      enqueueSnackbar('Admission letter settings saved', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(error?.message || 'Error saving settings', { variant: 'error' }),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetLetterSettings(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admission-letter-preview'] });
      enqueueSnackbar('Admission letter settings reset to defaults', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(error?.message || 'Error resetting settings', { variant: 'error' }),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      branding: {
        logoUrl: settings?.branding?.logoUrl || '',
        letterheadUrl: settings?.branding?.letterheadUrl || '',
        watermarkUrl: settings?.branding?.watermarkUrl || '',
        signatureImageUrl: settings?.branding?.signatureImageUrl || '',
        showLetterhead: settings?.branding?.showLetterhead ?? false,
        showWatermark: settings?.branding?.showWatermark ?? true,
        watermarkOpacity: settings?.branding?.watermarkOpacity ?? 0.07,
        watermarkWidth: settings?.branding?.watermarkWidth ?? 380,
        logoHeight: settings?.branding?.logoHeight ?? 84,
        primaryColor: settings?.branding?.primaryColor || '',
        headingColor: settings?.branding?.headingColor || '',
        bodyColor: settings?.branding?.bodyColor || '',
        borderAccentColor: settings?.branding?.borderAccentColor || '',
      },
      institution: {
        name: settings?.institution?.name || '',
        shortName: settings?.institution?.shortName || '',
        address: settings?.institution?.address || '',
        location: settings?.institution?.location || '',
        phone: settings?.institution?.phone || '',
        email: settings?.institution?.email || '',
        website: settings?.institution?.website || '',
      },
      signatory: {
        name: settings?.signatory?.name || '',
        honorifics: settings?.signatory?.honorifics || '',
        subtitle: settings?.signatory?.subtitle || '',
        title: settings?.signatory?.title || '',
      },
      letter: {
        title: settings?.letter?.title || '',
        introParagraph: settings?.letter?.introParagraph || '',
        basisParagraph: settings?.letter?.basisParagraph || '',
        programDetailsHeading: settings?.letter?.programDetailsHeading || '',
        conditionsHeading: settings?.letter?.conditionsHeading || '',
        acceptanceFeeClause: settings?.letter?.acceptanceFeeClause || '',
        documentsIntro: settings?.letter?.documentsIntro || '',
        documents: settings?.letter?.documents || [],
        notesHeading: settings?.letter?.notesHeading || '',
        notes: settings?.letter?.notes || [],
        closingParagraph: settings?.letter?.closingParagraph || '',
        signOff: settings?.letter?.signOff || '',
        enclosure: settings?.letter?.enclosure || '',
        labels: {
          name: settings?.letter?.labels?.name || '',
          applicationId: settings?.letter?.labels?.applicationId || '',
          date: settings?.letter?.labels?.date || '',
          duration: settings?.letter?.labels?.duration || '',
          session: settings?.letter?.labels?.session || '',
          set: settings?.letter?.labels?.set || '',
          modeOfStudy: settings?.letter?.labels?.modeOfStudy || '',
          registrationOpens: settings?.letter?.labels?.registrationOpens || '',
          registrationCloses: settings?.letter?.labels?.registrationCloses || '',
          lateRegistrationOpens: settings?.letter?.labels?.lateRegistrationOpens || '',
          lateRegistrationCloses: settings?.letter?.labels?.lateRegistrationCloses || '',
          enclosure: settings?.letter?.labels?.enclosure || '',
        },
      },
      currency: {
        code: settings?.currency?.code || 'NGN',
        symbol: settings?.currency?.symbol || '₦',
      },
      fileNameTemplate: settings?.fileNameTemplate || '',
    },
    validationSchema,
    onSubmit: (values) => updateMutation.mutate(values),
  });

  const handleSection = (section) => (event, isExpanded) => setExpanded(isExpanded ? section : false);

  const text = (name, label, extra = {}) => (
    <TextField
      fullWidth
      size="small"
      name={name}
      label={label}
      value={name.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), formik.values) ?? ''}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      {...extra}
    />
  );

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 5 }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Admission Letter
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Branding and wording used to generate every admission letter
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Can do={PERMISSIONS.EDIT_ADMISSION}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:refresh-fill" />}
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
              >
                Reset to defaults
              </Button>
            </Can>
            <Can do={PERMISSIONS.EDIT_ADMISSION}>
              <LoadingButton
                variant="contained"
                loading={updateMutation.isPending}
                onClick={formik.handleSubmit}
                startIcon={<Iconify icon="eva:save-fill" />}
              >
                Save changes
              </LoadingButton>
            </Can>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ mb: 3 }}>
          Registration dates and the set (e.g. &quot;Set VI&quot;) are not configured here — they belong to
          each intake and are edited on the Session page. Everything below applies to all letters.
        </Alert>

        <Card sx={{ p: 0 }}>
          <form onSubmit={formik.handleSubmit}>
            {/* ---- Branding ---- */}
            <Accordion expanded={expanded === 'branding'} onChange={handleSection('branding')} disableGutters>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Typography variant="subtitle1">Logo, letterhead &amp; watermark</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    {text('branding.logoUrl', 'Logo URL or file path', {
                      helperText: 'Shown in the letter header. Leave blank to fall back to TEMPLATE_LOGO_PATH.',
                    })}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {text('branding.watermarkUrl', 'Watermark URL or file path', {
                      helperText: 'Defaults to the logo when blank.',
                    })}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {text('branding.letterheadUrl', 'Letterhead image URL or file path', {
                      helperText: 'Only used when "Use letterhead image" is ticked.',
                    })}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {text('branding.signatureImageUrl', 'Signature image URL or file path')}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="branding.showLetterhead"
                          checked={formik.values.branding.showLetterhead}
                          onChange={formik.handleChange}
                        />
                      }
                      label="Use letterhead image instead of the composed header"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="branding.showWatermark"
                          checked={formik.values.branding.showWatermark}
                          onChange={formik.handleChange}
                        />
                      }
                      label="Show watermark on every page"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    {text('branding.watermarkOpacity', 'Watermark opacity (0–1)', {
                      type: 'number',
                      inputProps: { step: 0.01, min: 0, max: 1 },
                      error: Boolean(formik.touched.branding?.watermarkOpacity && formik.errors.branding?.watermarkOpacity),
                      helperText: formik.touched.branding?.watermarkOpacity && formik.errors.branding?.watermarkOpacity,
                    })}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    {text('branding.watermarkWidth', 'Watermark width (px)', { type: 'number' })}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    {text('branding.logoHeight', 'Header logo height (px)', { type: 'number' })}
                  </Grid>

                  <Grid item xs={12} md={3}>{text('branding.primaryColor', 'Primary colour')}</Grid>
                  <Grid item xs={12} md={3}>{text('branding.headingColor', 'Heading colour')}</Grid>
                  <Grid item xs={12} md={3}>{text('branding.bodyColor', 'Body colour')}</Grid>
                  <Grid item xs={12} md={3}>{text('branding.borderAccentColor', 'Accent rule colour')}</Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Divider />

            {/* ---- Institution ---- */}
            <Accordion expanded={expanded === 'institution'} onChange={handleSection('institution')} disableGutters>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Typography variant="subtitle1">Institution</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    {text('institution.name', 'Institution name', {
                      required: true,
                      error: Boolean(formik.touched.institution?.name && formik.errors.institution?.name),
                      helperText: formik.touched.institution?.name && formik.errors.institution?.name,
                    })}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    {text('institution.shortName', 'Short name', { helperText: 'Used in the PDF filename.' })}
                  </Grid>
                  <Grid item xs={12} md={6}>{text('institution.address', 'Address')}</Grid>
                  <Grid item xs={12} md={6}>{text('institution.location', 'Location')}</Grid>
                  <Grid item xs={12} md={4}>{text('institution.phone', 'Phone')}</Grid>
                  <Grid item xs={12} md={4}>{text('institution.email', 'Email')}</Grid>
                  <Grid item xs={12} md={4}>{text('institution.website', 'Website')}</Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Divider />

            {/* ---- Signatory ---- */}
            <Accordion expanded={expanded === 'signatory'} onChange={handleSection('signatory')} disableGutters>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Typography variant="subtitle1">Signatory</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    {text('signatory.name', 'Name', { helperText: 'e.g. Mallam Usman Alhaji Saleh' })}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {text('signatory.honorifics', 'Honorifics', { helperText: 'e.g. Amb. P, MIPAM, MNAEP, FCPA' })}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {text('signatory.subtitle', 'Subtitle', {
                      helperText: 'Printed in brackets, e.g. Wakilin Tsaftar Fika',
                    })}
                  </Grid>
                  <Grid item xs={12} md={6}>{text('signatory.title', 'Title', { helperText: 'e.g. Registrar' })}</Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Divider />

            {/* ---- Letter content ---- */}
            <Accordion expanded={expanded === 'content'} onChange={handleSection('content')} disableGutters>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Typography variant="subtitle1">Letter content</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {TOKEN_HELP}
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    {text('letter.title', 'Letter title', {
                      required: true,
                      error: Boolean(formik.touched.letter?.title && formik.errors.letter?.title),
                      helperText: formik.touched.letter?.title && formik.errors.letter?.title,
                    })}
                  </Grid>
                  <Grid item xs={12} md={6}>{text('letter.signOff', 'Sign-off line (optional)')}</Grid>

                  <Grid item xs={12}>
                    {text('letter.introParagraph', 'Opening paragraph', { multiline: true, minRows: 2 })}
                  </Grid>
                  <Grid item xs={12}>
                    {text('letter.basisParagraph', 'Basis-of-admission paragraph', { multiline: true, minRows: 2 })}
                  </Grid>

                  <Grid item xs={12} md={6}>{text('letter.programDetailsHeading', 'Program details heading')}</Grid>
                  <Grid item xs={12} md={6}>{text('letter.conditionsHeading', 'Conditions heading')}</Grid>

                  <Grid item xs={12}>
                    {text('letter.acceptanceFeeClause', 'Acceptance fee clause', { multiline: true, minRows: 2 })}
                  </Grid>
                  <Grid item xs={12}>{text('letter.documentsIntro', 'Documents intro line')}</Grid>

                  <Grid item xs={12}>
                    <ListEditor
                      label="Required documents"
                      helper="Used when an admission has no per-student requirements list of its own."
                      items={formik.values.letter.documents}
                      onChange={(next) => formik.setFieldValue('letter.documents', next)}
                    />
                  </Grid>

                  <Grid item xs={12}>{text('letter.notesHeading', 'Important notes heading')}</Grid>
                  <Grid item xs={12}>
                    <ListEditor
                      label="Important notes"
                      items={formik.values.letter.notes}
                      onChange={(next) => formik.setFieldValue('letter.notes', next)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    {text('letter.closingParagraph', 'Closing paragraph', { multiline: true, minRows: 2 })}
                  </Grid>
                  <Grid item xs={12} md={6}>{text('letter.enclosure', 'Enclosure')}</Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Divider />

            {/* ---- Labels ---- */}
            <Accordion expanded={expanded === 'labels'} onChange={handleSection('labels')} disableGutters>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Typography variant="subtitle1">Field labels</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>{text('letter.labels.name', 'Name label')}</Grid>
                  <Grid item xs={12} md={4}>{text('letter.labels.applicationId', 'Application ID label')}</Grid>
                  <Grid item xs={12} md={4}>{text('letter.labels.date', 'Date label')}</Grid>
                  <Grid item xs={12} md={4}>{text('letter.labels.duration', 'Duration label')}</Grid>
                  <Grid item xs={12} md={4}>{text('letter.labels.session', 'Session label')}</Grid>
                  <Grid item xs={12} md={4}>{text('letter.labels.set', 'Set label')}</Grid>
                  <Grid item xs={12} md={4}>{text('letter.labels.modeOfStudy', 'Mode of study label')}</Grid>
                  <Grid item xs={12} md={4}>{text('letter.labels.registrationOpens', 'Registration opens label')}</Grid>
                  <Grid item xs={12} md={4}>{text('letter.labels.registrationCloses', 'Registration closes label')}</Grid>
                  <Grid item xs={12} md={4}>
                    {text('letter.labels.lateRegistrationOpens', 'Late registration opens label')}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    {text('letter.labels.lateRegistrationCloses', 'Late registration closes label')}
                  </Grid>
                  <Grid item xs={12} md={4}>{text('letter.labels.enclosure', 'Enclosure label')}</Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Divider />

            {/* ---- Output ---- */}
            <Accordion expanded={expanded === 'output'} onChange={handleSection('output')} disableGutters>
              <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                <Typography variant="subtitle1">Currency &amp; file name</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>{text('currency.code', 'Currency code')}</Grid>
                  <Grid item xs={12} md={3}>{text('currency.symbol', 'Currency symbol')}</Grid>
                  <Grid item xs={12} md={6}>
                    {text('fileNameTemplate', 'Download file name', {
                      helperText: 'Supports {institution}, {applicant}, {admissionNumber}, {applicationId}.',
                    })}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </form>
        </Card>
      </Box>
    </Container>
  );
}
