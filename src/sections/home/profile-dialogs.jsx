import * as Yup from 'yup';
import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { UserApi } from 'src/api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const changePasswordSchema = Yup.object({
  oldPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string().required('New password is required').min(6, 'At least 6 characters'),
  confirmPassword: Yup.string()
    .required('Confirm new password')
    .oneOf([Yup.ref('newPassword')], 'Passwords must match'),
});

const editProfileSchema = Yup.object({
  phone: Yup.string(),
  address: Yup.string(),
});

const fieldProps = (formik, name) => ({
  name,
  value: formik.values[name],
  onChange: formik.handleChange,
  onBlur: formik.handleBlur,
  error: formik.touched[name] && Boolean(formik.errors[name]),
  helperText: formik.touched[name] && formik.errors[name],
});

function DialogHeader({ title, onClose, disabled }) {
  return (
    <DialogTitle>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">{title}</Typography>
        <IconButton onClick={onClose} disabled={disabled} aria-label="Close">
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </Stack>
    </DialogTitle>
  );
}

DialogHeader.propTypes = { title: PropTypes.string, onClose: PropTypes.func, disabled: PropTypes.bool };

// ----------------------------------------------------------------------

export function ChangePasswordDialog({ open, onClose, email }) {
  const { enqueueSnackbar } = useSnackbar();

  const mutation = useMutation({
    mutationFn: (data) => UserApi.changePassword(data),
    onSuccess: () => {
      enqueueSnackbar('Password changed successfully', { variant: 'success' });
      onClose();
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to change password', { variant: 'error' });
    },
  });

  const formik = useFormik({
    initialValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: changePasswordSchema,
    onSubmit: (values) => {
      mutation.mutate({ email, oldPassword: values.oldPassword, newPassword: values.newPassword });
    },
  });

  const { resetForm } = formik;
  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  const close = () => !mutation.isPending && onClose();

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogHeader title="Change password" onClose={close} disabled={mutation.isPending} />
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField fullWidth label="Current password" type="password" autoComplete="current-password" {...fieldProps(formik, 'oldPassword')} />
            <TextField fullWidth label="New password" type="password" autoComplete="new-password" {...fieldProps(formik, 'newPassword')} />
            <TextField fullWidth label="Confirm new password" type="password" autoComplete="new-password" {...fieldProps(formik, 'confirmPassword')} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={mutation.isPending}>
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={mutation.isPending}>
            Change password
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

ChangePasswordDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  email: PropTypes.string,
};

// ----------------------------------------------------------------------

/** Staff can only change their own phone and address; the rest is managed by admins. */
export function EditProfileDialog({ open, onClose, user }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const mutation = useMutation({
    mutationFn: (data) => UserApi.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile-me'] });
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
      onClose();
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to update profile', { variant: 'error' });
    },
  });

  const formik = useFormik({
    initialValues: { phone: '', address: '' },
    validationSchema: editProfileSchema,
    onSubmit: (values) => mutation.mutate({ phone: values.phone, address: values.address }),
  });

  const { resetForm } = formik;
  useEffect(() => {
    if (open) resetForm({ values: { phone: user?.phone || '', address: user?.address || '' } });
  }, [open, user?.phone, user?.address, resetForm]);

  const close = () => !mutation.isPending && onClose();

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogHeader title="Edit profile" onClose={close} disabled={mutation.isPending} />
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField fullWidth label="Phone" autoComplete="tel" {...fieldProps(formik, 'phone')} />
            <TextField fullWidth label="Address" multiline rows={3} autoComplete="street-address" {...fieldProps(formik, 'address')} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={mutation.isPending}>
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={mutation.isPending}>
            Save
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

EditProfileDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
};
