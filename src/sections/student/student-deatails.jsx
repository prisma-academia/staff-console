import _ from 'lodash';
import * as Yup from 'yup';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import Backdrop from '@mui/material/Backdrop';
import LoadingButton from '@mui/lab/LoadingButton';
import { 
  Tab, 
  Card, 
  Grid, 
  Chip, 
  Tabs, 
  Stack, 
  Paper, 
  Table,
  Badge,
  Avatar,
  Divider,
  TableRow,
  useTheme,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  TableContainer,
  CircularProgress
} from '@mui/material';

import config from 'src/config';
import { UserApi, programApi, classLevelApi } from 'src/api';

import Iconify from 'src/components/iconify';
import CustomSelect from 'src/components/select';

// Tab Panel component for organizing content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`student-tabpanel-${index}`}
      aria-labelledby={`student-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `student-tab-${index}`,
    'aria-controls': `student-tabpanel-${index}`,
  };
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '85%',
  maxWidth: 1200,
  height: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
};

const statusColors = {
  active: 'success',
  inactive: 'error',
  pending: 'warning',
  Completed: 'success',
  Processing: 'warning',
  Failed: 'error',
};

// Replace the nested ternaries for grade colors with an object lookup
const gradeColors = {
  'A': 'success',
  'B': 'info',
  'C': 'warning',
  'D': 'error',
};

// Add a function to determine GPA color
const getGpaColor = (gpa) => {
  if (gpa >= 3.5) return 'success';
  if (gpa >= 2.5) return 'info';
  return 'warning';
};

export default function StudentDetails({ open, setOpen, student }) {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  
  // Fetch student data from API using student ID
  const { 
    data: studentData, 
    isLoading, 
    isError: isLoadError, 
    error: loadError,
    refetch 
  } = useQuery({
    queryKey: ['student', student?._id],
    queryFn: () => UserApi.getStudentById(student?._id),
    enabled: !!student?._id && open,
    retry: 1,
    staleTime: 300000, // 5 minutes
  });

  // Validation schema
  const validationSchema = Yup.object({
    personalInfo: Yup.object({
      firstName: Yup.string().required('First name is required'),
      lastName: Yup.string().required('Last name is required'),
      middleName: Yup.string(),
      gender: Yup.string().required('Gender is required'),
      dateOfBirth: Yup.date(),
    }),
    contactInfo: Yup.object({
      email: Yup.string().email('Email is invalid').required('Email is required'),
      phone: Yup.string().required('Phone number is required'),
      address: Yup.string(),
      state: Yup.string(),
      lga: Yup.string(),
    }),
    guardianInfo: Yup.object({
      guardianName: Yup.string().required('Guardian name is required'),
      guardianPhone: Yup.string().required('Guardian phone is required'),
      relationship: Yup.string(),
    }),
    program: Yup.string(),
    classLevel: Yup.string(),
  });

  // Initialize Formik
  const formik = useFormik({
    initialValues: {
      personalInfo: {
        firstName: studentData?.personalInfo?.firstName || '',
        lastName: studentData?.personalInfo?.lastName || '',
        middleName: studentData?.personalInfo?.middleName || '',
        gender: studentData?.personalInfo?.gender || '',
        dateOfBirth: studentData?.personalInfo?.dateOfBirth || '',
      },
      contactInfo: {
        email: studentData?.contactInfo?.email || '',
        phone: studentData?.contactInfo?.phone || '',
        address: studentData?.contactInfo?.address || '',
        state: studentData?.contactInfo?.state || '',
        lga: studentData?.contactInfo?.lga || '',
      },
      guardianInfo: {
        guardianName: studentData?.guardianInfo?.guardianName || '',
        guardianPhone: studentData?.guardianInfo?.guardianPhone || '',
        relationship: studentData?.guardianInfo?.relationship || '',
      },
      program: studentData?.program?._id || '',
      classLevel: studentData?.classLevel?._id || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      // Construct payload with only changed fields
      const payload = {};
      
      // Add personal info changes
      if (!_.isEqual(values.personalInfo, studentData.personalInfo)) {
        payload.personalInfo = values.personalInfo;
      }
      
      // Add contact info changes
      if (!_.isEqual(values.contactInfo, studentData.contactInfo)) {
        payload.contactInfo = values.contactInfo;
      }
      
      // Add guardian info changes
      if (!_.isEqual(values.guardianInfo, studentData.guardianInfo)) {
        payload.guardianInfo = values.guardianInfo;
      }
      
      // Add program change
      if (values.program !== studentData.program?._id) {
        payload.program = values.program;
      }
      
      // Add class level change
      if (values.classLevel !== studentData.classLevel?._id) {
        payload.classLevel = values.classLevel;
      }
      
      // If no changes, show message and return
      if (Object.keys(payload).length === 0) {
        enqueueSnackbar('No changes detected', { variant: 'info' });
        formik.setSubmitting(false);
        return;
      }
      
      // Show confirmation before making major changes
      if (payload.program || payload.classLevel) {
        if (!window.confirm('Are you sure you want to update the student\'s program or class level? This may affect their enrollment status and courses.')) {
          formik.setSubmitting(false);
          return;
        }
      }
      
      // Call update function
      mutate(payload);
    },
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Close edit mode when changing tabs
    if (editMode) setEditMode(false);
  };

  const updateStudent = async (updatedData) => {
    if (!student?._id) return null;
    return UserApi.updateUser(student._id, updatedData);
  };

  const { mutate, isPending } = useMutation({ 
    mutationFn: updateStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', student?._id] });
      enqueueSnackbar({ message: 'Student updated successfully', variant: 'success' });
      formik.setSubmitting(false);
      setEditMode(false);
      setOpen(false);
    },
    onError: (error) => {
      formik.setSubmitting(false);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update student';
      enqueueSnackbar({ message: errorMessage, variant: 'error' });
    }
  });

  const handleClose = () => setOpen(false);

  const updateStudentStatus = async (newStatus) => {
    try {
      if (!studentData) {
        enqueueSnackbar({ message: 'Cannot update status: Student data not available', variant: 'error' });
        return;
      }
      
      mutate({ 
        ...studentData,
        status: newStatus 
      });
    } catch (err) {
      enqueueSnackbar({ message: err.message || 'Failed to update student status', variant: 'error' });
    }
  };

  // Handle errors
  useEffect(() => {
    if (isLoadError && loadError) {
      enqueueSnackbar({ 
        message: loadError.message || 'Failed to load student details', 
        variant: 'error' 
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadError]);

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(prev => !prev);
    if (editMode) {
      // Reset form values when cancelling edit
      formik.resetForm();
    }
  };

  const { data: programs, isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
    enabled: !!editMode && !!open,
  });

  const { data: classLevels, isLoading: isLoadingClassLevels } = useQuery({
    queryKey: ['classLevels'],
    queryFn: classLevelApi.getClassLevels,
    enabled: !!editMode && !!open,
  });

  if (!student) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Create content based on loading state
  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%' 
        }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
            <Typography>Loading student information...</Typography>
          </Stack>
        </Box>
      );
    }

    if (isLoadError) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%' 
        }}>
          <Stack alignItems="center" spacing={2}>
            <Iconify icon="mdi:alert-circle" width={64} height={64} color={theme.palette.error.main} />
            <Typography>Failed to load student details</Typography>
            <Button 
              variant="contained" 
              onClick={() => refetch()}
              startIcon={<Iconify icon="mdi:refresh" />}
            >
              Try Again
            </Button>
          </Stack>
        </Box>
      );
    }

    if (!studentData) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          height: '100%' 
        }}>
          <Typography>No student data available</Typography>
        </Box>
      );
    }

    // Get payment data from student record
    const paymentHistory = studentData.payments || [];
    
    // Get academic results from student record
    const academicResults = studentData.results || [];

    return (
      <>
        {/* Header */}
        <Box sx={{ 
          p: 3, 
          borderBottom: `1px solid ${theme.palette.divider}`, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: theme.palette.background.neutral
        }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: 15,
                    height: 15,
                    borderRadius: '50%',
                    bgcolor: studentData.status === 'active' ? 'success.main' : 'error.main',
                    border: `2px solid ${theme.palette.background.paper}`,
                  }}
                />
              }
            >
              <Avatar
                src={(() => {
                  if (!studentData.picture) return undefined;
                  return config.utils.isAbsoluteUrl(studentData.picture) 
                    ? studentData.picture 
                    : config.utils.buildImageUrl(config.upload.baseUrl || config.baseUrl, studentData.picture);
                })()}
                alt={`${studentData.personalInfo.firstName} ${studentData.personalInfo.lastName}`}
                sx={{ width: 60, height: 60 }}
              />
            </Badge>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {studentData.personalInfo.firstName} {studentData.personalInfo.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {studentData.regNumber} • {studentData.program?.name} • {studentData.classLevel?.name}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip 
              label={studentData.status.toUpperCase()} 
              color={statusColors[studentData.status] || 'default'} 
              size="small"
            />
            <Button
              size="small"
              variant={editMode ? "outlined" : "contained"}
              color={editMode ? "warning" : "primary"}
              onClick={toggleEditMode}
              startIcon={<Iconify icon={editMode ? "mdi:close" : "mdi:pencil"} />}
            >
              {editMode ? "Cancel Edit" : "Edit Student"}
            </Button>
            <IconButton onClick={handleClose} size="small">
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="student tabs"
            sx={{ px: 3 }}
          >
            <Tab label="Profile" {...a11yProps(0)} />
            <Tab label="Academic" {...a11yProps(1)} />
            <Tab label="Payments" {...a11yProps(2)} />
            <Tab label="Medical" {...a11yProps(3)} />
          </Tabs>
        </Box>

        {/* Tab Panels Container with Scrollable Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {/* Profile Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {/* Academic Information - Only show when in edit mode */}
              {editMode && (
                <Grid item xs={12}>
                  <Card sx={{ p: 3, boxShadow: theme.shadows[2] }}>
                    <Stack direction="row" alignItems="center" mb={2} spacing={1}>
                      <Iconify icon="mdi:school" color={theme.palette.primary.main} />
                      <Typography variant="h6" fontWeight={600}>
                        Academic Information
                      </Typography>
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <CustomSelect 
                          data={programs || []} 
                          label="Program"
                          name="program"
                          formik={formik}
                          disabled={isLoadingPrograms}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <CustomSelect 
                          data={classLevels || []} 
                          label="Class Level"
                          name="classLevel"
                          formik={formik}
                          disabled={isLoadingClassLevels}
                        />
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>
              )}

              {/* Personal Information */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, height: '100%', boxShadow: theme.shadows[2] }}>
                  <Stack direction="row" alignItems="center" mb={2} spacing={1}>
                    <Iconify icon="mdi:account" color={theme.palette.primary.main} />
                    <Typography variant="h6" fontWeight={600}>
                      Personal Information
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  {editMode ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          name="personalInfo.firstName"
                          value={formik.values.personalInfo.firstName}
                          onChange={formik.handleChange}
                          error={formik.touched.personalInfo?.firstName && Boolean(formik.errors.personalInfo?.firstName)}
                          helperText={formik.touched.personalInfo?.firstName && formik.errors.personalInfo?.firstName}
                          size="small"
                          margin="dense"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          name="personalInfo.lastName"
                          value={formik.values.personalInfo.lastName}
                          onChange={formik.handleChange}
                          error={formik.touched.personalInfo?.lastName && Boolean(formik.errors.personalInfo?.lastName)}
                          helperText={formik.touched.personalInfo?.lastName && formik.errors.personalInfo?.lastName}
                          size="small"
                          margin="dense"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Middle Name"
                          name="personalInfo.middleName"
                          value={formik.values.personalInfo.middleName}
                          onChange={formik.handleChange}
                          error={formik.touched.personalInfo?.middleName && Boolean(formik.errors.personalInfo?.middleName)}
                          helperText={formik.touched.personalInfo?.middleName && formik.errors.personalInfo?.middleName}
                          size="small"
                          margin="dense"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Gender"
                          name="personalInfo.gender"
                          value={formik.values.personalInfo.gender}
                          onChange={formik.handleChange}
                          error={formik.touched.personalInfo?.gender && Boolean(formik.errors.personalInfo?.gender)}
                          helperText={formik.touched.personalInfo?.gender && formik.errors.personalInfo?.gender}
                          size="small"
                          margin="dense"
                          select
                          SelectProps={{ native: true }}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Date of Birth"
                          type="date"
                          name="personalInfo.dateOfBirth"
                          value={formik.values.personalInfo.dateOfBirth ? new Date(formik.values.personalInfo.dateOfBirth).toISOString().split('T')[0] : ''}
                          onChange={formik.handleChange}
                          error={formik.touched.personalInfo?.dateOfBirth && Boolean(formik.errors.personalInfo?.dateOfBirth)}
                          helperText={formik.touched.personalInfo?.dateOfBirth && formik.errors.personalInfo?.dateOfBirth}
                          size="small"
                          margin="dense"
                          InputLabelProps={{
                            shrink: true,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          type="email"
                          name="contactInfo.email"
                          value={formik.values.contactInfo.email}
                          onChange={formik.handleChange}
                          error={formik.touched.contactInfo?.email && Boolean(formik.errors.contactInfo?.email)}
                          helperText={formik.touched.contactInfo?.email && formik.errors.contactInfo?.email}
                          size="small"
                          margin="dense"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          name="contactInfo.phone"
                          value={formik.values.contactInfo.phone}
                          onChange={formik.handleChange}
                          error={formik.touched.contactInfo?.phone && Boolean(formik.errors.contactInfo?.phone)}
                          helperText={formik.touched.contactInfo?.phone && formik.errors.contactInfo?.phone}
                          size="small"
                          margin="dense"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="State"
                          name="contactInfo.state"
                          value={formik.values.contactInfo.state}
                          onChange={formik.handleChange}
                          error={formik.touched.contactInfo?.state && Boolean(formik.errors.contactInfo?.state)}
                          helperText={formik.touched.contactInfo?.state && formik.errors.contactInfo?.state}
                          size="small"
                          margin="dense"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="LGA"
                          name="contactInfo.lga"
                          value={formik.values.contactInfo.lga}
                          onChange={formik.handleChange}
                          error={formik.touched.contactInfo?.lga && Boolean(formik.errors.contactInfo?.lga)}
                          helperText={formik.touched.contactInfo?.lga && formik.errors.contactInfo?.lga}
                          size="small"
                          margin="dense"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Address"
                          name="contactInfo.address"
                          value={formik.values.contactInfo.address}
                          onChange={formik.handleChange}
                          error={formik.touched.contactInfo?.address && Boolean(formik.errors.contactInfo?.address)}
                          helperText={formik.touched.contactInfo?.address && formik.errors.contactInfo?.address}
                          size="small"
                          margin="dense"
                          multiline
                          rows={2}
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Full Name
                        </Typography>
                        <Typography variant="body1" fontWeight={500} gutterBottom>
                          {studentData.personalInfo.firstName} {studentData.personalInfo.middleName} {studentData.personalInfo.lastName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Gender
                        </Typography>
                        <Typography variant="body1" fontWeight={500} gutterBottom>
                          {studentData.personalInfo.gender}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Date of Birth
                        </Typography>
                        <Typography variant="body1" fontWeight={500} gutterBottom>
                          {formatDate(studentData.personalInfo.dateOfBirth)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1" fontWeight={500} gutterBottom>
                          {studentData.contactInfo.email}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1" fontWeight={500} gutterBottom>
                          {studentData.contactInfo.phone}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Enrollment Date
                        </Typography>
                        <Typography variant="body1" fontWeight={500} gutterBottom>
                          {formatDate(studentData.enrollmentDate)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Address
                        </Typography>
                        <Typography variant="body1" fontWeight={500} gutterBottom>
                          {studentData.contactInfo.address}, {studentData.contactInfo.lga}, {studentData.contactInfo.state}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </Card>
              </Grid>

              {/* Guardian Information */}
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, height: '100%', boxShadow: theme.shadows[2] }}>
                  <Stack direction="row" alignItems="center" mb={2} spacing={1}>
                    <Iconify icon="mdi:account-supervisor" color={theme.palette.primary.main} />
                    <Typography variant="h6" fontWeight={600}>
                      Guardian Information
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  {editMode ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Guardian Name"
                          name="guardianInfo.guardianName"
                          value={formik.values.guardianInfo.guardianName}
                          onChange={formik.handleChange}
                          error={formik.touched.guardianInfo?.guardianName && Boolean(formik.errors.guardianInfo?.guardianName)}
                          helperText={formik.touched.guardianInfo?.guardianName && formik.errors.guardianInfo?.guardianName}
                          size="small"
                          margin="dense"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Relationship"
                          name="guardianInfo.relationship"
                          value={formik.values.guardianInfo.relationship}
                          onChange={formik.handleChange}
                          error={formik.touched.guardianInfo?.relationship && Boolean(formik.errors.guardianInfo?.relationship)}
                          helperText={formik.touched.guardianInfo?.relationship && formik.errors.guardianInfo?.relationship}
                          size="small"
                          margin="dense"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          name="guardianInfo.guardianPhone"
                          value={formik.values.guardianInfo.guardianPhone}
                          onChange={formik.handleChange}
                          error={formik.touched.guardianInfo?.guardianPhone && Boolean(formik.errors.guardianInfo?.guardianPhone)}
                          helperText={formik.touched.guardianInfo?.guardianPhone && formik.errors.guardianInfo?.guardianPhone}
                          size="small"
                          margin="dense"
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Guardian Name
                        </Typography>
                        <Typography variant="body1" fontWeight={500} gutterBottom>
                          {studentData.guardianInfo.guardianName}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Relationship
                        </Typography>
                        <Typography variant="body1" fontWeight={500} gutterBottom>
                          {studentData.guardianInfo.relationship}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1" fontWeight={500} gutterBottom>
                          {studentData.guardianInfo.guardianPhone}
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Academic Tab */}
          <TabPanel value={tabValue} index={1}>
            <Card sx={{ boxShadow: theme.shadows[2] }}>
              <Stack 
                direction="row" 
                alignItems="center" 
                sx={{ px: 3, py: 2 }}
                spacing={1}
              >
                <Iconify icon="mdi:school" color={theme.palette.primary.main} />
                <Typography variant="h6" fontWeight={600}>
                  Academic Performance
                </Typography>
              </Stack>
              <Divider />
              
              {academicResults && academicResults.length > 0 ? (
                academicResults.map((semester, index) => (
                  <Box key={index} sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {semester.session} - {semester.semester}
                      </Typography>
                      <Chip 
                        label={`GPA: ${semester.gpa}`} 
                        color={getGpaColor(semester.gpa)} 
                        size="small"
                      />
                    </Stack>
                    
                    <TableContainer component={Paper} elevation={0} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: theme.palette.background.neutral }}>
                            <TableCell>Course Code</TableCell>
                            <TableCell>Course Title</TableCell>
                            <TableCell align="center">Credit Units</TableCell>
                            <TableCell align="center">Grade</TableCell>
                            <TableCell align="center">Grade Points</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {semester.courses && semester.courses.map((course) => (
                            <TableRow key={course.code}>
                              <TableCell>{course.code}</TableCell>
                              <TableCell>{course.title}</TableCell>
                              <TableCell align="center">{course.credits}</TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={course.grade} 
                                  color={gradeColors[course.grade] || 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">{course.points}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ))
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No academic records found.</Typography>
                </Box>
              )}
            </Card>
          </TabPanel>

          {/* Payments Tab */}
          <TabPanel value={tabValue} index={2}>
            <Card sx={{ boxShadow: theme.shadows[2] }}>
              <Stack
                direction="row" 
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 3, py: 2 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Iconify icon="mdi:cash" color={theme.palette.primary.main} />
                  <Typography variant="h6" fontWeight={600}>
                    Payment History
                  </Typography>
                </Stack>
                
                <Button 
                  size="small" 
                  variant="contained" 
                  startIcon={<Iconify icon="mdi:download" />}
                >
                  Export
                </Button>
              </Stack>
              <Divider />
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: theme.palette.background.neutral }}>
                      <TableCell>Description</TableCell>
                      <TableCell>Fee Type</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Date</TableCell>
                      <TableCell align="center">Reference</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentHistory && paymentHistory.length > 0 ? (
                      paymentHistory.map((payment) => (
                        <TableRow key={payment._id}>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell>{payment.fee?.feeType || 'N/A'}</TableCell>
                          <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell align="center">{formatDate(payment.createdAt)}</TableCell>
                          <TableCell align="center">{payment.reference || 'N/A'}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={payment.status.toUpperCase()} 
                              color={statusColors[payment.status] || 'default'} 
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography color="text.secondary">No payment records found.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </TabPanel>

          {/* Medical Tab */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, height: '100%', boxShadow: theme.shadows[2] }}>
                  <Stack direction="row" alignItems="center" mb={2} spacing={1}>
                    <Iconify icon="mdi:medical-bag" color={theme.palette.primary.main} />
                    <Typography variant="h6" fontWeight={600}>
                      Medical Information
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Blood Group
                      </Typography>
                      <Typography variant="body1" fontWeight={500} gutterBottom>
                        {studentData.medicalInfo?.bloodGroup || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Allergies
                      </Typography>
                      <Typography variant="body1" fontWeight={500} gutterBottom>
                        {studentData.medicalInfo?.allergies?.join(', ') || 'None'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, height: '100%', boxShadow: theme.shadows[2] }}>
                  <Stack direction="row" alignItems="center" mb={2} spacing={1}>
                    <Iconify icon="mdi:phone-alert" color={theme.palette.primary.main} />
                    <Typography variant="h6" fontWeight={600}>
                      Emergency Contact
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Contact Name
                      </Typography>
                      <Typography variant="body1" fontWeight={500} gutterBottom>
                        {studentData.medicalInfo?.emergencyContact?.name || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Relationship
                      </Typography>
                      <Typography variant="body1" fontWeight={500} gutterBottom>
                        {studentData.medicalInfo?.emergencyContact?.relationship || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1" fontWeight={500} gutterBottom>
                        {studentData.medicalInfo?.emergencyContact?.phone || 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Box>

        {/* Footer with Actions */}
        <Box sx={{ 
          p: 2, 
          borderTop: `1px solid ${theme.palette.divider}`, 
          bgcolor: theme.palette.background.neutral,
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <Stack direction="row" spacing={2}>
            {editMode ? (
              <LoadingButton 
                variant="contained" 
                color="primary"
                startIcon={<Iconify icon="mdi:content-save" />}
                onClick={formik.handleSubmit}
                loading={formik.isSubmitting || isPending}
              >
                Save Changes
              </LoadingButton>
            ) : (
              <Button 
                variant="outlined" 
                color={studentData.status === "active" ? "error" : "success"}
                startIcon={
                  studentData.status === "active" 
                    ? <Iconify icon="mdi:account-cancel" /> 
                    : <Iconify icon="mdi:account-check" />
                }
                onClick={() => updateStudentStatus(studentData.status === "active" ? "inactive" : "active")}
                disabled={isPending || formik.isSubmitting}
              >
                {studentData.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            )}
            <Button 
              onClick={handleClose} 
              variant={editMode ? "outlined" : "contained"}
              startIcon={<Iconify icon="mdi:close" />}
              disabled={formik.isSubmitting || isPending}
            >
              Close
            </Button>
          </Stack>
        </Box>
      </>
    );
  };

  return (
    <div>
      <IconButton onClick={() => setOpen(true)}>
        <Iconify color="primary" icon="carbon:view" />
      </IconButton>
      
      <Modal
        aria-labelledby="student-details-modal"
        aria-describedby="student-information-details"
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={open}>
          <Box sx={style}>
            {renderContent()}
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}

StudentDetails.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  student: PropTypes.object,
};
