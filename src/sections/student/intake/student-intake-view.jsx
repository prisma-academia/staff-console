import { useSnackbar } from 'notistack';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Card,
  Chip,
  Alert,
  Stack,
  Table,
  Button,
  Select,
  MenuItem,
  TableRow,
  Checkbox,
  TableBody,
  TableCell,
  TableHead,
  Container,
  IconButton,
  InputLabel,
  Typography,
  FormControl,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { StudentApi, programApi, classLevelApi } from 'src/api';

import Iconify from 'src/components/iconify';

import AddStudent from '../add-student';

export default function StudentIntakeView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [templateFormat, setTemplateFormat] = useState('xlsx');
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationSummary, setValidationSummary] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [stagedStudents, setStagedStudents] = useState([]);
  const [sendEmail, setSendEmail] = useState(true);
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

  const { mutate: downloadTemplate, isPending: isDownloading } = useMutation({
    mutationFn: async () => {
      const blob = await StudentApi.downloadBulkUploadTemplate(templateFormat);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_bulk_upload_template.${templateFormat === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => enqueueSnackbar('Template downloaded', { variant: 'success' }),
    onError: (error) => enqueueSnackbar(error.message || 'Template download failed', { variant: 'error' }),
  });

  const { mutate: validateUpload, isPending: isValidating } = useMutation({
    mutationFn: (file) => StudentApi.validateBulkUpload(file),
    onSuccess: (data) => {
      setValidationSummary(data.summary);
      setValidationErrors(data.errors || []);
      if (data.students?.length) {
        const incoming = data.students.map((student, index) => ({
          ...student,
          _stagedId: `${student.regNumber || 'upload'}-${Date.now()}-${index}`,
          _source: 'upload',
        }));
        setStagedStudents((prev) => [...prev, ...incoming]);
      }
      enqueueSnackbar(
        `${data.summary?.validRows || 0} valid, ${data.summary?.invalidRows || 0} invalid`,
        { variant: (data.summary?.invalidRows || 0) > 0 ? 'warning' : 'success' }
      );
    },
    onError: (error) => enqueueSnackbar(error.message || 'Validation failed', { variant: 'error' }),
  });

  const { mutate: createStudents, isPending: isCreating } = useMutation({
    mutationFn: (payload) => StudentApi.bulkInsertStudents(payload),
    onSuccess: (result) => {
      const count = result.data?.count ?? 0;
      enqueueSnackbar(`${count} student(s) created`, { variant: 'success' });
      if (result.generatedPasswords?.length > 0) {
        setGeneratedPasswords(result.generatedPasswords);
      } else {
        setStagedStudents([]);
      }
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (error) => {
      const details = error.data?.errors;
      enqueueSnackbar(details?.length ? `${error.message}: ${details.join('; ')}` : error.message, {
        variant: 'error',
      });
    },
  });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const ext = `.${file.name.split('.').pop().toLowerCase()}`;
    if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
      enqueueSnackbar('Use CSV or Excel format', { variant: 'error' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      enqueueSnackbar('Max file size is 10MB', { variant: 'error' });
      return;
    }
    setSelectedFile(file);
    event.target.value = '';
  };

  const handleStageStudent = (student) => {
    setStagedStudents((prev) => [
      ...prev,
      { ...student, _stagedId: `${student.regNumber}-${Date.now()}`, _source: 'single' },
    ]);
  };

  const handleCreateStudents = () => {
    if (!stagedStudents.length) {
      enqueueSnackbar('No staged students to create', { variant: 'warning' });
      return;
    }
    if (!classId || !programmeId) {
      enqueueSnackbar('Select program and class level', { variant: 'warning' });
      return;
    }
    const students = stagedStudents.map(({ _stagedId, _source, ...student }) => student);
    createStudents({
      classId,
      programmeId,
      students,
      sendEmail,
      sendSMS,
    });
  };

  const removeStagedStudent = (stagedId) => {
    setStagedStudents((prev) => prev.filter((student) => student._stagedId !== stagedId));
  };

  const handleDownloadGeneratedPasswords = () => {
    if (!generatedPasswords?.length) return;
    const header = 'regNumber,email,password\n';
    const rows = generatedPasswords
      .map((item) => `${item.regNumber || ''},${item.email || ''},${item.password || ''}`)
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
    setStagedStudents([]);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Student Intake
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Stage students from template upload or single-entry modal, then create them in one batch.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => navigate('/student')}>
            Back to Students
          </Button>
        </Stack>

        <Card sx={{ p: 2.5, mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 140 }}>
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
              variant="outlined"
              loading={isDownloading}
              startIcon={<Iconify icon="eva:download-fill" />}
              onClick={() => downloadTemplate()}
            >
              Download Template
            </LoadingButton>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:upload-fill" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </Button>
            <LoadingButton
              variant="contained"
              loading={isValidating}
              disabled={!selectedFile}
              startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
              onClick={() => validateUpload(selectedFile)}
            >
              Validate
            </LoadingButton>
            <Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />} onClick={() => setOpenAddModal(true)}>
              Add Student
            </Button>
          </Stack>
          {selectedFile && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Selected file: {selectedFile.name}
            </Typography>
          )}
          {validationSummary && (
            <Stack direction="row" spacing={1} alignItems="center" mt={1.5}>
              <Chip size="small" color="success" label={`${validationSummary.validRows} valid`} />
              <Chip size="small" color="error" label={`${validationSummary.invalidRows} invalid`} />
              <Typography variant="caption" color="text.secondary">
                Total rows: {validationSummary.totalRows}
              </Typography>
            </Stack>
          )}
          {validationErrors?.length > 0 && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {validationErrors.slice(0, 6).map((error) => (
                <Typography key={error} variant="body2">
                  {error}
                </Typography>
              ))}
            </Alert>
          )}
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={2} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Program</InputLabel>
              <Select value={programmeId} label="Program" onChange={(e) => setProgrammeId(e.target.value)}>
                <MenuItem value="">Select program</MenuItem>
                {programs.map((program) => (
                  <MenuItem key={program._id} value={program._id}>
                    {program.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Class Level</InputLabel>
              <Select value={classId} label="Class Level" onChange={(e) => setClassId(e.target.value)}>
                <MenuItem value="">Select class level</MenuItem>
                {classLevels.map((level) => (
                  <MenuItem key={level._id} value={level._id}>
                    {level.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Checkbox checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />}
              label="Email credentials"
            />
            <FormControlLabel
              control={<Checkbox checked={sendSMS} onChange={(e) => setSendSMS(e.target.checked)} />}
              label="SMS credentials"
            />
            <LoadingButton
              variant="contained"
              color="success"
              loading={isCreating}
              disabled={!stagedStudents.length || !classId || !programmeId}
              onClick={handleCreateStudents}
            >
              Create Students
            </LoadingButton>
          </Stack>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Reg Number</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stagedStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant="body2" color="text.secondary">
                        No staged students yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  stagedStudents.map((student) => (
                    <TableRow key={student._stagedId} hover>
                      <TableCell>{student.regNumber}</TableCell>
                      <TableCell>
                        {[student.personalInfo?.firstName, student.personalInfo?.lastName]
                          .filter(Boolean)
                          .join(' ')}
                      </TableCell>
                      <TableCell>{student.email || student.contactInfo?.email || '—'}</TableCell>
                      <TableCell>{student.contactInfo?.phone || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={student._source === 'single' ? 'Single add' : 'Uploaded'}
                          color={student._source === 'single' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="error" onClick={() => removeStagedStudent(student._stagedId)}>
                          <Iconify icon="eva:trash-2-outline" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      <AddStudent open={openAddModal} setOpen={setOpenAddModal} onStageStudent={handleStageStudent} />

      {generatedPasswords?.length > 0 && (
        <Card sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Generated passwords available
          </Typography>
          <Button variant="contained" startIcon={<Iconify icon="eva:download-fill" />} onClick={handleDownloadGeneratedPasswords}>
            Download Generated Passwords CSV
          </Button>
        </Card>
      )}
    </Container>
  );
}
