import React from 'react';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Grid,
  Fade,
  Modal,
  Stack,
  Button,
  Divider,
  Backdrop,
  useTheme,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';

import config from 'src/config';
import { useAuthStore } from 'src/store';

import { programApi, classLevelApi } from '../../api';

const AddStudentModal = ({ open, handleClose, object }) => {
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
      state: Yup.string().required('State is required'),
      lga: Yup.string().required('LGA is required'),
    }),
    program: Yup.string().required('Program is required'),
    classLevel: Yup.string().required('Class level is required'),
    guardianInfo: Yup.object({
      guardianName: Yup.string().required('Guardian name is required'),
      guardianPhone: Yup.string().required('Guardian phone is required'),
      relationship: Yup.string().required('Relationship is required'),
    }),
    medicalInfo: Yup.object({
      bloodGroup: Yup.string().required('Blood group is required'),
      allergies: Yup.string(),
      chronicConditions: Yup.string(),
      emergencyContact: Yup.object({
        name: Yup.string().required('Emergency contact name is required'),
        relationship: Yup.string().required('Emergency contact relationship is required'),
        phone: Yup.string().required('Emergency contact phone is required'),
      }),
    }),
  });
  const formik = useFormik({
    initialValues: {
      personalInfo: {
        firstName: object.application.firstName || '',
        lastName: object.application.lastName || '',
        middleName: object.application.otherName || '',
        dateOfBirth: object.application.dob
          ? new Date(object.application.dob).toISOString().split('T')[0]
          : '',
        gender: object.application.gender || 'Male',
      },
      contactInfo: {
        email: object.application.email || '',
        phone: object.application.phoneNumber || '',
        address: object.application.address || '',
        state: object.application.stateOfResidence || '',
        lga: object.application.lgaOfResidence,
      },
      enrollmentDate: object.offerDate
        ? new Date(object.offerDate).toISOString().split('T')[0]
        : '',
      program: object.programme || '',
      classLevel: '',
      guardianInfo: {
        guardianName: '',
        guardianPhone: '',
        relationship: '',
      },
      medicalInfo: {
        bloodGroup: '',
        allergies: '',
        chronicConditions: '',
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
        },
      },
    },
    validationSchema,
    onSubmit: (values) => {
      formik.setSubmitting(true);
      mutate(values);
    },
  });

  // const programmeOptions = ['Basic Nursing', 'Basic Midwifery'];
  // const classLevelOptions = ['Year 1', 'Year 2', 'Year 3'];
  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const allergyOptions = ['None', 'Peanuts', 'Lactose', 'Gluten', 'Other'];
  const guardianRelationshipOptions = ['Parent', 'Sibling', 'Uncle/Aunt', 'Other'];

  const { data: programmeOptions } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });

  const { data: classLevelOptions } = useQuery({
    queryKey: ['classlevel'],
    queryFn: classLevelApi.getClassLevels,
  });

  const addStudent = async (credentials) => {
    const response = await fetch(`${config.baseUrl}/api/v1/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      formik.setSubmitting(false);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (result.ok) {
      return result.data;
    }
    throw new Error(result.message);
  };
  const { mutate } = useMutation({
    mutationFn: addStudent,
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      enqueueSnackbar({ message: 'Student added successfully', variant: 'success' });
      handleClose();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      enqueueSnackbar({ message: errorMessage, variant: 'error' });    },
  });

  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    formik.setFieldValue('contactInfo.state', selectedState);
    // fetchLgaByState(selectedState).then((lgas) => setLgaOptions(lgas));
  };

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
            Add New Student
          </Typography>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Stack spacing={4}>
              <Box>
                <Typography variant="h6">Personal Information</Typography>
                <Divider />
                <Grid container spacing={2} mt={1}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="personalInfo.firstName"
                      label="First Name"
                      fullWidth
                      value={formik.values.personalInfo.firstName}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.personalInfo?.firstName &&
                        Boolean(formik.errors.personalInfo?.firstName)
                      }
                      helperText={
                        formik.touched.personalInfo?.firstName &&
                        formik.errors.personalInfo?.firstName
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="personalInfo.middleName"
                      label="Middle Name"
                      fullWidth
                      value={formik.values.personalInfo.middleName}
                      onChange={formik.handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="personalInfo.lastName"
                      label="Last Name"
                      fullWidth
                      value={formik.values.personalInfo.lastName}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.personalInfo?.lastName &&
                        Boolean(formik.errors.personalInfo?.lastName)
                      }
                      helperText={
                        formik.touched.personalInfo?.lastName &&
                        formik.errors.personalInfo?.lastName
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="personalInfo.dateOfBirth"
                      type="date"
                      label="Date of Birth"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.personalInfo.dateOfBirth}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.personalInfo?.dateOfBirth &&
                        Boolean(formik.errors.personalInfo?.dateOfBirth)
                      }
                      helperText={
                        formik.touched.personalInfo?.dateOfBirth &&
                        formik.errors.personalInfo?.dateOfBirth
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="personalInfo.gender"
                      label="Gender"
                      fullWidth
                      select
                      value={formik.values.personalInfo.gender}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.personalInfo?.gender &&
                        Boolean(formik.errors.personalInfo?.gender)
                      }
                      helperText={
                        formik.touched.personalInfo?.gender && formik.errors.personalInfo?.gender
                      }
                    >
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography variant="h6">Contact Information</Typography>
                <Divider />
                <Grid container spacing={2} mt={1}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="contactInfo.email"
                      label="Email"
                      fullWidth
                      value={formik.values.contactInfo.email}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.contactInfo?.email &&
                        Boolean(formik.errors.contactInfo?.email)
                      }
                      helperText={
                        formik.touched.contactInfo?.email && formik.errors.contactInfo?.email
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="contactInfo.phone"
                      label="Phone"
                      fullWidth
                      value={formik.values.contactInfo.phone}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.contactInfo?.phone &&
                        Boolean(formik.errors.contactInfo?.phone)
                      }
                      helperText={
                        formik.touched.contactInfo?.phone && formik.errors.contactInfo?.phone
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      name="contactInfo.address"
                      label="Address"
                      fullWidth
                      value={formik.values.contactInfo.address}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.contactInfo?.address &&
                        Boolean(formik.errors.contactInfo?.address)
                      }
                      helperText={
                        formik.touched.contactInfo?.address && formik.errors.contactInfo?.address
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="contactInfo.state"
                      label="State"
                      fullWidth
                      disabled
                      value={formik.values.contactInfo.state}
                      onChange={handleStateChange}
                      error={
                        formik.touched.contactInfo?.state &&
                        Boolean(formik.errors.contactInfo?.state)
                      }
                      helperText={
                        formik.touched.contactInfo?.state && formik.errors.contactInfo?.state
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="contactInfo.lga"
                      label="LGA"
                      fullWidth
                      disabled
                      value={formik.values.contactInfo.lga}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.contactInfo?.lga && Boolean(formik.errors.contactInfo?.lga)
                      }
                      helperText={formik.touched.contactInfo?.lga && formik.errors.contactInfo?.lga}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography variant="h6">Enrollment Information</Typography>
                <Divider />
                <Grid container spacing={2} mt={1}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="program"
                      label="Program"
                      fullWidth
                      select
                      value={formik.values.program}
                      onChange={formik.handleChange}
                      error={formik.touched.program && Boolean(formik.errors.program)}
                      helperText={formik.touched.program && formik.errors.program}
                    >
                      {(programmeOptions || []).map((program) => (
                        <MenuItem key={program._id} value={program._id}>
                          {program.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      name="classLevel"
                      label="Class Level"
                      fullWidth
                      select
                      value={formik.values.classLevel}
                      onChange={formik.handleChange}
                      error={formik.touched.classLevel && Boolean(formik.errors.classLevel)}
                      helperText={formik.touched.classLevel && formik.errors.classLevel}
                    >
                      {(classLevelOptions || []).map((classLevel) => (
                        <MenuItem key={classLevel._id} value={classLevel._id}>
                          {classLevel.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography variant="h6">Guardian Information</Typography>
                <Divider />
                <Grid container spacing={2} mt={1}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="guardianInfo.guardianName"
                      label="Guardian Name"
                      fullWidth
                      value={formik.values.guardianInfo.guardianName}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.guardianInfo?.guardianName &&
                        Boolean(formik.errors.guardianInfo?.guardianName)
                      }
                      helperText={
                        formik.touched.guardianInfo?.guardianName &&
                        formik.errors.guardianInfo?.guardianName
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="guardianInfo.guardianPhone"
                      label="Guardian Phone"
                      fullWidth
                      value={formik.values.guardianInfo.guardianPhone}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.guardianInfo?.guardianPhone &&
                        Boolean(formik.errors.guardianInfo?.guardianPhone)
                      }
                      helperText={
                        formik.touched.guardianInfo?.guardianPhone &&
                        formik.errors.guardianInfo?.guardianPhone
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="guardianInfo.relationship"
                      label="Relationship"
                      fullWidth
                      select
                      value={formik.values.guardianInfo.relationship}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.guardianInfo?.relationship &&
                        Boolean(formik.errors.guardianInfo?.relationship)
                      }
                      helperText={
                        formik.touched.guardianInfo?.relationship &&
                        formik.errors.guardianInfo?.relationship
                      }
                    >
                      {guardianRelationshipOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography variant="h6">Medical Information</Typography>
                <Divider />
                <Grid container spacing={2} mt={1}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="medicalInfo.bloodGroup"
                      label="Blood Group"
                      fullWidth
                      select
                      value={formik.values.medicalInfo.bloodGroup}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.medicalInfo?.bloodGroup &&
                        Boolean(formik.errors.medicalInfo?.bloodGroup)
                      }
                      helperText={
                        formik.touched.medicalInfo?.bloodGroup &&
                        formik.errors.medicalInfo?.bloodGroup
                      }
                    >
                      {bloodGroupOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="medicalInfo.allergies"
                      label="Allergies"
                      fullWidth
                      select
                      value={formik.values.medicalInfo.allergies}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.medicalInfo?.allergies &&
                        Boolean(formik.errors.medicalInfo?.allergies)
                      }
                      helperText={
                        formik.touched.medicalInfo?.allergies &&
                        formik.errors.medicalInfo?.allergies
                      }
                    >
                      {allergyOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="medicalInfo.chronicConditions"
                      label="Chronic Conditions"
                      fullWidth
                      value={formik.values.medicalInfo.chronicConditions}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.medicalInfo?.chronicConditions &&
                        Boolean(formik.errors.medicalInfo?.chronicConditions)
                      }
                      helperText={
                        formik.touched.medicalInfo?.chronicConditions &&
                        formik.errors.medicalInfo?.chronicConditions
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="medicalInfo.emergencyContact.name"
                      label="Emergency Contact Name"
                      fullWidth
                      value={formik.values.medicalInfo.emergencyContact.name}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.medicalInfo?.emergencyContact?.name &&
                        Boolean(formik.errors.medicalInfo?.emergencyContact?.name)
                      }
                      helperText={
                        formik.touched.medicalInfo?.emergencyContact?.name &&
                        formik.errors.medicalInfo?.emergencyContact?.name
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="medicalInfo.emergencyContact.relationship"
                      label="Emergency Contact Relationship"
                      fullWidth
                      value={formik.values.medicalInfo.emergencyContact.relationship}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.medicalInfo?.emergencyContact?.relationship &&
                        Boolean(formik.errors.medicalInfo?.emergencyContact?.relationship)
                      }
                      helperText={
                        formik.touched.medicalInfo?.emergencyContact?.relationship &&
                        formik.errors.medicalInfo?.emergencyContact?.relationship
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      name="medicalInfo.emergencyContact.phone"
                      label="Emergency Contact Phone"
                      fullWidth
                      value={formik.values.medicalInfo.emergencyContact.phone}
                      onChange={formik.handleChange}
                      error={
                        formik.touched.medicalInfo?.emergencyContact?.phone &&
                        Boolean(formik.errors.medicalInfo?.emergencyContact?.phone)
                      }
                      helperText={
                        formik.touched.medicalInfo?.emergencyContact?.phone &&
                        formik.errors.medicalInfo?.emergencyContact?.phone
                      }
                    />
                  </Grid>
                </Grid>
              </Box>

              <Stack direction="row" justifyContent="flex-end" spacing={2} mt={4}>
                <Button onClick={handleClose}>Cancel</Button>
                <LoadingButton loading={formik.isSubmitting} variant="contained" type="submit">
                  Add Student
                </LoadingButton>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

AddStudentModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  object: PropTypes.object.isRequired,
};

export default AddStudentModal;
