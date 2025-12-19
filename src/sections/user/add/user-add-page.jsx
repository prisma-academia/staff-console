import * as Yup from 'yup';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Grid,
  Stack,
  Button,
  useTheme,
  Container,
  Typography,
  IconButton,
} from '@mui/material';

import { UserApi, RolePermissionApi } from 'src/api';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import ProfileTab from '../detail/tabs/profile-tab';
import PermissionsTab from '../detail/tabs/permissions-tab';

// Validation schema will be created dynamically based on roleOptions
const createValidationSchema = (validRoles) =>
  Yup.object({
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
    role: Yup.string().oneOf(validRoles).required('Role is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  middleName: Yup.string(),
  dateOfBirth: Yup.date().required('Date of birth is required'),
  gender: Yup.string().oneOf(['Male', 'Female', 'Other']).required('Gender is required'),
  phone: Yup.string().required('Phone number is required'),
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

export default function UserAddPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

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

  // Get valid role values for validation schema
  const validRoles = useMemo(() => roleOptions.map((option) => option._id), [roleOptions]);

  // Create validation schema with dynamic roles
  const validationSchema = useMemo(() => createValidationSchema(validRoles), [validRoles]);

  const { mutate: createUser, isPending } = useMutation({
    mutationFn: (userData) => UserApi.register(userData),
    onSuccess: (data) => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User added successfully', { variant: 'success' });
      // Navigate to the new user's detail page
      if (data?._id) {
        navigate(`/user/${data._id}`);
      } else {
        navigate('/user');
      }
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to add user', { variant: 'error' });
      formik.setSubmitting(false);
    },
  });

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      role: '',
      firstName: '',
      lastName: '',
      middleName: '',
      dateOfBirth: '',
      gender: '',
      phone: '',
      employeeId: '',
      hireDate: '',
      department: '',
      qualifications: '',
      groups: [],
      permission: [],
      internalEmail: '',
      address: '',
      status: 'pending',
    },
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
      createUser(payload);
    },
  });

  // Auto-fill permissions when role is selected
  useEffect(() => {
    if (formik.values.role) {
      const rolePermission = rolePermissions.find(
        (rp) => rp.role === formik.values.role && rp.isActive
      );
      if (rolePermission?.permissions && Array.isArray(rolePermission.permissions)) {
        formik.setFieldValue('permission', rolePermission.permissions);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.role, rolePermissions]);

  const handleBack = () => {
    navigate('/user');
  };

  return (
    <>
      <Helmet>
        <title> Add New User | User Management </title>
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
              <Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  Add New User
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a new user account with permissions and groups
                </Typography>
              </Box>
              <IconButton onClick={handleBack} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <Iconify icon="eva:arrow-back-fill" />
              </IconButton>
            </Stack>
          </Box>

          {/* Main Content - Side by Side Layout */}
          <Grid container spacing={3}>
            {/* Left Column - User Form */}
            <Grid item xs={12} md={7}>
              <ProfileTab formik={formik} editMode isAddMode roleOptions={roleOptions} />
            </Grid>

            {/* Right Column - Permissions */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  position: { md: 'sticky' },
                  top: { md: 24 },
                  maxHeight: { md: 'calc(100vh - 120px)' },
                  overflow: { md: 'auto' },
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: (thm) => thm.shadows[1],
                  p: 3,
                }}
              >
                <PermissionsTab formik={formik} editMode />
              </Box>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box
            sx={{
              mt: 4,
              p: 3,
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: (thm) => thm.shadows[1],
            }}
          >
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button variant="outlined" color="inherit" onClick={handleBack}>
                Cancel
              </Button>
              <Can do="add_user">
                <LoadingButton
                  variant="contained"
                  onClick={formik.handleSubmit}
                  loading={formik.isSubmitting || isPending}
                  startIcon={<Iconify icon="eva:save-fill" />}
                >
                  Create User
                </LoadingButton>
              </Can>
            </Stack>
          </Box>
        </Box>
      </Container>
    </>
  );
}

