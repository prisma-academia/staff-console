import * as Yup from 'yup';
import * as React from 'react';
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import Backdrop from '@mui/material/Backdrop';
import LoadingButton from '@mui/lab/LoadingButton';
import { Grid, Stack, Checkbox, TextField, Typography, FormControlLabel } from '@mui/material';

import { UserApi, userGroupApi } from 'src/api';

import CustomSelect from 'src/components/select';

import { PERMISSION_CATEGORIES } from './permissions-config';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  maxWidth: '600px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '90vh',
  overflow: 'auto',
};

const genderOptions = [
  { _id: 'Male', name: 'Male' },
  { _id: 'Female', name: 'Female' },
  { _id: 'Other', name: 'Other' },
];

const roleOptions = [
  { _id: 'admin', name: 'Admin' },
  { _id: 'staff', name: 'Staff' },
  { _id: 'instructor', name: 'Instructor' },
];

export default function EditUser({ open, setOpen, user }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data: userGroups = [] } = useQuery({
    queryKey: ['user-groups'],
    queryFn: () => userGroupApi.getGroups(),
  });

  const departments = useMemo(() => 
    (userGroups || []).filter(group => group.type === 'department'),
    [userGroups]
  );

  const nonDepartmentGroups = useMemo(() => 
    (userGroups || []).filter(group => group.type !== 'department'),
    [userGroups]
  );

  const { mutate } = useMutation({
    mutationFn: (userData) => UserApi.updateUser(user._id || user.id, userData),
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User updated successfully', { variant: 'success' });
      setOpen(false);
    },
    onError: (error) => {
      const errorMessage = error.message || 'An error occurred';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      formik.setSubmitting(false);
    },
  });

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
      qualifications: user?.qualifications?.join(', ') || '',
      groups: user?.groups?.map(g => g._id || g) || [],
      permission: user?.permission || [],
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      formik.setSubmitting(true);
      const payload = { ...values };
      if (values.qualifications) {
        payload.qualifications = values.qualifications.split(',').map(q => q.trim()).filter(q => q);
      }
      // Ensure groups is an array
      if (!Array.isArray(payload.groups)) {
        payload.groups = [];
      }
      // Ensure permission is an array
      if (!Array.isArray(payload.permission)) {
        payload.permission = [];
      }
      // Remove empty department string
      if (payload.department === '') {
        delete payload.department;
      }
      mutate(payload);
    },
  });

  const handleClose = () => {
    setOpen(false);
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
        <Box sx={style}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            Edit User
          </Typography>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formik.values.firstName}
                  onChange={formik.handleChange}
                  error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                  helperText={formik.touched.firstName && formik.errors.firstName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formik.values.lastName}
                  onChange={formik.handleChange}
                  error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                  helperText={formik.touched.lastName && formik.errors.lastName}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Middle Name"
                  name="middleName"
                  value={formik.values.middleName}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomSelect
                  data={roleOptions}
                  label="Role"
                  name="role"
                  formik={formik}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomSelect
                  data={genderOptions}
                  label="Gender"
                  name="gender"
                  formik={formik}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={formik.values.dateOfBirth}
                  onChange={formik.handleChange}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <CustomSelect
                  data={departments}
                  label="Department"
                  name="department"
                  formik={formik}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <CustomSelect
                  data={nonDepartmentGroups}
                  label="User Groups"
                  name="groups"
                  formik={formik}
                  multiple
                  showSelectedCount
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, mt: 1 }}>Permissions</Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
                  {PERMISSION_CATEGORIES.map((category) => (
                    <Box key={category.label} sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        {category.label}
                      </Typography>
                      <Grid container spacing={1}>
                        {category.permissions.map((perm) => (
                          <Grid item xs={12} sm={6} md={4} key={perm.id}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={formik.values.permission.includes(perm.id)}
                                  onChange={(e) => {
                                    const newPermissions = e.target.checked
                                      ? [...formik.values.permission, perm.id]
                                      : formik.values.permission.filter((p) => p !== perm.id);
                                    formik.setFieldValue('permission', newPermissions);
                                  }}
                                />
                              }
                              label={perm.label}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Box>
              </Grid>

              {formik.values.role === 'instructor' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Employee ID"
                      name="employeeId"
                      value={formik.values.employeeId}
                      onChange={formik.handleChange}
                      error={formik.touched.employeeId && Boolean(formik.errors.employeeId)}
                      helperText={formik.touched.employeeId && formik.errors.employeeId}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Hire Date"
                      name="hireDate"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={formik.values.hireDate}
                      onChange={formik.handleChange}
                      error={formik.touched.hireDate && Boolean(formik.errors.hireDate)}
                      helperText={formik.touched.hireDate && formik.errors.hireDate}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Qualifications (comma-separated)"
                      name="qualifications"
                      value={formik.values.qualifications}
                      onChange={formik.handleChange}
                      error={formik.touched.qualifications && Boolean(formik.errors.qualifications)}
                      helperText={formik.touched.qualifications && formik.errors.qualifications}
                      placeholder="e.g., PhD in Computer Science, Master's in Education"
                    />
                  </Grid>
                </>
              )}
            </Grid>
            
            <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
              <Button variant="outlined" color="inherit" onClick={handleClose}>
                Cancel
              </Button>
              <LoadingButton loading={formik.isSubmitting} variant="contained" type="submit">
                Update User
              </LoadingButton>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}

EditUser.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired,
};

