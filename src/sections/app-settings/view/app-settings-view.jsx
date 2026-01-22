import * as Yup from 'yup';
import { useState } from 'react';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Grid,
  Stack,
  alpha,
  Button,
  Dialog,
  Divider,
  useTheme,
  TextField,
  Container,
  Accordion,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
  LinearProgress,
  AccordionSummary,
  AccordionDetails,
  DialogContentText,
} from '@mui/material';

import { SettingsApi } from 'src/api';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import Scrollbar from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const storageTypeOptions = [
  { value: 'local', label: 'Local Storage' },
  { value: 's3', label: 'Amazon S3' },
  { value: 'minio', label: 'MinIO' },
  { value: 'cdn', label: 'CDN' },
];

const validationSchema = Yup.object({
  institution: Yup.object({
    name: Yup.string().required('Institution name is required'),
    fullName: Yup.string().required('Full name is required'),
    shortName: Yup.string(),
    abbreviatedName: Yup.string(),
    email: Yup.string().email('Invalid email').required('Email is required'),
    website: Yup.string().url('Invalid URL').required('Website is required'),
    domain: Yup.string().required('Domain is required'),
    emailDomain: Yup.string(),
    internalEmailDomain: Yup.string().required('Internal email domain is required'),
    emailFromName: Yup.string().required('Email from name is required'),
    emailFromAddress: Yup.string().email('Invalid email').required('Email from address is required'),
    emailReplyTo: Yup.string().email('Invalid email'),
    webDomain: Yup.string().url('Invalid URL').required('Web domain is required'),
    signatory: Yup.object({
      registrarName: Yup.string().required('Registrar name is required'),
      registrarTitle: Yup.string().required('Registrar title is required'),
      registrarEmail: Yup.string().email('Invalid email'),
    }),
  }),
  asset: Yup.object({
    storageType: Yup.string().oneOf(['local', 's3', 'minio', 'cdn']),
    baseUrl: Yup.string().url('Invalid URL').required('Base URL is required'),
    cdnUrl: Yup.string().url('Invalid URL'),
    uploadUrl: Yup.string().url('Invalid URL'),
    templateUrl: Yup.string().url('Invalid URL'),
    pdfUrl: Yup.string().url('Invalid URL'),
    maxFileSize: Yup.string(),
    allowedFileTypes: Yup.array().of(Yup.string()),
    fileNaming: Yup.object({
      paymentReceipt: Yup.string(),
      courseForm: Yup.string(),
      acceptanceLetter: Yup.string(),
      resultTemplate: Yup.string(),
    }),
    staticFiles: Yup.object({
      bondAcceptanceForm: Yup.string().url('Invalid URL'),
      scheduleOfFees: Yup.string().url('Invalid URL'),
    }),
  }),
  pictures: Yup.object({
    logo: Yup.object({
      url: Yup.string().url('Invalid URL').required('Logo URL is required'),
      dimensions: Yup.object({
        email: Yup.object({
          width: Yup.number().positive('Width must be positive'),
          height: Yup.number().positive('Height must be positive'),
        }),
        pdf: Yup.object({
          width: Yup.number().positive('Width must be positive'),
          height: Yup.number().positive('Height must be positive'),
        }),
        watermark: Yup.object({
          width: Yup.number().positive('Width must be positive'),
          height: Yup.number().positive('Height must be positive'),
        }),
      }),
    }),
    letterhead: Yup.object({
      url: Yup.string().url('Invalid URL'),
    }),
    upload: Yup.object({
      qrCode: Yup.object({
        width: Yup.number().positive('Width must be positive'),
        height: Yup.number().positive('Height must be positive'),
      }),
      studentPhoto: Yup.object({
        width: Yup.number().positive('Width must be positive'),
        height: Yup.number().positive('Height must be positive'),
      }),
      maxSize: Yup.string(),
      quality: Yup.object({
        thumbnail: Yup.number().min(0).max(100, 'Quality must be between 0 and 100'),
        full: Yup.number().min(0).max(100, 'Quality must be between 0 and 100'),
      }),
    }),
  }),
});

// ----------------------------------------------------------------------

export default function AppSettingsView() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState('institution');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => SettingsApi.getSettings(),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => SettingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      enqueueSnackbar('Settings updated successfully', { variant: 'success' });
    },
    onError: (error) => {
      const message = error.message || 'Error updating settings';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => SettingsApi.resetSettings(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      enqueueSnackbar('Settings reset to defaults successfully', { variant: 'success' });
      setResetDialogOpen(false);
    },
    onError: (error) => {
      const message = error.message || 'Error resetting settings';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      institution: {
        name: settings?.institution?.name || '',
        fullName: settings?.institution?.fullName || '',
        shortName: settings?.institution?.shortName || '',
        abbreviatedName: settings?.institution?.abbreviatedName || '',
        email: settings?.institution?.email || '',
        website: settings?.institution?.website || '',
        domain: settings?.institution?.domain || '',
        emailDomain: settings?.institution?.emailDomain || '',
        internalEmailDomain: settings?.institution?.internalEmailDomain || '',
        emailFromName: settings?.institution?.emailFromName || '',
        emailFromAddress: settings?.institution?.emailFromAddress || '',
        emailReplyTo: settings?.institution?.emailReplyTo || '',
        webDomain: settings?.institution?.webDomain || '',
        signatory: {
          registrarName: settings?.institution?.signatory?.registrarName || '',
          registrarTitle: settings?.institution?.signatory?.registrarTitle || '',
          registrarEmail: settings?.institution?.signatory?.registrarEmail || '',
        },
      },
      asset: {
        storageType: settings?.asset?.storageType || 'local',
        baseUrl: settings?.asset?.baseUrl || '',
        cdnUrl: settings?.asset?.cdnUrl || '',
        uploadUrl: settings?.asset?.uploadUrl || '',
        templateUrl: settings?.asset?.templateUrl || '',
        pdfUrl: settings?.asset?.pdfUrl || '',
        maxFileSize: settings?.asset?.maxFileSize || '',
        allowedFileTypes: settings?.asset?.allowedFileTypes || [],
        fileNaming: {
          paymentReceipt: settings?.asset?.fileNaming?.paymentReceipt || '',
          courseForm: settings?.asset?.fileNaming?.courseForm || '',
          acceptanceLetter: settings?.asset?.fileNaming?.acceptanceLetter || '',
          resultTemplate: settings?.asset?.fileNaming?.resultTemplate || '',
        },
        staticFiles: {
          bondAcceptanceForm: settings?.asset?.staticFiles?.bondAcceptanceForm || '',
          scheduleOfFees: settings?.asset?.staticFiles?.scheduleOfFees || '',
        },
      },
      pictures: {
        logo: {
          url: settings?.pictures?.logo?.url || '',
          dimensions: {
            email: {
              width: settings?.pictures?.logo?.dimensions?.email?.width || 100,
              height: settings?.pictures?.logo?.dimensions?.email?.height || 100,
            },
            pdf: {
              width: settings?.pictures?.logo?.dimensions?.pdf?.width || 96,
              height: settings?.pictures?.logo?.dimensions?.pdf?.height || 96,
            },
            watermark: {
              width: settings?.pictures?.logo?.dimensions?.watermark?.width || 360,
              height: settings?.pictures?.logo?.dimensions?.watermark?.height || 360,
            },
          },
        },
        letterhead: {
          url: settings?.pictures?.letterhead?.url || '',
        },
        upload: {
          qrCode: {
            width: settings?.pictures?.upload?.qrCode?.width || 96,
            height: settings?.pictures?.upload?.qrCode?.height || 96,
          },
          studentPhoto: {
            width: settings?.pictures?.upload?.studentPhoto?.width || 96,
            height: settings?.pictures?.upload?.studentPhoto?.height || 96,
          },
          maxSize: settings?.pictures?.upload?.maxSize || '',
          quality: {
            thumbnail: settings?.pictures?.upload?.quality?.thumbnail || 70,
            full: settings?.pictures?.upload?.quality?.full || 90,
          },
        },
      },
    },
    validationSchema,
    onSubmit: (values) => {
      updateMutation.mutate(values);
    },
  });

  const handleSectionChange = (section) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? section : false);
  };

  const handleReset = () => {
    resetMutation.mutate();
  };

  const handleAllowedFileTypesChange = (value) => {
    const types = value.split(',').map((t) => t.trim()).filter((t) => t);
    formik.setFieldValue('asset.allowedFileTypes', types);
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Application Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage institution branding, asset URLs, file naming patterns, and image configurations
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Can do="reset_settings">
              <Button
                variant="outlined"
                color="error"
                startIcon={<Iconify icon="eva:refresh-fill" />}
                onClick={() => setResetDialogOpen(true)}
              >
                Reset to Defaults
              </Button>
            </Can>
            <Can do="edit_settings">
              <LoadingButton
                variant="contained"
                color="primary"
                startIcon={<Iconify icon="eva:save-fill" />}
                loading={updateMutation.isPending}
                onClick={formik.handleSubmit}
              >
                Save Changes
              </LoadingButton>
            </Can>
          </Stack>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Can do="view_settings">
          <Card
            elevation={0}
            sx={{
              p: 0,
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: `0 0 24px 0 ${alpha(theme.palette.grey[900], 0.1)}`,
            }}
          >
            <Scrollbar>
              <Box sx={{ p: 3 }}>
                <form onSubmit={formik.handleSubmit}>
                  {/* Institution Information Section */}
                  <Accordion
                    expanded={expandedSection === 'institution'}
                    onChange={handleSectionChange('institution')}
                    sx={{ mb: 2 }}
                  >
                    <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                      <Typography variant="h6">Institution Information</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Institution Name"
                            name="institution.name"
                            value={formik.values.institution.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.institution?.name && Boolean(formik.errors.institution?.name)}
                            helperText={formik.touched.institution?.name && formik.errors.institution?.name}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Full Name"
                            name="institution.fullName"
                            value={formik.values.institution.fullName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.institution?.fullName && Boolean(formik.errors.institution?.fullName)}
                            helperText={formik.touched.institution?.fullName && formik.errors.institution?.fullName}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Short Name"
                            name="institution.shortName"
                            value={formik.values.institution.shortName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Abbreviated Name"
                            name="institution.abbreviatedName"
                            value={formik.values.institution.abbreviatedName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="e.g., Y.I."
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Email"
                            name="institution.email"
                            type="email"
                            value={formik.values.institution.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.institution?.email && Boolean(formik.errors.institution?.email)}
                            helperText={formik.touched.institution?.email && formik.errors.institution?.email}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Website"
                            name="institution.website"
                            value={formik.values.institution.website}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.institution?.website && Boolean(formik.errors.institution?.website)}
                            helperText={formik.touched.institution?.website && formik.errors.institution?.website}
                            placeholder="www.yourinstitution.edu"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Domain"
                            name="institution.domain"
                            value={formik.values.institution.domain}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.institution?.domain && Boolean(formik.errors.institution?.domain)}
                            helperText={formik.touched.institution?.domain && formik.errors.institution?.domain}
                            placeholder="yourinstitution.edu"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Email Domain"
                            name="institution.emailDomain"
                            value={formik.values.institution.emailDomain}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="@yourinstitution.edu"
                            InputProps={{
                              startAdornment: <InputAdornment position="start">@</InputAdornment>,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Internal Email Domain"
                            name="institution.internalEmailDomain"
                            value={formik.values.institution.internalEmailDomain}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.institution?.internalEmailDomain &&
                              Boolean(formik.errors.institution?.internalEmailDomain)
                            }
                            helperText={
                              formik.touched.institution?.internalEmailDomain &&
                              formik.errors.institution?.internalEmailDomain
                            }
                            placeholder="@yourinstitution.edu"
                            InputProps={{
                              startAdornment: <InputAdornment position="start">@</InputAdornment>,
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Email From Name"
                            name="institution.emailFromName"
                            value={formik.values.institution.emailFromName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.institution?.emailFromName &&
                              Boolean(formik.errors.institution?.emailFromName)
                            }
                            helperText={
                              formik.touched.institution?.emailFromName && formik.errors.institution?.emailFromName
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Email From Address"
                            name="institution.emailFromAddress"
                            type="email"
                            value={formik.values.institution.emailFromAddress}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.institution?.emailFromAddress &&
                              Boolean(formik.errors.institution?.emailFromAddress)
                            }
                            helperText={
                              formik.touched.institution?.emailFromAddress &&
                              formik.errors.institution?.emailFromAddress
                            }
                            placeholder="no-reply@yourinstitution.edu"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Email Reply To"
                            name="institution.emailReplyTo"
                            type="email"
                            value={formik.values.institution.emailReplyTo}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.institution?.emailReplyTo &&
                              Boolean(formik.errors.institution?.emailReplyTo)
                            }
                            helperText={
                              formik.touched.institution?.emailReplyTo && formik.errors.institution?.emailReplyTo
                            }
                            placeholder="support@yourinstitution.edu"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Web Domain"
                            name="institution.webDomain"
                            value={formik.values.institution.webDomain}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.institution?.webDomain &&
                              Boolean(formik.errors.institution?.webDomain)
                            }
                            helperText={
                              formik.touched.institution?.webDomain && formik.errors.institution?.webDomain
                            }
                            placeholder="https://yourinstitution.edu"
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Signatory Information
                            </Typography>
                          </Divider>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Registrar Name"
                            name="institution.signatory.registrarName"
                            value={formik.values.institution.signatory.registrarName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.institution?.signatory?.registrarName &&
                              Boolean(formik.errors.institution?.signatory?.registrarName)
                            }
                            helperText={
                              formik.touched.institution?.signatory?.registrarName &&
                              formik.errors.institution?.signatory?.registrarName
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Registrar Title"
                            name="institution.signatory.registrarTitle"
                            value={formik.values.institution.signatory.registrarTitle}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.institution?.signatory?.registrarTitle &&
                              Boolean(formik.errors.institution?.signatory?.registrarTitle)
                            }
                            helperText={
                              formik.touched.institution?.signatory?.registrarTitle &&
                              formik.errors.institution?.signatory?.registrarTitle
                            }
                            placeholder="Registrar/Secretary to the Council"
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Registrar Email"
                            name="institution.signatory.registrarEmail"
                            type="email"
                            value={formik.values.institution.signatory.registrarEmail}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.institution?.signatory?.registrarEmail &&
                              Boolean(formik.errors.institution?.signatory?.registrarEmail)
                            }
                            helperText={
                              formik.touched.institution?.signatory?.registrarEmail &&
                              formik.errors.institution?.signatory?.registrarEmail
                            }
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>

                  {/* Asset Management Section */}
                  <Accordion
                    expanded={expandedSection === 'asset'}
                    onChange={handleSectionChange('asset')}
                    sx={{ mb: 2 }}
                  >
                    <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                      <Typography variant="h6">Asset Management</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            select
                            label="Storage Type"
                            name="asset.storageType"
                            value={formik.values.asset.storageType}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            SelectProps={{ native: true }}
                          >
                            {storageTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Base URL"
                            name="asset.baseUrl"
                            value={formik.values.asset.baseUrl}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.asset?.baseUrl && Boolean(formik.errors.asset?.baseUrl)}
                            helperText={formik.touched.asset?.baseUrl && formik.errors.asset?.baseUrl}
                            placeholder="https://api.yourinstitution.edu"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="CDN URL"
                            name="asset.cdnUrl"
                            value={formik.values.asset.cdnUrl}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.asset?.cdnUrl && Boolean(formik.errors.asset?.cdnUrl)}
                            helperText={formik.touched.asset?.cdnUrl && formik.errors.asset?.cdnUrl}
                            placeholder="https://cdn.yourinstitution.edu"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Upload URL"
                            name="asset.uploadUrl"
                            value={formik.values.asset.uploadUrl}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.asset?.uploadUrl && Boolean(formik.errors.asset?.uploadUrl)}
                            helperText={formik.touched.asset?.uploadUrl && formik.errors.asset?.uploadUrl}
                            placeholder="https://cdn.yourinstitution.edu/uploads"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Template URL"
                            name="asset.templateUrl"
                            value={formik.values.asset.templateUrl}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.asset?.templateUrl && Boolean(formik.errors.asset?.templateUrl)}
                            helperText={formik.touched.asset?.templateUrl && formik.errors.asset?.templateUrl}
                            placeholder="https://cdn.yourinstitution.edu/template"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="PDF URL"
                            name="asset.pdfUrl"
                            value={formik.values.asset.pdfUrl}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.asset?.pdfUrl && Boolean(formik.errors.asset?.pdfUrl)}
                            helperText={formik.touched.asset?.pdfUrl && formik.errors.asset?.pdfUrl}
                            placeholder="https://cdn.yourinstitution.edu/pdfs"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Max File Size"
                            name="asset.maxFileSize"
                            value={formik.values.asset.maxFileSize}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="50mb"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Allowed File Types"
                            name="asset.allowedFileTypes"
                            value={formik.values.asset.allowedFileTypes?.join(', ') || ''}
                            onChange={(e) => handleAllowedFileTypesChange(e.target.value)}
                            onBlur={formik.handleBlur}
                            placeholder="image/jpeg, image/png, application/pdf"
                            helperText="Separate multiple types with commas"
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              File Naming Patterns
                            </Typography>
                          </Divider>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Payment Receipt"
                            name="asset.fileNaming.paymentReceipt"
                            value={formik.values.asset.fileNaming.paymentReceipt}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="{institution}-payment-receipt.pdf"
                            helperText="Use {institution} as placeholder"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Course Form"
                            name="asset.fileNaming.courseForm"
                            value={formik.values.asset.fileNaming.courseForm}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="{institution}-course-form.pdf"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Acceptance Letter"
                            name="asset.fileNaming.acceptanceLetter"
                            value={formik.values.asset.fileNaming.acceptanceLetter}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="{institution}-acceptance-letter.pdf"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Result Template"
                            name="asset.fileNaming.resultTemplate"
                            value={formik.values.asset.fileNaming.resultTemplate}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="students-result-template.xlsx"
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Static Files
                            </Typography>
                          </Divider>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Bond Acceptance Form URL"
                            name="asset.staticFiles.bondAcceptanceForm"
                            value={formik.values.asset.staticFiles.bondAcceptanceForm}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.asset?.staticFiles?.bondAcceptanceForm &&
                              Boolean(formik.errors.asset?.staticFiles?.bondAcceptanceForm)
                            }
                            helperText={
                              formik.touched.asset?.staticFiles?.bondAcceptanceForm &&
                              formik.errors.asset?.staticFiles?.bondAcceptanceForm
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Schedule of Fees URL"
                            name="asset.staticFiles.scheduleOfFees"
                            value={formik.values.asset.staticFiles.scheduleOfFees}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.asset?.staticFiles?.scheduleOfFees &&
                              Boolean(formik.errors.asset?.staticFiles?.scheduleOfFees)
                            }
                            helperText={
                              formik.touched.asset?.staticFiles?.scheduleOfFees &&
                              formik.errors.asset?.staticFiles?.scheduleOfFees
                            }
                            placeholder="Use {session} as placeholder"
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>

                  {/* Pictures & Images Section */}
                  <Accordion
                    expanded={expandedSection === 'pictures'}
                    onChange={handleSectionChange('pictures')}
                    sx={{ mb: 2 }}
                  >
                    <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                      <Typography variant="h6">Pictures & Images</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <Divider sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Logo Configuration
                            </Typography>
                          </Divider>
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Logo URL"
                            name="pictures.logo.url"
                            value={formik.values.pictures.logo.url}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.pictures?.logo?.url && Boolean(formik.errors.pictures?.logo?.url)}
                            helperText={formik.touched.pictures?.logo?.url && formik.errors.pictures?.logo?.url}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Typography variant="subtitle2" sx={{ mb: 2 }}>
                            Logo Dimensions
                          </Typography>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Email Dimensions
                          </Typography>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Width"
                              name="pictures.logo.dimensions.email.width"
                              type="number"
                              value={formik.values.pictures.logo.dimensions.email.width}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                            <TextField
                              label="Height"
                              name="pictures.logo.dimensions.email.height"
                              type="number"
                              value={formik.values.pictures.logo.dimensions.email.height}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                          </Stack>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            PDF Dimensions
                          </Typography>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Width"
                              name="pictures.logo.dimensions.pdf.width"
                              type="number"
                              value={formik.values.pictures.logo.dimensions.pdf.width}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                            <TextField
                              label="Height"
                              name="pictures.logo.dimensions.pdf.height"
                              type="number"
                              value={formik.values.pictures.logo.dimensions.pdf.height}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                          </Stack>
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Watermark Dimensions
                          </Typography>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Width"
                              name="pictures.logo.dimensions.watermark.width"
                              type="number"
                              value={formik.values.pictures.logo.dimensions.watermark.width}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                            <TextField
                              label="Height"
                              name="pictures.logo.dimensions.watermark.height"
                              type="number"
                              value={formik.values.pictures.logo.dimensions.watermark.height}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                          </Stack>
                        </Grid>

                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Letterhead
                            </Typography>
                          </Divider>
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Letterhead URL"
                            name="pictures.letterhead.url"
                            value={formik.values.pictures.letterhead.url}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.pictures?.letterhead?.url &&
                              Boolean(formik.errors.pictures?.letterhead?.url)
                            }
                            helperText={
                              formik.touched.pictures?.letterhead?.url && formik.errors.pictures?.letterhead?.url
                            }
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Upload Settings
                            </Typography>
                          </Divider>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            QR Code Dimensions
                          </Typography>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Width"
                              name="pictures.upload.qrCode.width"
                              type="number"
                              value={formik.values.pictures.upload.qrCode.width}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                            <TextField
                              label="Height"
                              name="pictures.upload.qrCode.height"
                              type="number"
                              value={formik.values.pictures.upload.qrCode.height}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                          </Stack>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Student Photo Dimensions
                          </Typography>
                          <Stack direction="row" spacing={2}>
                            <TextField
                              label="Width"
                              name="pictures.upload.studentPhoto.width"
                              type="number"
                              value={formik.values.pictures.upload.studentPhoto.width}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                            <TextField
                              label="Height"
                              name="pictures.upload.studentPhoto.height"
                              type="number"
                              value={formik.values.pictures.upload.studentPhoto.height}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              size="small"
                              sx={{ flex: 1 }}
                            />
                          </Stack>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Max Image Size"
                            name="pictures.upload.maxSize"
                            value={formik.values.pictures.upload.maxSize}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="5mb"
                          />
                        </Grid>

                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Thumbnail Quality"
                            name="pictures.upload.quality.thumbnail"
                            type="number"
                            value={formik.values.pictures.upload.quality.thumbnail}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.pictures?.upload?.quality?.thumbnail &&
                              Boolean(formik.errors.pictures?.upload?.quality?.thumbnail)
                            }
                            helperText={
                              formik.touched.pictures?.upload?.quality?.thumbnail &&
                              formik.errors.pictures?.upload?.quality?.thumbnail
                            }
                            inputProps={{ min: 0, max: 100 }}
                          />
                        </Grid>

                        <Grid item xs={12} md={3}>
                          <TextField
                            fullWidth
                            label="Full Image Quality"
                            name="pictures.upload.quality.full"
                            type="number"
                            value={formik.values.pictures.upload.quality.full}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={
                              formik.touched.pictures?.upload?.quality?.full &&
                              Boolean(formik.errors.pictures?.upload?.quality?.full)
                            }
                            helperText={
                              formik.touched.pictures?.upload?.quality?.full &&
                              formik.errors.pictures?.upload?.quality?.full
                            }
                            inputProps={{ min: 0, max: 100 }}
                          />
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </form>
              </Box>
            </Scrollbar>
          </Card>
        </Can>

        {/* Reset Confirmation Dialog */}
        <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
          <DialogTitle>Reset Settings to Defaults</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to reset all settings to their default values? This action will overwrite any
              custom changes you have made. This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
            <LoadingButton
              onClick={handleReset}
              loading={resetMutation.isPending}
              color="error"
              variant="contained"
            >
              Reset to Defaults
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

