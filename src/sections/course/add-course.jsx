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

import config from 'src/config';
import { useAuthStore } from 'src/store';

import CustomSelect from 'src/components/select';

import { programApi, classLevelApi } from '../../api';

const semesterOptions = [
  {
    _id: 'First Semester',
    name: 'First Semester',
  },
  {
    _id: 'Second Semester',
    name: 'Second Semester',
  },
];

const AddCourseModal = ({ open, setOpen }) => {
  const token = useAuthStore((store) => store.token);
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

  // const { data: instructorOptions } = useQuery({
  //   queryKey: ['instructors'],
  //   queryFn: instructorApi.getInstructors,
  // });

  const addCourse = async (courseData) => {
    const response = await fetch(`${config.baseUrl}/api/v1/course`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(courseData),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      formik.setSubmitting(false);
      throw new Error(errorMessage);
    }

    return response.json();
  };

  const { mutate } = useMutation({
    mutationFn: addCourse,
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      enqueueSnackbar({ message: 'Course added successfully', variant: 'success' });
      setOpen(false);
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      enqueueSnackbar({ message: errorMessage, variant: 'error' });
    },
  });

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
    // instructors: Yup.array()
    //   .of(Yup.string())
    //   .min(1, 'At least one instructor is required')
    //   .required('At least one instructor is required'),
  });
  
  const formik = useFormik({
    initialValues: {
      code: '',
      name: '',
      description: '',
      credit: '',
      programs: [],
      classLevel: '',
      semester: '',
      instructors: [],
    },
    validationSchema,
    onSubmit: (values) => {
      formik.setSubmitting(true);
      mutate(values);
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

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="contained" color="inherit">
        New Course
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closeAfterTransition
        keepMounted={false}
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={open}>
          <Box sx={modalStyle}>
            <Typography variant="h5" align="center" gutterBottom>
              Add New Course
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
                    {/* <CustomSelect
                      data={instructorOptions}
                      multiple
                      label="Instructors"
                      name="instructors"
                      formik={formik}
                    /> */}
                  </Grid>
                </Grid>
                <Stack direction="row" justifyContent="flex-end" spacing={2} mt={4}>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                  <LoadingButton loading={formik.isSubmitting} variant="contained" type="submit">
                    Add Course
                  </LoadingButton>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

AddCourseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default AddCourseModal;
