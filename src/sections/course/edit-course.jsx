import React from 'react';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Fade,
  Grid,
  Modal,
  Stack,
  Button,
  Backdrop,
  TextField,
  Typography,
} from '@mui/material';

import CustomSelect from 'src/components/select';

import { courseApi, programApi, classLevelApi, InstructorApi } from '../../api';

const semesterOptions = [
  { _id: 'First Semester', name: 'First Semester' },
  { _id: 'Second Semester', name: 'Second Semester' },
];

const getInitialValues = (course) => {
  if (!course) {
    return {
      code: '',
      name: '',
      description: '',
      credit: '',
      programs: [],
      classLevel: '',
      semester: '',
      instructors: [],
    };
  }
  return {
    code: course.code || '',
    name: course.name || '',
    description: course.description || '',
    credit: course.credit ?? '',
    programs: (course.programs || []).map((p) => (typeof p === 'object' ? p._id : p)),
    classLevel: course.classLevel ? (course.classLevel._id || course.classLevel) : '',
    semester: course.semester || '',
    instructors: (course.instructors || []).map((i) => (typeof i === 'object' ? i._id : i)),
  };
};

const validationSchema = Yup.object({
  code: Yup.string().required('Course code is required'),
  name: Yup.string().required('Course title is required'),
  description: Yup.string(),
  credit: Yup.number().required('Credits for the course are required'),
  programs: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one program is required')
    .required('At least one program is required'),
  classLevel: Yup.string().required('Class level is required'),
  semester: Yup.string().required('Semester is required'),
});

const EditCourseModal = ({ open, setOpen, course }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: programmeOptions } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });

  const { data: classLevelOptions } = useQuery({
    queryKey: ['classlevel'],
    queryFn: classLevelApi.getClassLevels,
  });

  const { data: instructorOptions } = useQuery({
    queryKey: ['instructors'],
    queryFn: InstructorApi.getInstructors,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => courseApi.updateCourse(id, data),
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      enqueueSnackbar('Course updated successfully', { variant: 'success' });
      setOpen(false);
    },
    onError: (error) => {
      formik.setSubmitting(false);
      const errorMessage = error.data?.message || error.message || 'Failed to update course';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    },
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: getInitialValues(course),
    validationSchema,
    onSubmit: (values) => {
      if (!course?._id) return;
      formik.setSubmitting(true);
      updateMutation.mutate({ id: course._id, data: values });
    },
  });

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '60%',
    maxWidth: '800px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflow: 'auto',
  };

  const handleClose = () => setOpen(false);

  return (
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
          <Typography variant="h5" align="center" gutterBottom>
            Edit Course
          </Typography>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Stack spacing={4}>
              <Grid container spacing={2}>
                <Grid item sm={6} xs={12}>
                  <TextField
                    label="Course Code"
                    name="code"
                    fullWidth
                    value={formik.values.code}
                    onChange={formik.handleChange}
                    error={formik.touched.code && Boolean(formik.errors.code)}
                    helperText={formik.touched.code && formik.errors.code}
                  />
                </Grid>
                <Grid item sm={6} xs={12}>
                  <TextField
                    label="Course Title"
                    name="name"
                    fullWidth
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    name="description"
                    fullWidth
                    multiline
                    rows={4}
                    value={formik.values.description}
                    onChange={formik.handleChange}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    helperText={formik.touched.description && formik.errors.description}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Credits"
                    name="credit"
                    fullWidth
                    type="number"
                    value={formik.values.credit}
                    onChange={formik.handleChange}
                    error={formik.touched.credit && Boolean(formik.errors.credit)}
                    helperText={formik.touched.credit && formik.errors.credit}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomSelect
                    data={programmeOptions}
                    multiple
                    label="Program"
                    name="programs"
                    formik={formik}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomSelect
                    data={classLevelOptions}
                    label="Class Level"
                    name="classLevel"
                    formik={formik}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomSelect
                    data={semesterOptions}
                    label="Semester"
                    name="semester"
                    formik={formik}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <CustomSelect
                    data={instructorOptions}
                    multiple
                    label="Instructors"
                    name="instructors"
                    formik={formik}
                  />
                </Grid>
              </Grid>
              <Stack direction="row" justifyContent="flex-end" spacing={2} mt={4}>
                <Button onClick={handleClose}>Cancel</Button>
                <LoadingButton
                  loading={formik.isSubmitting}
                  variant="contained"
                  type="submit"
                  disabled={!course?._id}
                >
                  Update Course
                </LoadingButton>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

EditCourseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  course: PropTypes.object,
};

export default EditCourseModal;
