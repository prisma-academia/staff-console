import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  LinearProgress,
  FormControlLabel,
  Checkbox,
  Paper,
  Fade,
  Chip,
  Alert,
} from '@mui/material';

import { StudentApi, programApi, classLevelApi } from 'src/api';

import Iconify from 'src/components/iconify';

const SECTION_LABEL_SX = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'text.secondary',
  mb: 1.5,
  display: 'block',
};

export default function BulkUploadModal({ open, setOpen }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [templateFormat, setTemplateFormat] = useState('xlsx');
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [sendEmail, setSendEmail] = useState(false);
  const [sendSMS, setSendSMS] = useState(false);
  const [classId, setClassId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [generatedPasswords, setGeneratedPasswords] = useState(null);

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });
  const { data: classLevels = [] } = useQuery({
    queryKey: ['classLevels'],
    queryFn: classLevelApi.getClassLevels,
  });

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

  const { mutate: downloadTemplate, isPending: isDownloading } = useMutation({
    mutationFn: async () => {
      const blob = await StudentApi.downloadBulkUploadTemplate(templateFormat);
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
      enqueueSnackbar('Template downloaded', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Download failed', { variant: 'error' });
    },
  });

  const { mutate: validateUpload, isPending: isValidating } = useMutation({
    mutationFn: (file) => StudentApi.validateBulkUpload(file),
    onSuccess: (data) => {
      setValidationResults(data);
      enqueueSnackbar(
        `${data.summary.validRows} valid, ${data.summary.invalidRows} invalid of ${data.summary.totalRows}`,
        { variant: data.summary.invalidRows === 0 ? 'success' : 'warning' }
      );
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Validation failed', { variant: 'error' });
    },
  });

  const { mutate: bulkInsert, isPending: isInserting } = useMutation({
    mutationFn: (data) => StudentApi.bulkInsertStudents(data),
    onSuccess: (result) => {
      const count = result.data?.count ?? 0;
      queryClient.invalidateQueries({ queryKey: ['students'] });
      enqueueSnackbar(`${count} student(s) added`, { variant: 'success' });
      if (result.generatedPasswords?.length > 0) {
        setGeneratedPasswords(result.generatedPasswords);
      } else {
        handleClose();
      }
    },
    onError: (error) => {
      const details = error.data?.errors;
      enqueueSnackbar(
        details?.length ? `${error.message}: ${details.join('; ')}` : error.message,
        { variant: 'error' }
      );
    },
  });

  const handleClose = () => {
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
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
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

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = `.${file.name.split('.').pop().toLowerCase()}`;
      if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
        enqueueSnackbar('Use CSV or Excel', { variant: 'error' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        enqueueSnackbar('Max 10MB', { variant: 'error' });
        return;
      }
      setSelectedFile(file);
      setValidationResults(null);
    }
    e.target.value = '';
  };

  const handleValidateFile = () => {
    if (selectedFile) validateUpload(selectedFile);
    else enqueueSnackbar('Select a file first', { variant: 'warning' });
  };

  const handleBulkInsert = () => {
    if (!validationResults?.students?.length || !classId || !programmeId) return;
    const students = validationResults.students.map(({ program, classLevel, ...rest }) => rest);
    bulkInsert({ classId, programmeId, students, sendEmail, sendSMS });
  };

  const canSave = validationResults?.students?.length > 0 && classId && programmeId;
  const summary = validationResults?.summary;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={280}
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="eva:people-fill" width={24} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.25 }}>
                  Bulk upload students
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                  Upload CSV or Excel and assign program & class
                </Typography>
              </Box>
            </Stack>
            <IconButton
              size="small"
              onClick={handleClose}
              aria-label="Close"
              sx={{
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
              }}
            >
              <Iconify icon="eva:close-fill" width={22} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2.5, bgcolor: 'background.paper' }}>
          <Stack spacing={3}>
            {/* 1. Get template + Upload + Validate */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'grey.50' }}>
              <Typography component="span" sx={SECTION_LABEL_SX}>
                1. Get template
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ gap: 1.5 }}>
                <FormControl size="small" sx={{ minWidth: 128 }}>
                  <InputLabel>Format</InputLabel>
                  <Select
                    value={templateFormat}
                    label="Format"
                    onChange={(e) => setTemplateFormat(e.target.value)}
                  >
                    <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                    <MenuItem value="csv">CSV</MenuItem>
                  </Select>
                </FormControl>
                <LoadingButton
                  size="medium"
                  variant="outlined"
                  onClick={() => downloadTemplate()}
                  loading={isDownloading}
                  startIcon={<Iconify icon="eva:download-fill" width={18} />}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Download template
                </LoadingButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <Button
                  size="medium"
                  variant="outlined"
                  startIcon={<Iconify icon="eva:upload-fill" width={18} />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Upload
                </Button>
                {selectedFile && (
                  <LoadingButton
                    size="medium"
                    variant="contained"
                    onClick={handleValidateFile}
                    loading={isValidating}
                    startIcon={<Iconify icon="eva:checkmark-circle-2-fill" width={18} />}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Validate
                  </LoadingButton>
                )}
              </Stack>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {selectedFile.name}
                </Typography>
              )}
            </Paper>

            {/* 2. Results + Assign options at top of table */}
            {validationResults && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'grey.50', overflow: 'hidden' }}>
                <Typography component="span" sx={SECTION_LABEL_SX}>
                  2. Review results
                </Typography>
                {validationResults.students?.length > 0 && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ mb: 1.5, gap: 2, py: 1.5, px: 1.5, bgcolor: 'grey.100', borderRadius: 1 }}
                  >
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Program</InputLabel>
                      <Select
                        value={programmeId}
                        label="Program"
                        onChange={(e) => setProgrammeId(e.target.value)}
                      >
                        <MenuItem value="">Select program</MenuItem>
                        {(programs || []).map((p) => (
                          <MenuItem key={p._id} value={p._id}>
                            {p.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Class level</InputLabel>
                      <Select value={classId} label="Class level" onChange={(e) => setClassId(e.target.value)}>
                        <MenuItem value="">Select class</MenuItem>
                        {(classLevels || []).map((l) => (
                          <MenuItem key={l._id} value={l._id}>
                            {l.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={sendEmail}
                          onChange={(e) => setSendEmail(e.target.checked)}
                        />
                      }
                      label={<Typography variant="body2">Email credentials</Typography>}
                    />
                    <FormControlLabel
                      control={
                        <Checkbox size="small" checked={sendSMS} onChange={(e) => setSendSMS(e.target.checked)} />
                      }
                      label={<Typography variant="body2">SMS credentials</Typography>}
                    />
                  </Stack>
                )}
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 1.5 }}>
                  <Chip
                    size="small"
                    label={`${summary.validRows} valid`}
                    color="success"
                    sx={{ fontWeight: 600 }}
                  />
                  {summary.invalidRows > 0 && (
                    <Chip
                      size="small"
                      label={`${summary.invalidRows} invalid`}
                      color="error"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                  <Typography variant="body2" color="text.secondary">
                    of {summary.totalRows} total
                  </Typography>
                </Stack>
                {validationResults.errors?.length > 0 && (
                  <Alert severity="error" sx={{ mb: 2 }} variant="outlined">
                    <Typography component="ul" variant="body2" sx={{ pl: 2, m: 0 }}>
                      {validationResults.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </Typography>
                  </Alert>
                )}
                {validationResults.students?.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No valid rows. Fix errors and validate again.
                  </Typography>
                )}
                {validationResults.students?.length > 0 && (
                  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                    <TableContainer sx={{ maxHeight: 260 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 600, fontSize: '0.75rem' }}>
                              Reg #
                            </TableCell>
                            <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 600, fontSize: '0.75rem' }}>
                              Name
                            </TableCell>
                            <TableCell sx={{ bgcolor: 'grey.100', fontWeight: 600, fontSize: '0.75rem' }}>
                              Email
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {validationResults.students.slice(0, 50).map((s, i) => (
                            <TableRow key={i} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                              <TableCell sx={{ fontSize: '0.8125rem' }}>{s.regNumber}</TableCell>
                              <TableCell sx={{ fontSize: '0.8125rem' }}>
                                {[s.personalInfo?.firstName, s.personalInfo?.lastName].filter(Boolean).join(' ') || '—'}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.8125rem' }}>{s.email || '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {validationResults.students.length > 50 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ px: 1.5, py: 1, display: 'block', bgcolor: 'grey.50' }}
                      >
                        Showing first 50 of {validationResults.students.length} students
                      </Typography>
                    )}
                  </Box>
                )}
              </Paper>
            )}
          </Stack>

          {isInserting && (
            <LinearProgress sx={{ mt: 2, borderRadius: 1, height: 4 }} color="primary" />
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
            gap: 1,
          }}
        >
          <Button onClick={handleClose} size="medium" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <LoadingButton
            size="medium"
            variant="contained"
            onClick={handleBulkInsert}
            loading={isInserting}
            disabled={!canSave}
            startIcon={!isInserting ? <Iconify icon="eva:people-fill" width={18} /> : null}
            sx={{ textTransform: 'none', fontWeight: 600, minWidth: 140 }}
          >
            {isInserting ? 'Adding…' : 'Add students'}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Passwords generated dialog */}
      <Dialog
        open={Boolean(generatedPasswords?.length)}
        onClose={() => {
          setGeneratedPasswords(null);
          handleClose();
        }}
        maxWidth="xs"
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={280}
        PaperProps={{
          elevation: 8,
          sx: { borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' },
        }}
      >
        <DialogTitle sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: 'success.main',
                color: 'success.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="eva:checkmark-circle-2-fill" width={24} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Passwords generated
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Download the CSV and share credentials with students securely.
          </Typography>
          <Button
            size="medium"
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="eva:download-fill" width={20} />}
            onClick={handleDownloadGeneratedPasswords}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Download CSV
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
          <Button
            size="medium"
            onClick={() => {
              setGeneratedPasswords(null);
              handleClose();
            }}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
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
