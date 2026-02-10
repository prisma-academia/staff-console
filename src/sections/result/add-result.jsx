import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Tab,
  Fade,
  Tabs,
  Modal,
  Stack,
  Paper,
  Alert,
  Button,
  Backdrop,
  useTheme,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';

import {
  courseApi,
  ResultApi,
  programApi,
  SessionApi,
  StudentApi,
  classLevelApi,
} from 'src/api';

import Iconify from 'src/components/iconify';
import CustomSelect from 'src/components/select';

const SEMESTER_OPTIONS = [
  { _id: 'First Semester', name: 'First Semester' },
  { _id: 'Second Semester', name: 'Second Semester' },
];

const GRADE_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F'].map((g) => ({ _id: g, name: g }));

const AddResultModal = ({
  open,
  setOpen,
  editingResult,
  onCloseEdit,
  showTriggerButton = false,
}) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: courseOptions } = useQuery({
    queryKey: ['courses'],
    queryFn: courseApi.getCourses,
    enabled: open,
  });
  const { data: programOptions } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
    enabled: open,
  });
  const { data: classLevelOptions } = useQuery({
    queryKey: ['classLevels'],
    queryFn: classLevelApi.getClassLevels,
    enabled: open,
  });
  const { data: sessionOptions } = useQuery({
    queryKey: ['sessions'],
    queryFn: SessionApi.getSessions,
    enabled: open,
  });
  const { data: studentOptions } = useQuery({
    queryKey: ['students'],
    queryFn: () => StudentApi.getStudents(),
    enabled: open,
  });

  const isEdit = Boolean(editingResult?._id);

  const addFormValidationSchema = Yup.object({
    student: Yup.string().required('Student is required'),
    program: Yup.string().required('Program is required'),
    course: Yup.string().required('Course is required'),
    classLevel: Yup.string().required('Class level is required'),
    regNumber: Yup.string().required('Registration number is required'),
    grade: Yup.string().oneOf(['A', 'B', 'C', 'D', 'E', 'F']).required('Grade is required'),
    scoreScale: Yup.string().required('Score scale is required'),
    score: Yup.number().min(0).max(100).required('Score is required'),
    remark: Yup.string().required('Remark is required'),
    semester: Yup.string().required('Semester is required'),
    year: Yup.number().min(2000).max(2100).required('Year is required'),
    session: Yup.string(),
  });

  const addFormik = useFormik({
    initialValues: {
      student: '',
      program: '',
      course: '',
      classLevel: '',
      regNumber: '',
      grade: '',
      scoreScale: '100',
      score: '',
      remark: '',
      semester: '',
      year: new Date().getFullYear(),
      session: '',
    },
    validationSchema: addFormValidationSchema,
    onSubmit: (values) => handleAddFormSubmit(values),
  });

  useEffect(() => {
    if (editingResult && open) {
      const s = editingResult.student;
      const p = editingResult.program;
      const c = editingResult.course;
      const cl = editingResult.classLevel;
      addFormik.setValues({
        student: typeof s === 'object' ? s?._id : s,
        program: typeof p === 'object' ? p?._id : p,
        course: typeof c === 'object' ? c?._id : c,
        classLevel: typeof cl === 'object' ? cl?._id : cl,
        regNumber: editingResult.regNumber || '',
        grade: editingResult.grade || '',
        scoreScale: editingResult.scoreScale || '100',
        score: editingResult.score ?? '',
        remark: editingResult.remark || '',
        semester: editingResult.semester || '',
        year: editingResult.year ?? new Date().getFullYear(),
        session: typeof editingResult.session === 'object' ? editingResult.session?._id : editingResult.session || '',
      });
      setActiveTab(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- addFormik from useFormik is stable
  }, [editingResult, open]);

  const createMutation = useMutation({
    mutationFn: ResultApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      enqueueSnackbar('Result created successfully', { variant: 'success' });
      setOpen(false);
      onCloseEdit?.();
      addFormik.resetForm();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to create result', { variant: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ResultApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      enqueueSnackbar('Result updated successfully', { variant: 'success' });
      setOpen(false);
      onCloseEdit?.();
      addFormik.resetForm();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to update result', { variant: 'error' });
    },
  });

  const handleAddFormSubmit = (values) => {
    if (isEdit) {
      updateMutation.mutate({
        id: editingResult._id,
        data: {
          grade: values.grade,
          score: Number(values.score),
          remark: values.remark,
          semester: values.semester,
          year: Number(values.year),
        },
      });
    } else {
      createMutation.mutate({
        student: values.student,
        program: values.program,
        course: values.course,
        classLevel: values.classLevel,
        regNumber: values.regNumber,
        grade: values.grade,
        scoreScale: values.scoreScale,
        score: Number(values.score),
        remark: values.remark,
        semester: values.semester,
        year: Number(values.year),
        session: values.session || undefined,
      });
    }
  };


  const downloadTemplate = async (data) => {
    const blob = await ResultApi.downloadTemplate(data.course);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-result-template.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  };

  const downloadFormik = useFormik({
    initialValues: { course: '' },
    validationSchema: Yup.object({
      course: Yup.string().required('Course is required to download template'),
    }),
    onSubmit: (values) => {
      downloadFormik.setSubmitting(true);
      downloadMutate(values);
    },
  });

  const { mutate: downloadMutate, isPending: isDownloading } = useMutation({
    mutationFn: downloadTemplate,
    onSuccess: () => {
      downloadFormik.setSubmitting(false);
      enqueueSnackbar('Template downloaded successfully', { variant: 'success' });
    },
    onError: (error) => {
      downloadFormik.setSubmitting(false);
      enqueueSnackbar(error.message || 'Failed to download template', { variant: 'error' });
    },
  });

  const uploadFormik = useFormik({
    initialValues: { course: '', file: null },
    validationSchema: Yup.object({
      course: Yup.string().required('Course is required'),
      file: Yup.mixed().required('Please select a file to upload'),
    }),
    onSubmit: () => {
      enqueueSnackbar('Upload endpoint not available in API. Use Result builder or bulk save.', {
        variant: 'info',
      });
    },
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      uploadFormik.setFieldValue('file', file);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleClose = () => {
    setOpen(false);
    onCloseEdit?.();
    addFormik.resetForm();
    setSelectedFile(null);
  };

  let modalWidth = '700px';
  if (isMobile) modalWidth = '95%';
  else if (isEdit) modalWidth = '500px';
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: modalWidth,
    maxWidth: '95vw',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 0,
    maxHeight: '90vh',
    overflow: 'hidden',
    borderRadius: 2,
  };

  const studentSelectData = (studentOptions || []).map((s) => ({
    _id: s._id,
    name: [s.regNumber, s.personalInfo?.firstName, s.personalInfo?.lastName].filter(Boolean).join(' ') || s._id,
  }));

  const sessionSelectData = useMemo(
    () =>
      (sessionOptions || []).map((s) => ({
        _id: s._id,
        name: s.name || s.code || s._id,
      })),
    [sessionOptions]
  );

  return (
    <>
      {showTriggerButton && (
        <Button
          onClick={() => setOpen(true)}
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="eva:file-text-fill" />}
        >
          Result Templates
        </Button>
      )}
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        keepMounted={false}
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={open}>
          <Box sx={modalStyle}>
            <Paper elevation={0} sx={{ borderRadius: 2 }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                }}
              >
                <Typography variant="h5" align="center" fontWeight="bold">
                  {isEdit ? 'Edit result' : 'Add result / Templates'}
                </Typography>
              </Box>

              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label={isEdit ? 'Edit result' : 'Add result'} icon={<Iconify icon="eva:edit-fill" />} iconPosition="start" />
                <Tab label="Download template" icon={<Iconify icon="eva:download-fill" />} iconPosition="start" />
                <Tab label="Upload (info)" icon={<Iconify icon="eva:upload-fill" />} iconPosition="start" />
              </Tabs>

              <Box sx={{ p: 3, maxHeight: '70vh', overflow: 'auto' }}>
                {activeTab === 0 && (
                  <Box component="form" onSubmit={addFormik.handleSubmit}>
                    <Stack spacing={2}>
                      {!isEdit && (
                        <>
                          <CustomSelect
                            data={studentSelectData}
                            label="Student"
                            name="student"
                            formik={addFormik}
                            fullWidth
                          />
                          <CustomSelect
                            data={programOptions}
                            label="Program"
                            name="program"
                            formik={addFormik}
                            fullWidth
                          />
                          <CustomSelect
                            data={courseOptions}
                            label="Course"
                            name="course"
                            formik={addFormik}
                            fullWidth
                          />
                          <CustomSelect
                            data={classLevelOptions}
                            label="Class level"
                            name="classLevel"
                            formik={addFormik}
                            fullWidth
                          />
                          <TextField
                            fullWidth
                            label="Registration number"
                            name="regNumber"
                            value={addFormik.values.regNumber}
                            onChange={addFormik.handleChange}
                            onBlur={addFormik.handleBlur}
                            error={addFormik.touched.regNumber && Boolean(addFormik.errors.regNumber)}
                            helperText={addFormik.touched.regNumber && addFormik.errors.regNumber}
                            size="small"
                          />
                        </>
                      )}
                      <CustomSelect
                        data={GRADE_OPTIONS}
                        label="Grade"
                        name="grade"
                        formik={addFormik}
                        fullWidth
                      />
                      {!isEdit && (
                        <TextField
                          fullWidth
                          label="Score scale"
                          name="scoreScale"
                          value={addFormik.values.scoreScale}
                          onChange={addFormik.handleChange}
                          size="small"
                        />
                      )}
                      <TextField
                        fullWidth
                        type="number"
                        inputProps={{ min: 0, max: 100 }}
                        label="Score"
                        name="score"
                        value={addFormik.values.score}
                        onChange={addFormik.handleChange}
                        onBlur={addFormik.handleBlur}
                        error={addFormik.touched.score && Boolean(addFormik.errors.score)}
                        helperText={addFormik.touched.score && addFormik.errors.score}
                        size="small"
                      />
                      <TextField
                        fullWidth
                        label="Remark"
                        name="remark"
                        value={addFormik.values.remark}
                        onChange={addFormik.handleChange}
                        onBlur={addFormik.handleBlur}
                        error={addFormik.touched.remark && Boolean(addFormik.errors.remark)}
                        helperText={addFormik.touched.remark && addFormik.errors.remark}
                        size="small"
                        multiline
                        rows={2}
                      />
                      <CustomSelect
                        data={SEMESTER_OPTIONS}
                        label="Semester"
                        name="semester"
                        formik={addFormik}
                        fullWidth
                      />
                      <TextField
                        fullWidth
                        type="number"
                        inputProps={{ min: 2000, max: 2100 }}
                        label="Year"
                        name="year"
                        value={addFormik.values.year}
                        onChange={addFormik.handleChange}
                        onBlur={addFormik.handleBlur}
                        error={addFormik.touched.year && Boolean(addFormik.errors.year)}
                        helperText={addFormik.touched.year && addFormik.errors.year}
                        size="small"
                      />
                      {!isEdit && (
                        <CustomSelect
                          data={sessionSelectData}
                          label="Session (optional)"
                          name="session"
                          formik={addFormik}
                          fullWidth
                        />
                      )}
                      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pt: 1 }}>
                        <Button onClick={handleClose} variant="outlined">
                          Cancel
                        </Button>
                        <LoadingButton
                          type="submit"
                          variant="contained"
                          loading={createMutation.isPending || updateMutation.isPending}
                          disabled={!addFormik.isValid}
                        >
                          {isEdit ? 'Update' : 'Create'}
                        </LoadingButton>
                      </Stack>
                    </Stack>
                  </Box>
                )}

                {activeTab === 1 && (
                  <Box component="form" onSubmit={downloadFormik.handleSubmit}>
                    <Stack spacing={3}>
                      <Alert severity="info">
                        Select a course to download its result template. Fill the template with
                        student results and use the Result builder to bulk save.
                      </Alert>
                      <CustomSelect
                        data={courseOptions}
                        label="Select course"
                        name="course"
                        formik={downloadFormik}
                        fullWidth
                      />
                      <Stack direction="row" justifyContent="flex-end" spacing={2} mt={2}>
                        <Button onClick={handleClose} variant="outlined">
                          Cancel
                        </Button>
                        <LoadingButton
                          loading={isDownloading}
                          variant="contained"
                          type="submit"
                          startIcon={<Iconify icon="eva:download-outline" />}
                          disabled={!downloadFormik.values.course}
                        >
                          Download template
                        </LoadingButton>
                      </Stack>
                    </Stack>
                  </Box>
                )}

                {activeTab === 2 && (
                  <Stack spacing={3}>
                    <Alert severity="info">
                      Bulk upload of results is not provided by the current API. To save many
                      results at once, use the <strong>Result builder</strong> page: select class,
                      program, session, and semester, then edit scores/grades in the grid and click
                      &quot;Save all&quot;.
                    </Alert>
                    <CustomSelect
                      data={courseOptions}
                      label="Select course"
                      name="course"
                      formik={uploadFormik}
                      fullWidth
                    />
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 3,
                        border: '2px dashed',
                        borderColor: 'divider',
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                      onClick={() => document.getElementById('result-file-input').click()}
                    >
                      <input
                        id="result-file-input"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                      <Iconify
                        icon={selectedFile ? 'eva:file-fill' : 'eva:cloud-upload-fill'}
                        width={40}
                        height={40}
                      />
                      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                        {selectedFile ? selectedFile.name : 'File upload not available — use Result builder'}
                      </Typography>
                    </Paper>
                    <Button onClick={handleClose} variant="outlined" fullWidth>
                      Close
                    </Button>
                  </Stack>
                )}
              </Box>
            </Paper>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

AddResultModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  editingResult: PropTypes.object,
  onCloseEdit: PropTypes.func,
  showTriggerButton: PropTypes.bool,
};

export default AddResultModal;
