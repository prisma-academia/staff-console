import { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Grid,
  Stack,
  Alert,
  Drawer,
  Divider,
  Checkbox,
  TextField,
  Accordion,
  IconButton,
  Typography,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import ListEditor from './list-editor';

// ----------------------------------------------------------------------

const SECTIONS = [
  { id: 'branding', title: 'Logo, letterhead & watermark' },
  { id: 'institution', title: 'Institution' },
  { id: 'signatory', title: 'Signatory' },
  { id: 'lists', title: 'Documents & notes' },
  { id: 'labels', title: 'Field labels' },
  { id: 'output', title: 'Currency & file name' },
];

// ----------------------------------------------------------------------

/**
 * Everything about the letter that is not the body text.
 *
 * These values feed the page chrome (header, watermark) and the dynamic blocks
 * the author drops into the document, so they belong beside the editor rather
 * than in it — a drawer keeps the writing surface and its preview full-width.
 */
export default function LetterSettingsDrawer({ open, onClose, formik, disabled }) {
  const [expanded, setExpanded] = useState('branding');

  const handleSection = (section) => (event, isExpanded) => setExpanded(isExpanded ? section : false);

  const text = (name, label, extra = {}) => (
    <TextField
      fullWidth
      size="small"
      name={name}
      label={label}
      disabled={disabled}
      value={name.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), formik.values) ?? ''}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      {...extra}
    />
  );

  const checkbox = (name, label) => (
    <FormControlLabel
      control={
        <Checkbox
          name={name}
          disabled={disabled}
          checked={Boolean(name.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), formik.values))}
          onChange={formik.handleChange}
        />
      }
      label={label}
    />
  );

  const section = (id, children) => (
    <Accordion expanded={expanded === id} onChange={handleSection(id)} disableGutters>
      <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
        <Typography variant="subtitle1">{SECTIONS.find((item) => item.id === id).title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{children}</AccordionDetails>
    </Accordion>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: 1, sm: 520 } } } }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Box>
          <Typography variant="h6">Design &amp; data</Typography>
          <Typography variant="caption" color="text.secondary">
            Branding, institution details and the lists the blocks print
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </Stack>

      <Box sx={{ overflowY: 'auto' }}>
        <Alert severity="info" sx={{ m: 2 }}>
          Registration dates and the set (e.g. &quot;Set VI&quot;) are not configured here — they belong to each
          intake and are edited on the Session page.
        </Alert>

        {section(
          'branding',
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {text('branding.logoUrl', 'Logo URL or file path', {
                helperText: 'Shown in the letter header. Leave blank to fall back to TEMPLATE_LOGO_PATH.',
              })}
            </Grid>
            <Grid item xs={12}>
              {text('branding.watermarkUrl', 'Watermark URL or file path', {
                helperText: 'Defaults to the logo when blank.',
              })}
            </Grid>
            <Grid item xs={12}>
              {text('branding.letterheadUrl', 'Letterhead image URL or file path', {
                helperText: 'Only used when "Use letterhead image" is ticked.',
              })}
            </Grid>
            <Grid item xs={12}>
              {text('branding.signatureImageUrl', 'Signature image URL or file path', {
                helperText: 'Printed by the Signature block.',
              })}
            </Grid>

            <Grid item xs={12}>
              {checkbox('branding.showLetterhead', 'Use letterhead image instead of the composed header')}
            </Grid>
            <Grid item xs={12}>{checkbox('branding.showWatermark', 'Show watermark on every page')}</Grid>

            <Grid item xs={12} sm={4}>
              {text('branding.watermarkOpacity', 'Watermark opacity', {
                type: 'number',
                inputProps: { step: 0.01, min: 0, max: 1 },
                error: Boolean(formik.touched.branding?.watermarkOpacity && formik.errors.branding?.watermarkOpacity),
                helperText: formik.touched.branding?.watermarkOpacity && formik.errors.branding?.watermarkOpacity,
              })}
            </Grid>
            <Grid item xs={12} sm={4}>
              {text('branding.watermarkWidth', 'Watermark width (px)', { type: 'number' })}
            </Grid>
            <Grid item xs={12} sm={4}>
              {text('branding.logoHeight', 'Logo height (px)', { type: 'number' })}
            </Grid>

            <Grid item xs={6} sm={3}>{text('branding.primaryColor', 'Primary')}</Grid>
            <Grid item xs={6} sm={3}>{text('branding.headingColor', 'Heading')}</Grid>
            <Grid item xs={6} sm={3}>{text('branding.bodyColor', 'Body')}</Grid>
            <Grid item xs={6} sm={3}>{text('branding.borderAccentColor', 'Accent')}</Grid>
          </Grid>
        )}

        <Divider />

        {section(
          'institution',
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              {text('institution.name', 'Institution name', {
                required: true,
                error: Boolean(formik.touched.institution?.name && formik.errors.institution?.name),
                helperText: formik.touched.institution?.name && formik.errors.institution?.name,
              })}
            </Grid>
            <Grid item xs={12} sm={4}>
              {text('institution.shortName', 'Short name', { helperText: 'Used in the PDF filename.' })}
            </Grid>
            <Grid item xs={12} sm={6}>{text('institution.address', 'Address')}</Grid>
            <Grid item xs={12} sm={6}>{text('institution.location', 'Location')}</Grid>
            <Grid item xs={12} sm={4}>{text('institution.phone', 'Phone')}</Grid>
            <Grid item xs={12} sm={4}>{text('institution.email', 'Email')}</Grid>
            <Grid item xs={12} sm={4}>{text('institution.website', 'Website')}</Grid>
          </Grid>
        )}

        <Divider />

        {section(
          'signatory',
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              {text('signatory.name', 'Name', { helperText: 'e.g. Mallam Usman Alhaji Saleh' })}
            </Grid>
            <Grid item xs={12} sm={6}>
              {text('signatory.honorifics', 'Honorifics', { helperText: 'e.g. Amb. P, MIPAM, FCPA' })}
            </Grid>
            <Grid item xs={12} sm={6}>
              {text('signatory.subtitle', 'Subtitle', { helperText: 'Printed in brackets.' })}
            </Grid>
            <Grid item xs={12} sm={6}>{text('signatory.title', 'Title', { helperText: 'e.g. Registrar' })}</Grid>
          </Grid>
        )}

        <Divider />

        {section(
          'lists',
          <Stack spacing={3}>
            <ListEditor
              label="Required documents"
              helper="Printed by the Required documents block. A per-student list set at batch-offer time wins over this one."
              items={formik.values.letter.documents}
              disabled={disabled}
              onChange={(next) => formik.setFieldValue('letter.documents', next)}
            />
            <Divider />
            <ListEditor
              label="Important notes"
              helper="Printed by the Important notes block."
              items={formik.values.letter.notes}
              disabled={disabled}
              onChange={(next) => formik.setFieldValue('letter.notes', next)}
            />
          </Stack>
        )}

        <Divider />

        {section(
          'labels',
          <Stack spacing={2}>
            <Typography variant="caption" color="text.secondary">
              The bold labels printed by the Recipient header and Programme details blocks.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>{text('letter.labels.name', 'Name')}</Grid>
              <Grid item xs={12} sm={6}>{text('letter.labels.applicationId', 'Application ID')}</Grid>
              <Grid item xs={12} sm={6}>{text('letter.labels.date', 'Date')}</Grid>
              <Grid item xs={12} sm={6}>{text('letter.labels.duration', 'Duration')}</Grid>
              <Grid item xs={12} sm={6}>{text('letter.labels.session', 'Session')}</Grid>
              <Grid item xs={12} sm={6}>{text('letter.labels.set', 'Set')}</Grid>
              <Grid item xs={12} sm={6}>{text('letter.labels.modeOfStudy', 'Mode of study')}</Grid>
              <Grid item xs={12} sm={6}>{text('letter.labels.registrationOpens', 'Registration opens')}</Grid>
              <Grid item xs={12} sm={6}>{text('letter.labels.registrationCloses', 'Registration closes')}</Grid>
              <Grid item xs={12} sm={6}>{text('letter.labels.lateRegistrationOpens', 'Late reg. opens')}</Grid>
              <Grid item xs={12} sm={6}>{text('letter.labels.lateRegistrationCloses', 'Late reg. closes')}</Grid>
              <Grid item xs={12} sm={6}>{text('letter.labels.enclosure', 'Enclosure')}</Grid>
            </Grid>
          </Stack>
        )}

        <Divider />

        {section(
          'output',
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>{text('currency.code', 'Currency code')}</Grid>
            <Grid item xs={6} sm={3}>{text('currency.symbol', 'Symbol')}</Grid>
            <Grid item xs={12} sm={6}>
              {text('letter.title', 'Document title', {
                helperText: 'Used for the browser/PDF title, not printed in the letter body.',
              })}
            </Grid>
            <Grid item xs={12}>
              {text('fileNameTemplate', 'Download file name', {
                helperText: 'Supports {institution}, {applicant}, {admissionNumber}, {applicationId}.',
              })}
            </Grid>
          </Grid>
        )}
      </Box>
    </Drawer>
  );
}

LetterSettingsDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  formik: PropTypes.object,
  disabled: PropTypes.bool,
};
