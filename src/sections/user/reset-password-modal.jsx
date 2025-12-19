import React from 'react';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useMutation } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Fade,
  Modal,
  Stack,
  Button,
  Backdrop,
  TextField,
  Typography,
} from '@mui/material';

import { UserApi } from 'src/api';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '100%',
  maxWidth: '400px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const ResetPasswordModal = ({ open, setOpen, userId, userEmail }) => {
  const { enqueueSnackbar } = useSnackbar();

  const { mutate } = useMutation({
    mutationFn: (data) => UserApi.adminResetPassword(userId, data),
    onSuccess: () => {
      formik.setSubmitting(false);
      enqueueSnackbar('Password reset successfully. New temporary password sent.', { variant: 'success' });
      setOpen(false);
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Reset failed', { variant: 'error' });
      formik.setSubmitting(false);
    },
  });

  const validationSchema = Yup.object({
    password: Yup.string().required('Temporary password is required').min(6, 'Min 6 characters'),
  });

  const formik = useFormik({
    initialValues: {
      password: '',
    },
    validationSchema,
    onSubmit: (values) => {
      formik.setSubmitting(true);
      mutate(values);
    },
  });

  return (
    <Modal
      open={open}
      onClose={() => !formik.isSubmitting && setOpen(false)}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
    >
      <Fade in={open}>
        <Box sx={style}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
            Reset Password
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Set a new temporary password for <strong>{userEmail}</strong>.
          </Typography>

          <Box component="form" onSubmit={formik.handleSubmit}>
            <TextField
              fullWidth
              label="Temporary Password"
              name="password"
              type="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              sx={{ mb: 3 }}
            />

            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button variant="outlined" color="inherit" onClick={() => setOpen(false)} disabled={formik.isSubmitting}>
                Cancel
              </Button>
              <LoadingButton loading={formik.isSubmitting} variant="contained" color="error" type="submit">
                Reset Password
              </LoadingButton>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

ResetPasswordModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
  userEmail: PropTypes.string.isRequired,
};

export default ResetPasswordModal;

