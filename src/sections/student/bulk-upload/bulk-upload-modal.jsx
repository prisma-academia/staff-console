import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useDropzone } from 'react-dropzone';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Grid,
  Fade,
  Step,
  Card,
  Modal,
  Stack,
  alpha,
  Alert,
  Radio,
  Table,
  Button,
  Dialog,
  Divider,
  Stepper,
  Backdrop,
  useTheme,
  Checkbox,
  TableRow,
  MenuItem,
  StepLabel,
  FormLabel,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  RadioGroup,
  FormControl,
  DialogTitle,
  useMediaQuery,
  DialogContent,
  DialogActions,
  TableContainer,
  LinearProgress,
  FormControlLabel,
} from '@mui/material';

import { StudentApi, programApi, classLevelApi } from 'src/api';

import Iconify from 'src/components/iconify';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  p: 0,
  outline: 'none',
};

const steps = ['Download Template', 'Validate Upload', 'Review & Insert'];

export default function BulkUploadModal({ open, setOpen }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [templateFormat, setTemplateFormat] = useState('xlsx');
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendSMS, setSendSMS] = useState(false);
  const [classId, setClassId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [generatedPasswords, setGeneratedPasswords] = useState(null);

  // Programs and class levels for Step 3
  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });
  const { data: classLevels = [] } = useQuery({
    queryKey: ['classLevels'],
    queryFn: classLevelApi.getClassLevels,
  });

  // Pre-fill programme/class from first student when all have the same
  useEffect(() => {
    if (!validationResults?.students?.length || programmeId || classId) return;
    const first = validationResults.students[0];
    const firstProgramId = first.program?._id ?? first.program;
    const firstClassId = first.classLevel?._id ?? first.classLevel;
    if (!firstProgramId || !firstClassId) return;
    const allSame = validationResults.students.every((s) => {
      const pId = s.program?._id ?? s.program;
      const cId = s.classLevel?._id ?? s.classLevel;
      return pId === firstProgramId && cId === firstClassId;
    });
    if (allSame) {
      setProgrammeId(firstProgramId);
      setClassId(firstClassId);
    }
  }, [validationResults, programmeId, classId]);

  // Download template mutation
  const { mutate: downloadTemplate, isPending: isDownloading } = useMutation({
    mutationFn: async () => {
      const blob = await StudentApi.downloadBulkUploadTemplate(templateFormat);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = templateFormat === 'csv' ? 'csv' : 'xlsx';
      a.download = `student_bulk_upload_template.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    },
    onSuccess: () => {
      enqueueSnackbar('Template downloaded successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to download template', { variant: 'error' });
    },
  });

  // Validate upload mutation
  const { mutate: validateUpload, isPending: isValidating } = useMutation({
    mutationFn: (file) => StudentApi.validateBulkUpload(file),
    onSuccess: (data) => {
      setValidationResults(data);
      enqueueSnackbar(
        `Validation complete: ${data.summary.validRows} valid, ${data.summary.invalidRows} invalid out of ${data.summary.totalRows} total rows`,
        { variant: data.summary.invalidRows === 0 ? 'success' : 'warning' }
      );
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to validate file', { variant: 'error' });
    },
  });

  // Bulk insert mutation (API returns full result: data, message, generatedPasswords)
  const { mutate: bulkInsert, isPending: isInserting } = useMutation({
    mutationFn: (data) => StudentApi.bulkInsertStudents(data),
    onSuccess: (result) => {
      const count = result.data?.count ?? 0;
      queryClient.invalidateQueries({ queryKey: ['students'] });
      enqueueSnackbar(
        `Successfully inserted ${count} student(s)`,
        { variant: 'success' }
      );
      if (result.generatedPasswords?.length > 0) {
        setGeneratedPasswords(result.generatedPasswords);
      } else {
        handleClose();
      }
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to insert students';
      const details = error.data?.errors;
      enqueueSnackbar(
        details?.length ? `${errorMessage}: ${details.join('; ')}` : errorMessage,
        { variant: 'error' }
      );
    },
  });

  const handleClose = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setValidationResults(null);
    setSendEmail(false);
    setSendSMS(false);
    setClassId('');
    setProgrammeId('');
    setGeneratedPasswords(null);
    setOpen(false);
  };

  const handleDownloadGeneratedPasswords = () => {
    if (!generatedPasswords?.length) return;
    const header = 'regNumber,email,password\n';
    const rows = generatedPasswords
      .map((p) => `${p.regNumber ?? ''},${p.email ?? ''},${p.password ?? ''}`)
      .join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_passwords.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    setGeneratedPasswords(null);
    handleClose();
  };

  const handleNext = () => {
    if (activeStep === 1 && validationResults && validationResults.summary.validRows > 0) {
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
  };

  const handleValidateFile = () => {
    if (selectedFile) {
      validateUpload(selectedFile);
    } else {
      enqueueSnackbar('Please select a file first', { variant: 'warning' });
    }
  };

  const handleBulkInsert = () => {
    if (!validationResults || validationResults.students.length === 0 || !classId || !programmeId) return;
    const students = validationResults.students.map(({ program, classLevel, ...rest }) => rest);
    bulkInsert({
      classId,
      programmeId,
      students,
      sendEmail,
      sendSMS,
    });
  };

  // File upload dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        // Validate file type
        const validTypes = ['.csv', '.xlsx', '.xls'];
        const fileExtension = `.${  file.name.split('.').pop().toLowerCase()}`;
        if (!validTypes.includes(fileExtension)) {
          enqueueSnackbar('Invalid file type. Please upload CSV or Excel file', { variant: 'error' });
          return;
        }
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          enqueueSnackbar('File size too large. Maximum size is 10MB', { variant: 'error' });
          return;
        }
        setSelectedFile(file);
        setValidationResults(null); // Reset validation results when new file is selected
      }
    },
    multiple: false,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
  });

  const modalStyle = {
    ...style,
    width: isMobile ? '95%' : '85%',
    maxWidth: '1200px',
    height: '90vh',
    display: 'flex',
    flexDirection: 'column',
  };

  const sectionCardStyle = {
    p: 3,
    boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
    borderRadius: 2,
    bgcolor: 'background.paper',
  };

  // Step 1: Download Template
  const renderStep1 = () => (
    <Box>
      <Stack spacing={3}>
        <Alert severity="info" icon={<Iconify icon="mdi:information" />}>
          Download a template file (CSV or Excel) with all required fields. Fill in the student data and upload it in the next step.
        </Alert>

        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
            Select Template Format
          </FormLabel>
          <RadioGroup
            row
            value={templateFormat}
            onChange={(e) => setTemplateFormat(e.target.value)}
          >
            <FormControlLabel value="xlsx" control={<Radio />} label="Excel (.xlsx)" />
            <FormControlLabel value="csv" control={<Radio />} label="CSV (.csv)" />
          </RadioGroup>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <LoadingButton
            variant="contained"
            size="large"
            onClick={handleDownloadTemplate}
            loading={isDownloading}
            startIcon={<Iconify icon="eva:download-fill" />}
            sx={{
              px: 4,
              py: 1.5,
              boxShadow: theme.customShadows.primary,
            }}
          >
            Download Template
          </LoadingButton>
        </Box>
      </Stack>
    </Box>
  );

  // Step 2: Validate Upload
  const renderStep2 = () => (
    <Box>
      <Stack spacing={3}>
        <Alert severity="info" icon={<Iconify icon="mdi:information" />}>
          Upload your filled template file. The system will validate all data and show any errors before proceeding.
        </Alert>

        {/* File Upload Area */}
        <Box
          {...getRootProps()}
          sx={{
            border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive
              ? alpha(theme.palette.primary.main, 0.08)
              : alpha(theme.palette.grey[500], 0.08),
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          <input {...getInputProps()} />
          <Iconify
            icon={selectedFile ? 'eva:file-fill' : 'eva:cloud-upload-fill'}
            width={48}
            height={48}
            sx={{ color: theme.palette.primary.main, mb: 2 }}
          />
          <Typography variant="h6" gutterBottom>
            {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedFile
              ? `File size: ${(selectedFile.size / 1024).toFixed(2)} KB`
              : 'CSV or Excel files only (Max 10MB)'}
          </Typography>
        </Box>

        {selectedFile && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <LoadingButton
              variant="contained"
              onClick={handleValidateFile}
              loading={isValidating}
              startIcon={<Iconify icon="mdi:check-circle" />}
              sx={{ px: 4 }}
            >
              Validate File
            </LoadingButton>
          </Box>
        )}

        {/* Validation Results */}
        {validationResults && (
          <Card sx={sectionCardStyle}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={600}>
                Validation Results
              </Typography>
              <Divider />

              {/* Summary */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
                    <Typography variant="h4" color="info.main" fontWeight={700}>
                      {validationResults.summary.totalRows}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Rows
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                    <Typography variant="h4" color="success.main" fontWeight={700}>
                      {validationResults.summary.validRows}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Valid Rows
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.error.main, 0.1), borderRadius: 1 }}>
                    <Typography variant="h4" color="error.main" fontWeight={700}>
                      {validationResults.summary.invalidRows}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Invalid Rows
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Errors */}
              {validationResults.errors && validationResults.errors.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="error.main" gutterBottom>
                    Validation Errors:
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 200,
                      overflow: 'auto',
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    {validationResults.errors.map((error, index) => (
                      <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                        • {error}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Success Message */}
              {validationResults.summary.invalidRows === 0 && (
                <Alert severity="success" icon={<Iconify icon="mdi:check-circle" />}>
                  All rows are valid! You can proceed to the next step.
                </Alert>
              )}
            </Stack>
          </Card>
        )}
      </Stack>
    </Box>
  );

  // Step 3: Review & Insert
  const renderStep3 = () => {
    if (!validationResults || validationResults.students.length === 0) {
      return (
        <Alert severity="warning">
          No valid students to insert. Please go back and fix validation errors.
        </Alert>
      );
    }

    return (
      <Box>
        <Stack spacing={3}>
          <Alert severity="info" icon={<Iconify icon="mdi:information" />}>
            Review the validated students below. Select the Program and Class Level to apply to all students in this batch, then choose notification options.
          </Alert>

          {/* Program & Class Level - applied to entire batch */}
          <Card sx={sectionCardStyle}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Program & Class Level
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              These apply to all students in this batch. Template program/class columns are for reference only.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Program"
                  fullWidth
                  size="small"
                  select
                  value={programmeId}
                  onChange={(e) => setProgrammeId(e.target.value)}
                  required
                >
                  <MenuItem value="">Select program</MenuItem>
                  {(programs || []).map((program) => (
                    <MenuItem key={program._id} value={program._id}>
                      {program.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Class Level"
                  fullWidth
                  size="small"
                  select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                >
                  <MenuItem value="">Select class level</MenuItem>
                  {(classLevels || []).map((level) => (
                    <MenuItem key={level._id} value={level._id}>
                      {level.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Card>

          {/* Email/SMS Options */}
          <Card sx={sectionCardStyle}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Notification Options
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                  />
                }
                label="Send welcome email with credentials to students"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendSMS}
                    onChange={(e) => setSendSMS(e.target.checked)}
                  />
                }
                label="Send SMS with credentials to students"
              />
            </Stack>
          </Card>

          {/* Students Summary Table */}
          <Card sx={sectionCardStyle}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Students to be Inserted ({validationResults.students.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Reg Number</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Program</TableCell>
                    <TableCell>Class Level</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validationResults.students.slice(0, 50).map((student, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {student.regNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {student.personalInfo?.firstName} {student.personalInfo?.lastName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {student.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {typeof student.program === 'object' ? student.program.name : student.program || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {typeof student.classLevel === 'object' ? student.classLevel.name : student.classLevel || 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {validationResults.students.length > 50 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Showing first 50 of {validationResults.students.length} students
              </Typography>
            )}
          </Card>
        </Stack>
      </Box>
    );
  };

  return (
    <>
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 500 }}
    >
      <Fade in={open}>
        <Box sx={modalStyle}>
          {/* Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: theme.palette.background.neutral,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify
                icon="mdi:upload-multiple"
                width={28}
                height={28}
                color={theme.palette.primary.main}
              />
              <Typography variant="h5" fontWeight={600}>
                Bulk Upload Students
              </Typography>
            </Stack>
            <IconButton onClick={handleClose} size="small">
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Box>

          {/* Stepper */}
          <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Stepper activeStep={activeStep} alternativeLabel={!isMobile}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Step Content */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            {activeStep === 0 && renderStep1()}
            {activeStep === 1 && renderStep2()}
            {activeStep === 2 && renderStep3()}
          </Box>

          {/* Progress Indicator */}
          {isInserting && (
            <Box sx={{ px: 3, pb: 2 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Inserting students...
              </Typography>
            </Box>
          )}

          {/* Footer Actions */}
          <Box
            sx={{
              p: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              bgcolor: theme.palette.background.neutral,
            }}
          >
            <Button onClick={handleClose} variant="outlined">
              Cancel
            </Button>
            <Stack direction="row" spacing={2}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              {activeStep === 0 && (
                <Button
                  variant="contained"
                  onClick={() => setActiveStep(1)}
                  startIcon={<Iconify icon="eva:arrow-forward-fill" />}
                >
                  Next
                </Button>
              )}
              {activeStep === 1 && (
                <LoadingButton
                  variant="contained"
                  onClick={handleNext}
                  disabled={!validationResults || validationResults.summary.validRows === 0}
                  startIcon={<Iconify icon="eva:arrow-forward-fill" />}
                >
                  Next
                </LoadingButton>
              )}
              {activeStep === 2 && (
                <LoadingButton
                  variant="contained"
                  onClick={handleBulkInsert}
                  loading={isInserting}
                  disabled={!classId || !programmeId}
                  startIcon={<Iconify icon="mdi:check-circle" />}
                  sx={{
                    boxShadow: theme.customShadows.primary,
                  }}
                >
                  Insert Students
                </LoadingButton>
              )}
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>

    {/* Generated passwords dialog - sibling to Modal to avoid nested overlay issues */}
    <Dialog open={Boolean(generatedPasswords?.length)} onClose={() => { setGeneratedPasswords(null); handleClose(); }} maxWidth="sm" fullWidth>
      <DialogTitle>Generated passwords</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {generatedPasswords?.length} temporary password(s) were generated. Download the CSV and share securely with students.
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="eva:download-fill" />}
          onClick={handleDownloadGeneratedPasswords}
        >
          Download CSV
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => { setGeneratedPasswords(null); handleClose(); }}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}

BulkUploadModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

