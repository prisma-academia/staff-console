import _ from 'lodash';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { Helmet } from 'react-helmet-async';
import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Tab,
  Tabs,
  Chip,
  Stack,
  Avatar,
  Button,
  useTheme,
  Container,
  Typography,
  IconButton,
  LinearProgress,
} from '@mui/material';

import config from 'src/config';
import { AuditApi, StudentApi, programApi, classLevelApi } from 'src/api';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import TabPanel from './tabs/tab-panel';
import ProfileTab from './tabs/profile-tab';
import MedicalTab from './tabs/medical-tab';
import AcademicTab from './tabs/academic-tab';
import PaymentsTab from './tabs/payments-tab';
import AdminActionsTab from './tabs/admin-actions-tab';

// ----------------------------------------------------------------------

function a11yProps(index) {
  return {
    id: `student-tab-${index}`,
    'aria-controls': `student-tabpanel-${index}`,
  };
}

const statusColors = {
  active: 'success',
  pending: 'warning',
  disable: 'error',
};

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
    phone: Yup.string().required('Phone number is required').length(11, 'Phone number must be 11 characters'),
    address: Yup.string(),
    state: Yup.string(),
    lga: Yup.string(),
  }),
  guardianInfo: Yup.object({
    guardianName: Yup.string(),
    guardianPhone: Yup.string(),
    relationship: Yup.string(),
  }),
  medicalInfo: Yup.object({
    bloodGroup: Yup.string(),
    allergies: Yup.array().of(Yup.string()),
    emergencyContact: Yup.object({
      name: Yup.string(),
      relationship: Yup.string(),
      phone: Yup.string(),
    }),
  }),
  program: Yup.string(),
  classLevel: Yup.string(),
  status: Yup.string().oneOf(['pending', 'active', 'disable']),
});

export default function StudentDetailPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);

  const { data: student, isLoading, isError } = useQuery({
    queryKey: ['student', id],
    queryFn: () => StudentApi.getStudentById(id),
    enabled: !!id && id !== 'new',
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
    enabled: !!editMode,
  });

  const { data: classLevels = [] } = useQuery({
    queryKey: ['classLevels'],
    queryFn: classLevelApi.getClassLevels,
    enabled: !!editMode,
  });

  // Track if audit log has been created to prevent duplicate entries
  const auditLogCreated = useRef(false);

  // Create audit log when student data is loaded
  useEffect(() => {
    if (student?._id && id && !auditLogCreated.current && !isLoading && !isError) {
      auditLogCreated.current = true;
      AuditApi.createAuditLog({
        entityType: 'Student',
        entityId: student._id,
        actionType: 'view',
        status: 'success',
      }).catch(() => {
        // Silently handle errors - don't disrupt user experience
      });
    }
  }, [student, id, isLoading, isError]);

  const { mutate: updateStudent } = useMutation({
    mutationFn: (studentData) => StudentApi.adminEditStudent(id, studentData),
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      enqueueSnackbar('Student updated successfully', { variant: 'success' });
      setEditMode(false);
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Update failed', { variant: 'error' });
      formik.setSubmitting(false);
    },
  });

  const formik = useFormik({
    initialValues: {
      personalInfo: {
        firstName: student?.personalInfo?.firstName || '',
        lastName: student?.personalInfo?.lastName || '',
        middleName: student?.personalInfo?.middleName || '',
        gender: student?.personalInfo?.gender || '',
        dateOfBirth: student?.personalInfo?.dateOfBirth ? new Date(student.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
      },
      contactInfo: {
        email: student?.contactInfo?.email || '',
        phone: student?.contactInfo?.phone || '',
        address: student?.contactInfo?.address || '',
        state: student?.contactInfo?.state || '',
        lga: student?.contactInfo?.lga || '',
      },
      guardianInfo: {
        guardianName: student?.guardianInfo?.guardianName || '',
        guardianPhone: student?.guardianInfo?.guardianPhone || '',
        relationship: student?.guardianInfo?.relationship || '',
      },
      medicalInfo: {
        bloodGroup: student?.medicalInfo?.bloodGroup || '',
        allergies: student?.medicalInfo?.allergies || [],
        emergencyContact: {
          name: student?.medicalInfo?.emergencyContact?.name || '',
          relationship: student?.medicalInfo?.emergencyContact?.relationship || '',
          phone: student?.medicalInfo?.emergencyContact?.phone || '',
        },
      },
      program: student?.program?._id || student?.program || '',
      classLevel: student?.classLevel?._id || student?.classLevel || '',
      status: student?.status || 'pending',
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      formik.setSubmitting(true);
      const payload = {};
      
      // Only include changed fields
      if (!_.isEqual(values.personalInfo, {
        firstName: student?.personalInfo?.firstName || '',
        lastName: student?.personalInfo?.lastName || '',
        middleName: student?.personalInfo?.middleName || '',
        gender: student?.personalInfo?.gender || '',
        dateOfBirth: student?.personalInfo?.dateOfBirth ? new Date(student.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
      })) {
        payload.personalInfo = values.personalInfo;
      }
      
      if (!_.isEqual(values.contactInfo, {
        email: student?.contactInfo?.email || '',
        phone: student?.contactInfo?.phone || '',
        address: student?.contactInfo?.address || '',
        state: student?.contactInfo?.state || '',
        lga: student?.contactInfo?.lga || '',
      })) {
        payload.contactInfo = values.contactInfo;
      }
      
      if (!_.isEqual(values.guardianInfo, {
        guardianName: student?.guardianInfo?.guardianName || '',
        guardianPhone: student?.guardianInfo?.guardianPhone || '',
        relationship: student?.guardianInfo?.relationship || '',
      })) {
        payload.guardianInfo = values.guardianInfo;
      }
      
      if (!_.isEqual(values.medicalInfo, {
        bloodGroup: student?.medicalInfo?.bloodGroup || '',
        allergies: student?.medicalInfo?.allergies || [],
        emergencyContact: {
          name: student?.medicalInfo?.emergencyContact?.name || '',
          relationship: student?.medicalInfo?.emergencyContact?.relationship || '',
          phone: student?.medicalInfo?.emergencyContact?.phone || '',
        },
      })) {
        payload.medicalInfo = values.medicalInfo;
      }
      
      if (values.program !== (student?.program?._id || student?.program || '')) {
        payload.program = values.program;
      }
      
      if (values.classLevel !== (student?.classLevel?._id || student?.classLevel || '')) {
        payload.classLevel = values.classLevel;
      }
      
      if (values.status !== (student?.status || 'pending')) {
        payload.status = values.status;
      }
      
      if (Object.keys(payload).length === 0) {
        enqueueSnackbar('No changes detected', { variant: 'info' });
        formik.setSubmitting(false);
        return;
      }
      
      updateStudent(payload);
    },
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (editMode) setEditMode(false);
  };

  const handleBack = () => {
    navigate('/student');
  };

  const handleToggleEdit = () => {
    if (editMode) {
      formik.resetForm();
    }
    setEditMode(!editMode);
  };

  const getInitials = () => {
    const firstName = formik.values.personalInfo.firstName || '';
    const lastName = formik.values.personalInfo.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'S';
  };

  const fullName = `${formik.values.personalInfo.firstName || ''} ${formik.values.personalInfo.lastName || ''}`.trim() || 'Student';

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  if (isError || !student) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Iconify icon="eva:alert-circle-fill" sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Student not found
          </Typography>
          <Button variant="contained" onClick={handleBack} sx={{ mt: 2 }}>
            Back to Students
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title> {fullName} | Student Management </title>
      </Helmet>

      <Container maxWidth="xl">
        <Box sx={{ pb: 5, pt: 4 }}>
          {/* Header Section */}
          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: (thm) => thm.shadows[2],
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={3} alignItems="center">
                <Avatar
                  src={(() => {
                    if (!student.picture) return undefined;
                    return config.utils.isAbsoluteUrl(student.picture)
                      ? student.picture
                      : config.utils.buildImageUrl(config.upload.baseUrl || config.baseUrl, student.picture);
                  })()}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: theme.palette.primary.main,
                    fontSize: 32,
                    fontWeight: 600,
                  }}
                >
                  {getInitials()}
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    {fullName}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={formik.values.status || 'pending'}
                      color={statusColors[formik.values.status] || 'default'}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {formik.values.contactInfo.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • {student.regNumber}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
              <Stack direction="row" spacing={2}>
                {editMode ? (
                  <>
                    <Button variant="outlined" color="inherit" onClick={handleToggleEdit}>
                      Cancel
                    </Button>
                    <Can do="edit_student">
                      <LoadingButton
                        variant="contained"
                        onClick={formik.handleSubmit}
                        loading={formik.isSubmitting}
                        startIcon={<Iconify icon="eva:save-fill" />}
                      >
                        Save Changes
                      </LoadingButton>
                    </Can>
                  </>
                ) : (
                  <>
                    <Can do="edit_student">
                      <Button
                        variant="contained"
                        onClick={handleToggleEdit}
                        startIcon={<Iconify icon="eva:edit-fill" />}
                      >
                        Edit
                      </Button>
                    </Can>
                    <IconButton onClick={handleBack} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                      <Iconify icon="eva:arrow-back-fill" />
                    </IconButton>
                  </>
                )}
              </Stack>
            </Stack>
          </Box>

          {/* Tabs */}
          <Box
            sx={{
              mb: 3,
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: (thm) => thm.shadows[1],
            }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="student tabs"
              sx={{
                px: 3,
                '& .MuiTab-root': {
                  minHeight: 64,
                },
              }}
            >
              <Tab label="Profile" icon={<Iconify icon="eva:person-fill" />} iconPosition="start" {...a11yProps(0)} />
              <Tab label="Academic" icon={<Iconify icon="mdi:school" />} iconPosition="start" {...a11yProps(1)} />
              <Tab label="Payments" icon={<Iconify icon="mdi:cash" />} iconPosition="start" {...a11yProps(2)} />
              <Tab label="Medical" icon={<Iconify icon="mdi:medical-bag" />} iconPosition="start" {...a11yProps(3)} />
              <Tab
                label="Admin Actions"
                icon={<Iconify icon="eva:settings-fill" />}
                iconPosition="start"
                {...a11yProps(4)}
              />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: (thm) => thm.shadows[1],
              p: 3,
            }}
          >
            <TabPanel value={tabValue} index={0}>
              <ProfileTab
                formik={formik}
                editMode={editMode}
                student={student}
                programs={programs}
                classLevels={classLevels}
              />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <AcademicTab student={student} />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <PaymentsTab student={student} />
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
              <MedicalTab formik={formik} editMode={editMode} student={student} />
            </TabPanel>
            <TabPanel value={tabValue} index={4}>
              <AdminActionsTab
                studentId={id}
                studentStatus={formik.values.status}
                studentEmail={formik.values.contactInfo.email}
                onStatusChange={() => {
                  queryClient.invalidateQueries({ queryKey: ['student', id] });
                }}
              />
            </TabPanel>
          </Box>
        </Box>
      </Container>
    </>
  );
}

