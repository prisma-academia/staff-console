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
  Checkbox,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
} from '@mui/material';

import { StudentApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

export default function AdminActionsTab({
  studentId,
  studentStatus,
  studentEmail,
  studentRegNumber,
  onStatusChange,
}) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [openResetPassword, setOpenResetPassword] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const [openRevertSetup, setOpenRevertSetup] = useState(false);
  const [sendEmailRevert, setSendEmailRevert] = useState(true);
  const [sendSMSRevert, setSendSMSRevert] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const { mutate: disableStudent } = useMutation({
    mutationFn: () => StudentApi.adminDisableStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      enqueueSnackbar('Student disabled successfully', { variant: 'success' });
      if (onStatusChange) onStatusChange();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to disable student', { variant: 'error' });
    },
  });

  const { mutate: enableStudent } = useMutation({
    mutationFn: () => StudentApi.adminEditStudent(studentId, { status: 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      enqueueSnackbar('Student enabled successfully', { variant: 'success' });
      if (onStatusChange) onStatusChange();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to enable student', { variant: 'error' });
    },
  });

  const { mutate: resetPasswordMutation } = useMutation({
    mutationFn: (data) => StudentApi.adminResetPassword(studentId, data),
    onSuccess: (response) => {
      setIsResetting(false);
      setTempPassword(response?.tempPassword || '');
      const messages = [];
      if (sendEmail) messages.push('Email sent to student');
      if (sendSMS) messages.push('SMS sent to student');
      const message = messages.length > 0
        ? `Password reset successfully. ${messages.join('. ')}.`
        : 'Password reset successfully.';
      enqueueSnackbar(message, { variant: 'success' });
      if (!response?.tempPassword) {
        setOpenResetPassword(false);
      }
    },
    onError: (error) => {
      setIsResetting(false);
      enqueueSnackbar(error.message || 'Password reset failed', { variant: 'error' });
    },
  });

  const handleStatusToggle = () => {
    if (studentStatus === 'active') {
      if (window.confirm('Are you sure you want to disable this student? They will not be able to log in.')) {
        disableStudent();
      }
    } else if (window.confirm('Are you sure you want to enable this student?')) {
        enableStudent();
      }
  };

  const handleResetPassword = () => {
    setIsResetting(true);
    resetPasswordMutation({
      sendEmail,
      sendSMS,
    });
  };

  const { mutate: revertToSetupMutation } = useMutation({
    mutationFn: (data) => StudentApi.adminRevertStudentToSetup(studentId, data),
    onSuccess: (response) => {
      setIsReverting(false);
      setOpenRevertSetup(false);
      setSendEmailRevert(true);
      setSendSMSRevert(false);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      enqueueSnackbar(response?.message || 'Student reverted to setup', { variant: 'success' });
      if (onStatusChange) onStatusChange();
    },
    onError: (error) => {
      setIsReverting(false);
      enqueueSnackbar(error.message || 'Failed to revert student to setup', { variant: 'error' });
    },
  });

  const handleRevertToSetup = () => {
    setIsReverting(true);
    revertToSetupMutation({
      sendEmail: sendEmailRevert,
      sendSMS: sendSMSRevert,
    });
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Admin Actions
      </Typography>

      <Grid container spacing={3}>
        {/* Reset Password */}
        <Grid item xs={12} md={6}>
          <Can do={PERMISSIONS.EDIT_STUDENT}>
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
                    Generate a new temporary password for this student
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
          <Can do={PERMISSIONS.EDIT_STUDENT}>
            <Card
              sx={{
                p: 3,
                boxShadow: (thm) => thm.shadows[2],
                borderRadius: 2,
                border: `1px solid ${
                  studentStatus === 'active' ? theme.palette.warning.main : theme.palette.success.main
                }20`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Iconify
                  icon={studentStatus === 'active' ? 'eva:slash-fill' : 'eva:checkmark-circle-2-fill'}
                  sx={{
                    fontSize: 32,
                    color:
                      studentStatus === 'active' ? theme.palette.warning.main : theme.palette.success.main,
                  }}
                />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Account Status
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current status: {studentStatus || 'pending'}
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Button
                variant="contained"
                color={studentStatus === 'active' ? 'warning' : 'success'}
                startIcon={
                  <Iconify
                    icon={studentStatus === 'active' ? 'eva:slash-fill' : 'eva:checkmark-circle-2-fill'}
                  />
                }
                onClick={handleStatusToggle}
                fullWidth
              >
                {studentStatus === 'active' ? 'Disable Student' : 'Enable Student'}
              </Button>
            </Card>
          </Can>
        </Grid>

        {/* Revert to setup */}
        <Grid item xs={12} md={6}>
          <Can do={PERMISSIONS.EDIT_STUDENT}>
            <Card
              sx={{
                p: 3,
                boxShadow: (thm) => thm.shadows[2],
                borderRadius: 2,
                border: `1px solid ${theme.palette.info.main}20`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Iconify
                  icon="eva:undo-fill"
                  sx={{ fontSize: 32, color: theme.palette.info.main }}
                />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Revert to setup
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Set status to setup and reset password to the student&apos;s registration number
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Button
                variant="outlined"
                color="info"
                startIcon={<Iconify icon="eva:undo-fill" />}
                onClick={() => setOpenRevertSetup(true)}
                fullWidth
              >
                Revert to setup
              </Button>
            </Card>
          </Can>
        </Grid>
      </Grid>

      {/* Reset Password Dialog */}
      <Dialog
        open={openResetPassword}
        onClose={() => !isResetting && setOpenResetPassword(false)}
        maxWidth="sm"
        fullWidth
      >
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
          {tempPassword ? (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Password reset successfully!
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                A new temporary password has been generated for <strong>{studentEmail}</strong>.
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: theme.palette.background.neutral,
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Temporary Password (view once):
                    </Typography>
                    <Typography variant="h6" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                      {tempPassword}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Iconify icon="eva:copy-fill" />}
                    onClick={() => {
                      navigator.clipboard.writeText(tempPassword);
                      enqueueSnackbar('Password copied to clipboard', { variant: 'success' });
                    }}
                  >
                    Copy
                  </Button>
                </Stack>
              </Box>
              <Alert severity="warning">
                Please save this password securely. The student will be required to change it on their next login.
              </Alert>
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Generate a new temporary password for <strong>{studentEmail}</strong>. The student will be
                required to change this password on their next login.
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      disabled={isResetting}
                    />
                  }
                  label="Send password via email"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sendSMS}
                      onChange={(e) => setSendSMS(e.target.checked)}
                      disabled={isResetting}
                    />
                  }
                  label="Send password via SMS"
                />
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {tempPassword ? (
            <Button
              variant="contained"
              onClick={() => {
                setOpenResetPassword(false);
                setTempPassword('');
                setSendEmail(true);
                setSendSMS(false);
              }}
            >
              Close
            </Button>
          ) : (
            <>
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
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Revert to setup dialog */}
      <Dialog
        open={openRevertSetup}
        onClose={() => !isReverting && setOpenRevertSetup(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Revert to setup</Typography>
            <IconButton onClick={() => !isReverting && setOpenRevertSetup(false)} disabled={isReverting}>
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            The student will need to sign in with their registration number as the password and complete the
            setup flow again (including choosing a new password).
          </Alert>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" component="span">
              Registration number (will be the new password):{' '}
            </Typography>
            <Typography component="span" variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
              {studentRegNumber || '—'}
            </Typography>
          </Box>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={sendEmailRevert}
                  onChange={(e) => setSendEmailRevert(e.target.checked)}
                  disabled={isReverting}
                />
              }
              label="Notify student via email"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={sendSMSRevert}
                  onChange={(e) => setSendSMSRevert(e.target.checked)}
                  disabled={isReverting}
                />
              }
              label="Notify student via SMS"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRevertSetup(false)} disabled={isReverting}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            color="info"
            onClick={handleRevertToSetup}
            loading={isReverting}
          >
            Revert to setup
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

AdminActionsTab.propTypes = {
  studentId: PropTypes.string.isRequired,
  studentStatus: PropTypes.string,
  studentEmail: PropTypes.string,
  studentRegNumber: PropTypes.string,
  onStatusChange: PropTypes.func,
};


