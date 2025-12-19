import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Card,
  Grid,
  Stack,
  Alert,
  Button,
  Dialog,
  Divider,
  useTheme,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { UserApi } from 'src/api';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

export default function AdminActionsTab({ userId, userStatus, userEmail, onStatusChange }) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [openResetPassword, setOpenResetPassword] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const { mutate: updateStatus } = useMutation({
    mutationFn: (newStatus) => UserApi.updateUser(userId, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      enqueueSnackbar('User status updated successfully', { variant: 'success' });
      if (onStatusChange) onStatusChange();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to update status', { variant: 'error' });
    },
  });

  const { mutate: resetPasswordMutation } = useMutation({
    mutationFn: (data) => UserApi.adminResetPassword(userId, data),
    onSuccess: () => {
      setIsResetting(false);
      setOpenResetPassword(false);
      setResetPassword('');
      enqueueSnackbar('Password reset successfully. New temporary password sent.', {
        variant: 'success',
      });
    },
    onError: (error) => {
      setIsResetting(false);
      enqueueSnackbar(error.message || 'Password reset failed', { variant: 'error' });
    },
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: () => UserApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
      setOpenDelete(false);
      // Navigate back to user list
      window.location.href = '/user';
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Delete failed', { variant: 'error' });
    },
  });

  const handleStatusToggle = () => {
    const newStatus = userStatus === 'active' ? 'disable' : 'active';
    if (window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'disable'} this user?`)) {
      updateStatus(newStatus);
    }
  };

  const handleResetPassword = () => {
    if (!resetPassword || resetPassword.length < 6) {
      enqueueSnackbar('Password must be at least 6 characters', { variant: 'error' });
      return;
    }
    setIsResetting(true);
    resetPasswordMutation({ password: resetPassword });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUser();
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Admin Actions
      </Typography>

      <Grid container spacing={3}>
        {/* Reset Password */}
        <Grid item xs={12} md={6}>
          <Can do="reset_user_password">
            <Card
              sx={{
                p: 3,
                boxShadow: (thm) => thm.shadows[2],
                borderRadius: 2,
                border: `1px solid ${theme.palette.primary.main}20`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Iconify
                  icon="eva:lock-fill"
                  sx={{ fontSize: 32, color: theme.palette.primary.main }}
                />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Reset Password
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Set a new temporary password for this user
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Button
                variant="contained"
                color="primary"
                startIcon={<Iconify icon="eva:lock-fill" />}
                onClick={() => setOpenResetPassword(true)}
                fullWidth
              >
                Reset Password
              </Button>
            </Card>
          </Can>
        </Grid>

        {/* Account Status */}
        <Grid item xs={12} md={6}>
          <Can do="edit_user">
            <Card
              sx={{
                p: 3,
                boxShadow: (thm) => thm.shadows[2],
                borderRadius: 2,
                border: `1px solid ${
                  userStatus === 'active' ? theme.palette.warning.main : theme.palette.success.main
                }20`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Iconify
                  icon={userStatus === 'active' ? 'eva:slash-fill' : 'eva:checkmark-circle-2-fill'}
                  sx={{
                    fontSize: 32,
                    color:
                      userStatus === 'active' ? theme.palette.warning.main : theme.palette.success.main,
                  }}
                />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Account Status
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current status: {userStatus || 'pending'}
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Button
                variant="contained"
                color={userStatus === 'active' ? 'warning' : 'success'}
                startIcon={
                  <Iconify
                    icon={userStatus === 'active' ? 'eva:slash-fill' : 'eva:checkmark-circle-2-fill'}
                  />
                }
                onClick={handleStatusToggle}
                fullWidth
              >
                {userStatus === 'active' ? 'Disable User' : 'Activate User'}
              </Button>
            </Card>
          </Can>
        </Grid>

        {/* Danger Zone */}
        <Grid item xs={12}>
          <Can do="delete_user">
            <Card
              sx={{
                p: 3,
                boxShadow: (thm) => thm.shadows[2],
                borderRadius: 2,
                border: `2px solid ${theme.palette.error.main}40`,
                bgcolor: `${theme.palette.error.main}08`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Iconify icon="eva:alert-triangle-fill" sx={{ fontSize: 32, color: 'error.main' }} />
                <Box>
                  <Typography variant="h6" fontWeight={600} color="error">
                    Danger Zone
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Permanently delete this user account
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Alert severity="error" sx={{ mb: 2 }}>
                This action cannot be undone. All user data will be permanently deleted.
              </Alert>
              <Button
                variant="contained"
                color="error"
                startIcon={<Iconify icon="eva:trash-2-outline" />}
                onClick={() => setOpenDelete(true)}
                fullWidth
              >
                Delete User
              </Button>
            </Card>
          </Can>
        </Grid>
      </Grid>

      {/* Reset Password Dialog */}
      <Dialog open={openResetPassword} onClose={() => !isResetting && setOpenResetPassword(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Reset Password</Typography>
            <IconButton
              onClick={() => !isResetting && setOpenResetPassword(false)}
              disabled={isResetting}
            >
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set a new temporary password for <strong>{userEmail}</strong>. The user will be required to
            change this password on their next login.
          </Typography>
          <TextField
            fullWidth
            label="Temporary Password"
            type="password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            helperText="Minimum 6 characters"
            disabled={isResetting}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetPassword(false)} disabled={isResetting}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            color="primary"
            onClick={handleResetPassword}
            loading={isResetting}
          >
            Reset Password
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" color="error">
              Delete User
            </Typography>
            <IconButton onClick={() => setOpenDelete(false)}>
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Warning: This action cannot be undone
            </Typography>
            <Typography variant="body2">
              All user data, including permissions, groups, and associated records will be permanently
              deleted.
            </Typography>
          </Alert>
          <Typography variant="body2">
            Are you absolutely sure you want to delete <strong>{userEmail}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

AdminActionsTab.propTypes = {
  userId: PropTypes.string.isRequired,
  userStatus: PropTypes.string,
  userEmail: PropTypes.string,
  onStatusChange: PropTypes.func,
};

