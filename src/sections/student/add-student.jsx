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
  alpha,
  Button,
  Divider,
  Backdrop,
  useTheme,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  useMediaQuery,
  InputAdornment,
} from '@mui/material';

import { UserApi, programApi, classLevelApi } from 'src/api';

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

export default function AddStudent({ open, setOpen }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const validationSchema = Yup.object({
    regNumber: Yup.string().required('Registration number is required'),
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

  // Form initialization
  const formik = useFormik({
    initialValues: {
      regNumber: '',
      personalInfo: {
        firstName: '',
        lastName: '',
        middleName: '',
        dateOfBirth: '',
        gender: 'Male',
      },
      contactInfo: {
        email: '',
        phone: '',
        address: '',
        state: '',
        lga: '',
      },
      enrollmentDate: new Date().toISOString().split('T')[0],
      program: '',
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
      mutate(values);
    },
  });

  // Fetch program and class level options
  const { data: programs, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });

  const { data: classLevels, isLoading: isLoadingClassLevels } = useQuery({
    queryKey: ['classlevel'],
    queryFn: classLevelApi.getClassLevels,
  });

  // Dropdown options
  const bloodGroupOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const allergyOptions = ['None', 'Peanuts', 'Lactose', 'Gluten', 'Other'];
  const guardianRelationshipOptions = ['Parent', 'Sibling', 'Uncle/Aunt', 'Other'];
  const stateOptions = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
    'Yobe', 'Zamfara'
  ];

  // API mutation for adding student
  const addStudent = async (credentials) => {
    try {
      return await UserApi.register(credentials);
    } catch (error) {
      throw new Error(error.message || 'Failed to add student');
    }
  };

  const { mutate, isPending } = useMutation({
    mutationFn: addStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      enqueueSnackbar('Student added successfully', { variant: 'success' });
      handleClose();
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to add student';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    },
  });

  const handleClose = () => {
    formik.resetForm();
    setOpen(false);
  };

  const modalStyle = {
    ...style,
    width: isMobile ? '95%' : '80%',
    maxWidth: '1000px',
    height: '90vh', 
    display: 'flex',
    flexDirection: 'column',
  };

  // Section card style for consistent look
  const sectionCardStyle = { 
    p: 3, 
    height: '100%', 
    boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
    borderRadius: 2,
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                  0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.2)}`,
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
    >
      <Fade in={open}>
        <Box sx={modalStyle}>
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: `1px solid ${theme.palette.divider}`, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: theme.palette.background.neutral
          }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Iconify icon="mdi:account-plus" width={28} height={28} color={theme.palette.primary.main} />
              <Typography variant="h5" fontWeight={600}>
                Add New Student
              </Typography>
            </Stack>
            <IconButton onClick={handleClose} size="small">
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Box>

          {/* Form Content - Scrollable */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
            <Box component="form" onSubmit={formik.handleSubmit}>
              <Stack spacing={4}>
                {/* Main Information Card - Registration Number & Enrollment */}
                <Box sx={sectionCardStyle}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="regNumber"
                        label="Registration Number"
                        fullWidth
                        size="small"
                        value={formik.values.regNumber}
                        onChange={formik.handleChange}
                        error={formik.touched.regNumber && Boolean(formik.errors.regNumber)}
                        helperText={formik.touched.regNumber && formik.errors.regNumber}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Iconify icon="mdi:identifier" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="enrollmentDate"
                        type="date"
                        label="Enrollment Date"
                        fullWidth
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={formik.values.enrollmentDate}
                        onChange={formik.handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Iconify icon="mdi:calendar" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        name="status"
                        label="Status"
                        fullWidth
                        size="small"
                        select
                        value="active"
                        disabled
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Iconify icon="mdi:check-circle" color="success.main" />
                            </InputAdornment>
                          ),
                        }}
                      >
                        <MenuItem value="active">Active</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </Box>

                {/* Personal Information */}
                <Box>
                  <Stack direction="row" alignItems="center" mb={2} spacing={1}>
                    <Iconify icon="mdi:account" color={theme.palette.primary.main} />
                    <Typography variant="h6" fontWeight={600}>
                      Personal Information
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={sectionCardStyle}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          name="personalInfo.firstName"
                          label="First Name"
                          fullWidth
                          size="small"
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
                          size="small"
                          value={formik.values.personalInfo.middleName}
                          onChange={formik.handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          name="personalInfo.lastName"
                          label="Last Name"
                          fullWidth
                          size="small"
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
                          size="small"
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
                          size="small"
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
                </Box>

                {/* Contact Information */}
                <Box>
                  <Stack direction="row" alignItems="center" mb={2} spacing={1}>
                    <Iconify icon="mdi:phone" color={theme.palette.primary.main} />
                    <Typography variant="h6" fontWeight={600}>
                      Contact Information
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={sectionCardStyle}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="contactInfo.email"
                          label="Email"
                          fullWidth
                          size="small"
                          value={formik.values.contactInfo.email}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.contactInfo?.email &&
                            Boolean(formik.errors.contactInfo?.email)
                          }
                          helperText={
                            formik.touched.contactInfo?.email && formik.errors.contactInfo?.email
                          }
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Iconify icon="mdi:email" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="contactInfo.phone"
                          label="Phone"
                          fullWidth
                          size="small"
                          value={formik.values.contactInfo.phone}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.contactInfo?.phone &&
                            Boolean(formik.errors.contactInfo?.phone)
                          }
                          helperText={
                            formik.touched.contactInfo?.phone && formik.errors.contactInfo?.phone
                          }
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Iconify icon="mdi:phone" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="contactInfo.address"
                          label="Address"
                          fullWidth
                          size="small"
                          value={formik.values.contactInfo.address}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.contactInfo?.address &&
                            Boolean(formik.errors.contactInfo?.address)
                          }
                          helperText={
                            formik.touched.contactInfo?.address && formik.errors.contactInfo?.address
                          }
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Iconify icon="mdi:home" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="contactInfo.state"
                          label="State"
                          fullWidth
                          size="small"
                          select
                          value={formik.values.contactInfo.state}
                          onChange={formik.handleChange}
                          error={
                            formik.touched.contactInfo?.state &&
                            Boolean(formik.errors.contactInfo?.state)
                          }
                          helperText={
                            formik.touched.contactInfo?.state && formik.errors.contactInfo?.state
                          }
                        >
                          {stateOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="contactInfo.lga"
                          label="LGA"
                          fullWidth
                          size="small"
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
                </Box>

                {/* Enrollment Information */}
                <Box>
                  <Stack direction="row" alignItems="center" mb={2} spacing={1}>
                    <Iconify icon="mdi:school" color={theme.palette.primary.main} />
                    <Typography variant="h6" fontWeight={600}>
                      Academic Information
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={sectionCardStyle}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="program"
                          label="Program"
                          fullWidth
                          size="small"
                          select
                          value={formik.values.program}
                          onChange={formik.handleChange}
                          error={formik.touched.program && Boolean(formik.errors.program)}
                          helperText={formik.touched.program && formik.errors.program}
                          disabled={isLoadingPrograms}
                        >
                          {(programs || []).map((program) => (
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
                          size="small"
                          select
                          value={formik.values.classLevel}
                          onChange={formik.handleChange}
                          error={formik.touched.classLevel && Boolean(formik.errors.classLevel)}
                          helperText={formik.touched.classLevel && formik.errors.classLevel}
                          disabled={isLoadingClassLevels}
                        >
                          {(classLevels || []).map((classLevel) => (
                            <MenuItem key={classLevel._id} value={classLevel._id}>
                              {classLevel.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>

                {/* Guardian Information */}
                <Box>
                  <Stack direction="row" alignItems="center" mb={2} spacing={1}>
                    <Iconify icon="mdi:account-supervisor" color={theme.palette.primary.main} />
                    <Typography variant="h6" fontWeight={600}>
                      Guardian Information
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={sectionCardStyle}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="guardianInfo.guardianName"
                          label="Guardian Name"
                          fullWidth
                          size="small"
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
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Iconify icon="mdi:account" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="guardianInfo.guardianPhone"
                          label="Guardian Phone"
                          fullWidth
                          size="small"
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
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Iconify icon="mdi:phone" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="guardianInfo.relationship"
                          label="Relationship"
                          fullWidth
                          size="small"
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
                </Box>

                {/* Medical Information */}
                <Box>
                  <Stack direction="row" alignItems="center" mb={2} spacing={1}>
                    <Iconify icon="mdi:medical-bag" color={theme.palette.primary.main} />
                    <Typography variant="h6" fontWeight={600}>
                      Medical Information
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={sectionCardStyle}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="medicalInfo.bloodGroup"
                          label="Blood Group"
                          fullWidth
                          size="small"
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
                      <Grid item xs={12} sm={6}>
                        <TextField
                          name="medicalInfo.allergies"
                          label="Allergies"
                          fullWidth
                          size="small"
                          select
                          value={formik.values.medicalInfo.allergies}
                          onChange={formik.handleChange}
                        >
                          {allergyOptions.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          name="medicalInfo.chronicConditions"
                          label="Chronic Conditions"
                          fullWidth
                          size="small"
                          value={formik.values.medicalInfo.chronicConditions}
                          onChange={formik.handleChange}
                          multiline
                          rows={2}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Box>

                {/* Emergency Contact */}
                <Box>
                  <Stack direction="row" alignItems="center" mb={2} spacing={1}>
                    <Iconify icon="mdi:phone-alert" color={theme.palette.primary.main} />
                    <Typography variant="h6" fontWeight={600}>
                      Emergency Contact
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={sectionCardStyle}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          name="medicalInfo.emergencyContact.name"
                          label="Emergency Contact Name"
                          fullWidth
                          size="small"
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
                          label="Relationship"
                          fullWidth
                          size="small"
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
                          size="small"
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
                </Box>
              </Stack>
            </Box>
          </Box>
          
          {/* Footer with Actions */}
          <Box sx={{ 
            p: 3, 
            borderTop: `1px solid ${theme.palette.divider}`, 
            bgcolor: theme.palette.background.neutral,
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
            <Stack direction="row" spacing={2}>
              <Button 
                onClick={handleClose} 
                variant="outlined"
                startIcon={<Iconify icon="mdi:close" />}
              >
                Cancel
              </Button>
              <LoadingButton 
                loading={isPending} 
                variant="contained" 
                onClick={formik.handleSubmit}
                startIcon={<Iconify icon="mdi:check" />}
                sx={{ px: 4 }}
              >
                Add Student
              </LoadingButton>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

AddStudent.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};
