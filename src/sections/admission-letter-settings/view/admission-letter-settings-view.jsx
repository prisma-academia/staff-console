import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Chip,
  Card,
  Stack,
  Alert,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  DialogContentText,
} from '@mui/material';

import { PERMISSIONS } from 'src/permissions/constants';
import {
  getLetterSettings,
  getLetterVariables,
  resetLetterSettings,
  updateLetterSettings,
  previewLetterSettings,
} from 'src/api/adminApplicationApi';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import LetterEditor from '../editor/letter-editor';
import LetterPreview from '../preview/letter-preview';
import LetterSettingsDrawer from '../settings/letter-settings-drawer';

// ----------------------------------------------------------------------

const PREVIEW_DEBOUNCE_MS = 600;

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
    bodyHtml: Yup.string().required('The letter cannot be empty'),
  }),
});

/**
 * Every variable the body refers to, whether inserted as a chip or typed by
 * hand. Mirrors `collectVariableKeys` on the server.
 */
const collectVariableKeys = (html) => {
  const keys = new Set();
  String(html || '').replace(/data-var=["']([\w.]+)["']/g, (_match, key) => keys.add(key));
  String(html || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key) => keys.add(key));
  return Array.from(keys);
};

// ----------------------------------------------------------------------

export default function AdmissionLetterSettingsView() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [admissionId, setAdmissionId] = useState(null);

  const { data: result, isLoading } = useQuery({
    queryKey: ['letter-settings'],
    queryFn: () => getLetterSettings(),
  });

  const { data: variableResult } = useQuery({
    queryKey: ['letter-variables'],
    queryFn: () => getLetterVariables(),
    staleTime: Infinity,
  });

  const settings = result?.data;
  const variables = useMemo(() => variableResult?.data || [], [variableResult]);

  const updateMutation = useMutation({
    mutationFn: (values) => updateLetterSettings(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admission-letter-preview'] });
      enqueueSnackbar('Admission letter saved', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(error?.message || 'Error saving settings', { variant: 'error' }),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetLetterSettings(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['letter-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admission-letter-preview'] });
      setResetOpen(false);
      enqueueSnackbar('Admission letter reset to defaults', { variant: 'success' });
    },
    onError: (error) => enqueueSnackbar(error?.message || 'Error resetting settings', { variant: 'error' }),
  });

  const previewMutation = useMutation({
    mutationFn: (payload) => previewLetterSettings(payload),
    onSuccess: (response) => setPreviewHtml(response?.data?.html || ''),
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
        // An install that predates the editor has no body yet; the API sends a
        // document composed from its existing structured wording so the author
        // starts from their current letter rather than a blank page.
        bodyHtml: settings?.letter?.bodyHtml || result?.starterBodyHtml || '',
        title: settings?.letter?.title || '',
        documents: settings?.letter?.documents || [],
        notes: settings?.letter?.notes || [],
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

  const { values, dirty } = formik;

  // --- Live preview -----------------------------------------------------
  // Values are read through a ref so the debounce timer never fires with a
  // stale draft, and the effect keys off a serialised copy so it re-arms on any
  // change — body text, branding or the chosen admission alike.
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const previewRef = useRef(previewMutation.mutate);
  previewRef.current = previewMutation.mutate;

  const previewKey = useMemo(() => JSON.stringify(values), [values]);

  const refreshPreview = useCallback(() => {
    previewRef.current({ settings: valuesRef.current, admissionId });
  }, [admissionId]);

  useEffect(() => {
    if (isLoading) return undefined;
    const timer = setTimeout(refreshPreview, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [previewKey, admissionId, isLoading, refreshPreview]);

  // --- Guards -----------------------------------------------------------
  // The router here is a plain BrowserRouter, so there is no data-router
  // blocker to hook into; this catches the tab-close case and the header shows
  // an explicit unsaved badge for in-app navigation.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const unknownVariables = useMemo(
    () => collectVariableKeys(values.letter.bodyHtml).filter((key) => !variables.some((item) => item.key === key)),
    [values.letter.bodyHtml, variables]
  );

  const busy = updateMutation.isPending || resetMutation.isPending;

  if (isLoading) {
    return (
      <Box sx={{ py: 5, px: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pt: 3, pb: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ---- Header ---- */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h4" fontWeight={700}>
              Admission Letter
            </Typography>
            {dirty && <Chip size="small" color="warning" variant="soft" label="Unsaved changes" />}
          </Stack>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Write the letter exactly as it should print. Type <strong>{'{{'}</strong> to insert a variable.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="eva:options-2-outline" />}
            onClick={() => setDrawerOpen(true)}
          >
            Design &amp; data
          </Button>

          <Can do={PERMISSIONS.EDIT_ADMISSION}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="eva:refresh-fill" />}
              onClick={() => setResetOpen(true)}
              disabled={busy}
            >
              Reset
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

      {formik.submitCount > 0 && Object.keys(formik.errors).length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formik.errors.institution?.name || formik.errors.letter?.bodyHtml || 'Some settings need attention.'}
        </Alert>
      )}

      {unknownVariables.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <span>These variables cannot be resolved and will print as nothing:</span>
            {unknownVariables.map((key) => (
              <Chip key={key} size="small" color="warning" variant="outlined" label={`{{${key}}}`} />
            ))}
          </Stack>
        </Alert>
      )}

      {/* ---- Editor + preview ---- */}
      <Card
        sx={{
          flexGrow: 1,
          minHeight: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
          overflow: 'hidden',
        }}
      >
        <Box sx={{ minWidth: 0, minHeight: { xs: '60vh', lg: 0 }, borderRight: { lg: '1px solid' }, borderColor: { lg: 'divider' } }}>
          <Can
            do={PERMISSIONS.EDIT_ADMISSION}
            fallback={
              <LetterEditor value={values.letter.bodyHtml} variables={variables} disabled onChange={() => {}} />
            }
          >
            <LetterEditor
              value={values.letter.bodyHtml}
              variables={variables}
              disabled={busy}
              onChange={(html) => formik.setFieldValue('letter.bodyHtml', html)}
            />
          </Can>
        </Box>

        <Box sx={{ minWidth: 0, minHeight: { xs: '60vh', lg: 0 } }}>
          <LetterPreview
            html={previewHtml}
            isPending={previewMutation.isPending}
            isError={previewMutation.isError}
            error={previewMutation.error}
            admissionId={admissionId}
            onAdmissionChange={setAdmissionId}
            onRefresh={refreshPreview}
          />
        </Box>
      </Card>

      <LetterSettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        formik={formik}
        disabled={busy}
      />

      {/* ---- Reset confirmation ---- */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset the admission letter?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This replaces the letter and every setting with the defaults. Anything you have written here is lost.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setResetOpen(false)}>
            Cancel
          </Button>
          <LoadingButton color="error" variant="contained" loading={resetMutation.isPending} onClick={() => resetMutation.mutate()}>
            Reset
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
