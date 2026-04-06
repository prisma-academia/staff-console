import * as Yup from 'yup';
import { format } from 'date-fns';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';

import { useAuthStore } from 'src/store';
import { UserApi, AuditApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

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

export default function HomeView() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const userFromStore = useAuthStore((state) => state.user);
  const fileInputRef = useRef(null);

  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [openEditProfile, setOpenEditProfile] = useState(false);

  const { data: user, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['user-profile-me'],
    queryFn: () => UserApi.getMe(),
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['audit-me', { limit: 20, skip: 0 }],
    queryFn: () => AuditApi.getMyAuditLogs({ limit: 20, skip: 0 }),
  });

  const displayUser = user || userFromStore;
  const activityLogs = Array.isArray(activityData) ? activityData : activityData?.data || [];

  const initials = displayUser
    ? `${displayUser.firstName?.[0] || ''}${displayUser.lastName?.[0] || ''}`.toUpperCase()
    : '';

  const changePasswordFormik = useFormik({
    initialValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: changePasswordSchema,
    onSubmit: (values) => {
      changePasswordMutation.mutate({
        email: displayUser?.email,
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
    },
  });

  const editProfileFormik = useFormik({
    initialValues: {
      phone: displayUser?.phone || '',
      address: displayUser?.address || '',
    },
    enableReinitialize: true,
    validationSchema: editProfileSchema,
    onSubmit: (values) => {
      updateProfileMutation.mutate({ phone: values.phone, address: values.address });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data) => UserApi.changePassword(data),
    onSuccess: () => {
      enqueueSnackbar('Password changed successfully', { variant: 'success' });
      setOpenChangePassword(false);
      changePasswordFormik.resetForm();
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to change password', { variant: 'error' });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => UserApi.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile-me'] });
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
      setOpenEditProfile(false);
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to update profile', { variant: 'error' });
    },
  });

  const uploadPictureMutation = useMutation({
    mutationFn: (file) => UserApi.uploadProfilePicture(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile-me'] });
      enqueueSnackbar('Profile picture updated', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err.message || 'Failed to upload picture', { variant: 'error' });
    },
  });

  const handlePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadPictureMutation.mutate(file);
    e.target.value = '';
  };

  const handleOpenChangePassword = () => {
    changePasswordFormik.resetForm();
    setOpenChangePassword(true);
  };

  const handleOpenEditProfile = () => {
    editProfileFormik.setValues({
      phone: displayUser?.phone || '',
      address: displayUser?.address || '',
    });
    setOpenEditProfile(true);
  };

  return (
    <Box
      sx={{
        minHeight: '100%',
        bgcolor: alpha(theme.palette.grey[500], 0.04),
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="xl">
        {/* Welcome header */}
        <Box sx={{ mb: { xs: 3, md: 4 } }}>
          {userLoading ? (
            <Skeleton variant="text" width={320} height={48} />
          ) : (
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: -0.5,
              }}
            >
              Welcome back{displayUser?.firstName ? `, ${displayUser.firstName}` : ''}
            </Typography>
          )}
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Here’s an overview of your account and recent activity
          </Typography>
        </Box>

        {/* Profile + Permissions grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Profile card – full user info */}
          <Grid item xs={12} md={5} lg={4}>
            <Card
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 2,
                boxShadow: `0 0 24px 0 ${alpha(theme.palette.grey[500], 0.08)}`,
                border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Box sx={{ position: 'relative' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePictureChange}
                    style={{ display: 'none' }}
                  />
                  {userLoading ? (
                    <Skeleton variant="circular" width={80} height={80} />
                  ) : (
                    <>
                      <Avatar
                        src={displayUser?.picture}
                        sx={{
                          width: 80,
                          height: 80,
                          bgcolor: theme.palette.primary.main,
                          fontWeight: 600,
                          fontSize: '1.5rem',
                        }}
                      >
                        {initials || 'U'}
                      </Avatar>
                      <IconButton
                        size="small"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadPictureMutation.isPending}
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          bgcolor: 'background.paper',
                          boxShadow: 1,
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <Iconify icon="eva:camera-fill" width={18} />
                      </IconButton>
                    </>
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {userLoading && (
                    <>
                      <Skeleton variant="text" width="70%" height={28} />
                      <Skeleton variant="text" width="50%" height={20} sx={{ mt: 0.5 }} />
                    </>
                  )}
                  {userError && (
                    <Typography variant="body2" color="error">
                      {userError.message || 'Failed to load profile'}
                    </Typography>
                  )}
                  {!userLoading && displayUser && (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {displayUser.firstName} {displayUser.middleName ? `${displayUser.middleName} ` : ''}
                        {displayUser.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {displayUser.email}
                      </Typography>
                    </>
                  )}
                </Box>
              </Stack>

              {!userLoading && displayUser && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={1.5}>
                    {displayUser.internalEmail && (
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2" color="text.secondary">Internal email</Typography>
                        <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>{displayUser.internalEmail}</Typography>
                      </Stack>
                    )}
                    {displayUser.phone != null && displayUser.phone !== '' && (
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                        <Typography variant="body2">{displayUser.phone}</Typography>
                      </Stack>
                    )}
                    {displayUser.address != null && displayUser.address !== '' && (
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                        <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                        <Typography variant="body2" sx={{ maxWidth: '60%', textAlign: 'right' }}>{displayUser.address}</Typography>
                      </Stack>
                    )}
                    {displayUser.dateOfBirth && (
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2" color="text.secondary">Date of birth</Typography>
                        <Typography variant="body2">{format(new Date(displayUser.dateOfBirth), 'PP')}</Typography>
                      </Stack>
                    )}
                    {displayUser.gender && (
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                        <Typography variant="body2">{displayUser.gender}</Typography>
                      </Stack>
                    )}
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                      <Chip label={displayUser.role} size="small" color="primary" sx={{ fontWeight: 600, textTransform: 'capitalize' }} />
                    </Stack>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Label color={displayUser.status === 'active' ? 'success' : 'default'}>{displayUser.status}</Label>
                    </Stack>
                    {displayUser.department && (
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                        <Typography variant="body2">{typeof displayUser.department === 'object' ? displayUser.department.name : '—'}</Typography>
                      </Stack>
                    )}
                    {displayUser.groups?.length > 0 && (
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2" color="text.secondary">Groups</Typography>
                        <Typography variant="body2">
                          {displayUser.groups.map((g) => (typeof g === 'object' ? g.name : g)).join(', ')}
                        </Typography>
                      </Stack>
                    )}
                    {displayUser.lastLogin && (
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle2" color="text.secondary">Last login</Typography>
                        <Typography variant="caption" color="text.secondary">{format(new Date(displayUser.lastLogin), 'PPp')}</Typography>
                      </Stack>
                    )}
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    <Button size="small" variant="outlined" startIcon={<Iconify icon="eva:lock-fill" />} onClick={handleOpenChangePassword}>
                      Change password
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<Iconify icon="eva:edit-fill" />} onClick={handleOpenEditProfile}>
                      Edit profile
                    </Button>
                  </Stack>
                </>
              )}
            </Card>
          </Grid>

          {/* Permissions card */}
          <Grid item xs={12} md={7} lg={8}>
            <Card
              sx={{
                p: 3,
                height: '100%',
                borderRadius: 2,
                boxShadow: `0 0 24px 0 ${alpha(theme.palette.grey[500], 0.08)}`,
                border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Iconify icon="eva:shield-fill" width={22} sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Permissions
                </Typography>
              </Stack>
              {userLoading && (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  <Skeleton variant="rounded" width={100} height={28} />
                  <Skeleton variant="rounded" width={120} height={28} />
                  <Skeleton variant="rounded" width={90} height={28} />
                </Stack>
              )}
              {!userLoading && displayUser && (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {displayUser.role === 'admin' ? (
                    <Chip
                      label="All permissions (admin)"
                      color="primary"
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  ) : (
                    (displayUser.permission || []).map((perm) => (
                      <Chip
                        key={perm}
                        label={perm.replace(/_/g, ' ')}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                          color: 'text.primary',
                        }}
                      />
                    ))
                  )}
                  {displayUser.role !== 'admin' &&
                    (!displayUser.permission || displayUser.permission.length === 0) && (
                      <Typography variant="body2" color="text.secondary">
                        No permissions assigned
                      </Typography>
                    )}
                </Stack>
              )}
            </Card>
          </Grid>
        </Grid>

        {/* Activity logs */}
        <Card
          sx={{
            borderRadius: 2,
            boxShadow: `0 0 24px 0 ${alpha(theme.palette.grey[500], 0.08)}`,
            border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
              bgcolor: alpha(theme.palette.grey[500], 0.04),
              borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="mdi:history" width={22} sx={{ color: 'info.main' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent activity
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Your latest actions in the system
                </Typography>
              </Box>
            </Stack>
            <Can do={PERMISSIONS.VIEW_AUDIT}>
              <Button
                size="small"
                endIcon={<Iconify icon="eva:arrow-forward-fill" width={16} />}
                onClick={() => navigate('/audit')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                View all
              </Button>
            </Can>
          </Box>

          <TableContainer>
            {activityLoading && (
              <Box sx={{ p: 3 }}>
                <Skeleton variant="rounded" height={200} />
              </Box>
            )}
            {!activityLoading && activityLogs.length === 0 && (
              <Box
                sx={{
                  py: 8,
                  px: 3,
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                <Iconify icon="mdi:clipboard-text-off-outline" width={48} sx={{ opacity: 0.5, mb: 1 }} />
                <Typography variant="body2">No recent activity</Typography>
              </Box>
            )}
            {!activityLoading && activityLogs.length > 0 && (
              <Table size="medium">
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: alpha(theme.palette.grey[500], 0.04),
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Action</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Entity</TableCell>
                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, py: 1.5 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activityLogs.map((row) => (
                    <TableRow
                      key={row._id}
                      hover
                      sx={{
                        '&:last-child td': { border: 0 },
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        },
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {row.timestamp ? format(new Date(row.timestamp), 'PPp') : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Label
                          color={
                            { create: 'success', delete: 'error' }[row.actionType] || 'info'
                          }
                        >
                          {row.actionType}
                        </Label>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.entityType || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Label color={row.status === 'success' ? 'success' : 'error'}>
                          {row.status}
                        </Label>
                      </TableCell>
                      <TableCell align="right">
                        <Can do={PERMISSIONS.VIEW_AUDIT}>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => navigate(`/audit/${row._id}`)}
                            sx={{ textTransform: 'none', fontWeight: 600, minWidth: 0 }}
                          >
                            Details
                          </Button>
                        </Can>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Card>

        {/* Change password dialog */}
        <Dialog open={openChangePassword} onClose={() => !changePasswordMutation.isPending && setOpenChangePassword(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Change password</Typography>
              <IconButton onClick={() => !changePasswordMutation.isPending && setOpenChangePassword(false)} disabled={changePasswordMutation.isPending}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </Stack>
          </DialogTitle>
          <form onSubmit={changePasswordFormik.handleSubmit}>
            <DialogContent>
              <TextField
                fullWidth
                label="Current password"
                name="oldPassword"
                type="password"
                value={changePasswordFormik.values.oldPassword}
                onChange={changePasswordFormik.handleChange}
                onBlur={changePasswordFormik.handleBlur}
                error={changePasswordFormik.touched.oldPassword && Boolean(changePasswordFormik.errors.oldPassword)}
                helperText={changePasswordFormik.touched.oldPassword && changePasswordFormik.errors.oldPassword}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="New password"
                name="newPassword"
                type="password"
                value={changePasswordFormik.values.newPassword}
                onChange={changePasswordFormik.handleChange}
                onBlur={changePasswordFormik.handleBlur}
                error={changePasswordFormik.touched.newPassword && Boolean(changePasswordFormik.errors.newPassword)}
                helperText={changePasswordFormik.touched.newPassword && changePasswordFormik.errors.newPassword}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Confirm new password"
                name="confirmPassword"
                type="password"
                value={changePasswordFormik.values.confirmPassword}
                onChange={changePasswordFormik.handleChange}
                onBlur={changePasswordFormik.handleBlur}
                error={changePasswordFormik.touched.confirmPassword && Boolean(changePasswordFormik.errors.confirmPassword)}
                helperText={changePasswordFormik.touched.confirmPassword && changePasswordFormik.errors.confirmPassword}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenChangePassword(false)} disabled={changePasswordMutation.isPending}>
                Cancel
              </Button>
              <LoadingButton type="submit" variant="contained" loading={changePasswordMutation.isPending}>
                Change password
              </LoadingButton>
            </DialogActions>
          </form>
        </Dialog>

        {/* Edit profile dialog (phone, address only) */}
        <Dialog open={openEditProfile} onClose={() => !updateProfileMutation.isPending && setOpenEditProfile(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Edit profile</Typography>
              <IconButton onClick={() => !updateProfileMutation.isPending && setOpenEditProfile(false)} disabled={updateProfileMutation.isPending}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </Stack>
          </DialogTitle>
          <form onSubmit={editProfileFormik.handleSubmit}>
            <DialogContent>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={editProfileFormik.values.phone}
                onChange={editProfileFormik.handleChange}
                onBlur={editProfileFormik.handleBlur}
                error={editProfileFormik.touched.phone && Boolean(editProfileFormik.errors.phone)}
                helperText={editProfileFormik.touched.phone && editProfileFormik.errors.phone}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Address"
                name="address"
                multiline
                rows={3}
                value={editProfileFormik.values.address}
                onChange={editProfileFormik.handleChange}
                onBlur={editProfileFormik.handleBlur}
                error={editProfileFormik.touched.address && Boolean(editProfileFormik.errors.address)}
                helperText={editProfileFormik.touched.address && editProfileFormik.errors.address}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenEditProfile(false)} disabled={updateProfileMutation.isPending}>
                Cancel
              </Button>
              <LoadingButton type="submit" variant="contained" loading={updateProfileMutation.isPending}>
                Save
              </LoadingButton>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
}

