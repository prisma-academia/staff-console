import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
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

import { UserApi, RolePermissionApi } from 'src/api';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import TabPanel from './tabs/tab-panel';
import ProfileTab from './tabs/profile-tab';
import PermissionsTab from './tabs/permissions-tab';
import AdminActionsTab from './tabs/admin-actions-tab';

// ----------------------------------------------------------------------

function a11yProps(index) {
  return {
    id: `user-tab-${index}`,
    'aria-controls': `user-tabpanel-${index}`,
  };
}

const statusColors = {
  active: 'success',
  pending: 'warning',
  disable: 'error',
};

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  role: Yup.string().oneOf(['admin', 'staff', 'instructor']).required('Role is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  middleName: Yup.string(),
  dateOfBirth: Yup.date(),
  gender: Yup.string().oneOf(['Male', 'Female', 'Other']).required('Gender is required'),
  phone: Yup.string(),
  employeeId: Yup.string().when('role', {
    is: 'instructor',
    then: (schema) => schema.required('Employee ID is required for instructors'),
  }),
  hireDate: Yup.date().when('role', {
    is: 'instructor',
    then: (schema) => schema.required('Hire date is required for instructors'),
  }),
  department: Yup.string(),
  qualifications: Yup.string(),
  groups: Yup.array().of(Yup.string()),
  permission: Yup.array().of(Yup.string()),
});

export default function UserDetailPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [tabValue, setTabValue] = useState(0);
  const [editMode, setEditMode] = useState(false);

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', id],
    queryFn: () => UserApi.getUserById(id),
    enabled: !!id && id !== 'new',
  });

  const { data: rolePermissions = [] } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: () => RolePermissionApi.getRolePermissions(),
  });

  // Transform role permissions to roleOptions
  const roleOptions = useMemo(() => {
    const uniqueRoles = [
      ...new Set(
        rolePermissions.filter((rp) => rp.isActive).map((rp) => rp.role)
      ),
    ];
    return uniqueRoles.map((role) => ({
      _id: role,
      name: role.charAt(0).toUpperCase() + role.slice(1),
    }));
  }, [rolePermissions]);

  const { mutate: updateUser } = useMutation({
    mutationFn: (userData) => UserApi.updateUser(id, userData),
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      enqueueSnackbar('User updated successfully', { variant: 'success' });
      setEditMode(false);
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Update failed', { variant: 'error' });
      formik.setSubmitting(false);
    },
  });

  const formik = useFormik({
    initialValues: {
      email: user?.email || '',
      role: user?.role || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      middleName: user?.middleName || '',
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      gender: user?.gender || '',
      phone: user?.phone || '',
      employeeId: user?.employeeId || '',
      hireDate: user?.hireDate ? user.hireDate.split('T')[0] : '',
      department: user?.department?._id || user?.department || '',
      departmentName: user?.department?.name || '',
      qualifications: user?.qualifications?.join(', ') || '',
      groups: user?.groups?.map((g) => g._id || g) || [],
      groupsNames: user?.groups?.map((g) => g.name || g) || [],
      permission: user?.permission || [],
      status: user?.status || 'pending',
      internalEmail: user?.internalEmail || '',
      address: user?.address || '',
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      formik.setSubmitting(true);
      const payload = { ...values };
      if (values.qualifications) {
        payload.qualifications = values.qualifications.split(',').map((q) => q.trim()).filter((q) => q);
      }
      if (!Array.isArray(payload.groups)) {
        payload.groups = [];
      }
      if (!Array.isArray(payload.permission)) {
        payload.permission = [];
      }
      if (payload.department === '') {
        delete payload.department;
      }
      delete payload.departmentName;
      delete payload.groupsNames;
      updateUser(payload);
    },
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/user');
  };

  const handleToggleEdit = () => {
    if (editMode) {
      formik.resetForm();
    }
    setEditMode(!editMode);
  };

  const getInitials = () => {
    const firstName = formik.values.firstName || '';
    const lastName = formik.values.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const fullName = `${formik.values.firstName || ''} ${formik.values.lastName || ''}`.trim() || 'User';

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <LinearProgress />
        </Box>
      </Container>
    );
  }

  if (isError || !user) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Iconify icon="eva:alert-circle-fill" sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            User not found
          </Typography>
          <Button variant="contained" onClick={handleBack} sx={{ mt: 2 }}>
            Back to Users
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Helmet>
        <title> {fullName} | User Management </title>
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
                      {formik.values.email}
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
                    <Can do="edit_user">
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
                    <Can do="edit_user">
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
              aria-label="user tabs"
              sx={{
                px: 3,
                '& .MuiTab-root': {
                  minHeight: 64,
                },
              }}
            >
              <Tab label="Profile" icon={<Iconify icon="eva:person-fill" />} iconPosition="start" {...a11yProps(0)} />
              <Tab
                label="Permissions"
                icon={<Iconify icon="eva:shield-fill" />}
                iconPosition="start"
                {...a11yProps(1)}
              />
              <Tab
                label="Admin Actions"
                icon={<Iconify icon="eva:settings-fill" />}
                iconPosition="start"
                {...a11yProps(2)}
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
              <ProfileTab formik={formik} editMode={editMode} roleOptions={roleOptions} />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <PermissionsTab formik={formik} editMode={editMode} />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
              <AdminActionsTab
                userId={id}
                userStatus={formik.values.status}
                userEmail={formik.values.email}
                onStatusChange={() => {
                  queryClient.invalidateQueries({ queryKey: ['user', id] });
                }}
              />
            </TabPanel>
          </Box>
        </Box>
      </Container>
    </>
  );
}

