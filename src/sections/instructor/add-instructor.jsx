import React from 'react';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Grid,
  Fade,
  Modal,
  Stack,
  Button,
  Backdrop,
  useTheme,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';

import config from 'src/config';
import { useAuthStore } from 'src/store';

import Iconify from 'src/components/iconify';

const AddInstructorModal = ({ open, setOpen }) => {
  const token = useAuthStore((store) => store.token);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const validationSchema = Yup.object({
    personalInfo: Yup.object({
      firstName: Yup.string().required('First name is required'),
      lastName: Yup.string().required('Last name is required'),
      middleName: Yup.string(),
      dateOfBirth: Yup.date().required('Date of birth is required'),
      gender: Yup.string().required('Gender is required'),
    }),
    contactInfo: Yup.object({
      email: Yup.string().email('Invalid email').required('Email is required'),
      phone: Yup.string().required('Phone number is required'),
      address: Yup.string().required('Address is required'),
      city: Yup.string().required('City is required'),
      state: Yup.string().required('State is required'),
      country: Yup.string().required('Country is required'),
    }),
    employeeId: Yup.string().required('Employee ID is required'),
    hireDate: Yup.date().required('Hire date is required'),
    department: Yup.string().required('Department is required'),
    qualifications: Yup.array()
      .of(Yup.string().required('Qualification is required'))
      .min(1, 'At least one qualification is required'),
  });

  const formik = useFormik({
    initialValues: {
      personalInfo: {
        firstName: '',
        lastName: '',
        middleName: '',
        dateOfBirth: '',
        gender: '',
      },
      contactInfo: {
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
      },
      employeeId: '',
      hireDate: '',
      department: '',
      qualifications: [''],
    },
    validationSchema,
    onSubmit: (values) => {
      mutate(values);
    },
  });

  const { mutate, isLoading } = useMutation({
    mutationFn: async (credentials) => {
      const response = await fetch(`${config.baseUrl}/api/v1/instructor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['instructors']);
      enqueueSnackbar('Instructor added successfully', { variant: 'success' });
      setOpen(false);
    },
    onError: (error) => {
      const errorMessage = error.message || 'An error occurred';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    },
  });

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '90%' : '60%',
    maxWidth: '800px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflow: 'auto',
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="contained"
        color="inherit"
        startIcon={<Iconify icon="eva:plus-fill" />}
      >
        New Instructor
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={open}>
          <Box sx={modalStyle}>
            <Typography variant="h5" align="center" gutterBottom>
              Add New Instructor
            </Typography>
            <Box component="form" onSubmit={formik.handleSubmit}>
              <Stack spacing={4}>
                <Typography variant="h6">Personal Information</Typography>
                <Grid container spacing={2}>
                  {['firstName', 'lastName', 'middleName'].map((field) => (
                    <Grid item xs={12} sm={6} key={field}>
                      <TextField
                        label={field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        name={`personalInfo.${field}`}
                        fullWidth
                        value={formik.values.personalInfo[field]}
                        onChange={formik.handleChange}
                        error={formik.touched.personalInfo?.[field] && Boolean(formik.errors.personalInfo?.[field])}
                        helperText={formik.touched.personalInfo?.[field] && formik.errors.personalInfo?.[field]}
                      />
                    </Grid>
                  ))}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      type="date"
                      label="Date of Birth"
                      name="personalInfo.dateOfBirth"
                      fullWidth
                      value={formik.values.personalInfo.dateOfBirth}
                      onChange={formik.handleChange}
                      error={formik.touched.personalInfo?.dateOfBirth && Boolean(formik.errors.personalInfo?.dateOfBirth)}
                      helperText={formik.touched.personalInfo?.dateOfBirth && formik.errors.personalInfo?.dateOfBirth}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Gender"
                      name="personalInfo.gender"
                      fullWidth
                      value={formik.values.personalInfo.gender}
                      onChange={formik.handleChange}
                      error={formik.touched.personalInfo?.gender && Boolean(formik.errors.personalInfo?.gender)}
                      helperText={formik.touched.personalInfo?.gender && formik.errors.personalInfo?.gender}
                    >
                      {['Male', 'Female', 'Other'].map((gender) => (
                        <MenuItem key={gender} value={gender}>
                          {gender}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <Typography variant="h6">Contact Information</Typography>
                <Grid container spacing={2}>
                  {['email', 'phone', 'address', 'city', 'state', 'country'].map((field) => (
                    <Grid item xs={12} sm={6} key={field}>
                      <TextField
                        label={field.charAt(0).toUpperCase() + field.slice(1)}
                        name={`contactInfo.${field}`}
                        fullWidth
                        value={formik.values.contactInfo[field]}
                        onChange={formik.handleChange}
                        error={formik.touched.contactInfo?.[field] && Boolean(formik.errors.contactInfo?.[field])}
                        helperText={formik.touched.contactInfo?.[field] && formik.errors.contactInfo?.[field]}
                      />
                    </Grid>
                  ))}
                </Grid>

                <Grid container spacing={2}>
                  {['employeeId', 'hireDate', 'department'].map((field) => (
                    <Grid item xs={12} sm={6} key={field}>
                      <TextField
                        label={field.charAt(0).toUpperCase() + field.slice(1)}
                        name={field}
                        fullWidth
                        type={field === 'hireDate' ? 'date' : 'text'}
                        value={formik.values[field]}
                        onChange={formik.handleChange}
                        error={formik.touched[field] && Boolean(formik.errors[field])}
                        helperText={formik.touched[field] && formik.errors[field]}
                      />
                    </Grid>
                  ))}
                  <Grid item xs={12}>
                    <TextField
                      select
                      label="Qualifications"
                      name="qualifications"
                      fullWidth
                      SelectProps={{ multiple: true }}
                      value={formik.values.qualifications}
                      onChange={formik.handleChange}
                    >
                      {['B.Sc', 'M.Sc', 'PhD', 'Others'].map((qualification) => (
                        <MenuItem key={qualification} value={qualification}>
                          {qualification}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={isLoading}
                >
                  Add Instructor
                </LoadingButton>
              </Stack>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

AddInstructorModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default AddInstructorModal;
