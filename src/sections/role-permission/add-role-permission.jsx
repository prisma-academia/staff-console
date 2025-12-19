import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Fade,
  Grid,
  Modal,
  Stack,
  Button,
  Backdrop,
  Checkbox,
  TextField,
  Typography,
  FormHelperText,
  FormControlLabel,
} from '@mui/material';

import { RolePermissionApi } from 'src/api';

import Iconify from 'src/components/iconify';

import { PERMISSION_CATEGORIES } from '../user/permissions-config';

const AddRolePermissionModal = ({ open, setOpen }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { mutate } = useMutation({
    mutationFn: (data) => RolePermissionApi.createRolePermission(data),
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      enqueueSnackbar('Role permission created successfully', { variant: 'success' });
      setOpen(false);
      formik.resetForm();
    },
    onError: (error) => {
      const errorMessage = error.message || 'An error occurred';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      formik.setSubmitting(false);
    },
  });

  const validationSchema = Yup.object({
    role: Yup.string().required('Role name is required'),
    permissions: Yup.array()
      .of(Yup.string())
      .min(1, 'At least one permission is required')
      .required('Permissions are required'),
    isActive: Yup.boolean(),
  });

  const formik = useFormik({
    initialValues: {
      role: '',
      permissions: [],
      isActive: true,
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
    width: '100%',
    maxWidth: '700px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    maxHeight: '90vh',
    overflow: 'auto',
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        variant="contained" 
        color="primary"
        startIcon={<Iconify icon="eva:plus-fill" />}
      >
        New Role Permission
      </Button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          formik.resetForm();
        }}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={open}>
          <Box sx={modalStyle}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
              Add New Role Permission
            </Typography>
            <Box component="form" onSubmit={formik.handleSubmit}>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Role Name"
                    name="role"
                    placeholder="e.g., faculty, student, staff"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                    error={formik.touched.role && Boolean(formik.errors.role)}
                    helperText={formik.touched.role && formik.errors.role}
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
                                    checked={formik.values.permissions.includes(perm.id)}
                                    onChange={(e) => {
                                      const newPermissions = e.target.checked
                                        ? [...formik.values.permissions, perm.id]
                                        : formik.values.permissions.filter((p) => p !== perm.id);
                                      formik.setFieldValue('permissions', newPermissions);
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
                  {formik.touched.permissions && formik.errors.permissions && (
                    <FormHelperText error sx={{ mt: 1 }}>
                      {formik.errors.permissions}
                    </FormHelperText>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formik.values.isActive}
                        onChange={(e) => formik.setFieldValue('isActive', e.target.checked)}
                      />
                    }
                    label="Active"
                  />
                </Grid>
              </Grid>
              
              <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 4 }}>
                <Button 
                  variant="outlined" 
                  color="inherit" 
                  onClick={() => {
                    setOpen(false);
                    formik.resetForm();
                  }}
                >
                  Cancel
                </Button>
                <LoadingButton loading={formik.isSubmitting} variant="contained" type="submit">
                  Create Role Permission
                </LoadingButton>
              </Stack>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

AddRolePermissionModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};

export default AddRolePermissionModal;

