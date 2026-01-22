import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { NavLink, useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';

import { useRouter } from 'src/routes/hooks';

import config from 'src/config';
import { UserApi } from 'src/api';
import { bgGradient } from 'src/theme/css';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ResetPasswordView() {
  const theme = useTheme();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => UserApi.changePassword(data),
    onSuccess: () => {
      enqueueSnackbar('Password changed successfully. Please login with your new password.', { variant: 'success' });
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    },
    onError: (error) => {
      const message = error.message || 'Failed to change password';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const handleSubmit = () => {
    if (!email) {
      enqueueSnackbar('Email is required', { variant: 'warning' });
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      enqueueSnackbar('All fields are required', { variant: 'warning' });
      return;
    }

    if (newPassword !== confirmPassword) {
      enqueueSnackbar('New password and confirm password do not match', { variant: 'error' });
      return;
    }

    mutate({
      email,
      oldPassword,
      newPassword,
    });
  };

  return (
    <Box
      sx={{
        ...bgGradient({
          color: alpha(theme.palette.background.default, 0.7),
          imgUrl: config.assets.backgrounds.overlay,
        }),
        height: 1,
        position: 'relative',
        '&:before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0)} 100%)`,
          zIndex: 1,
        },
      }}
    >
      <Stack alignItems="center" justifyContent="center" sx={{ height: 1, position: 'relative', zIndex: 2 }}>
        <Card
          sx={{
            p: 5,
            width: 1,
            maxWidth: 420,
            borderRadius: 3,
            boxShadow: (thm) => `0 8px 32px 0 ${alpha(thm.palette.grey[900], 0.12)}`,
            backdropFilter: 'blur(8px)',
            backgroundColor: (thm) => alpha(thm.palette.background.paper, 0.9),
            border: (thm) => `solid 1px ${alpha(thm.palette.grey[500], 0.12)}`,
          }}
        >
          <Stack spacing={4}>
            <Box display="flex" justifyContent="center">
              <Logo />
            </Box>

            <Stack spacing={1}>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Change Password Required
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Your account requires a password update before proceeding.
              </Typography>
            </Stack>

            <TextField
              fullWidth
              color="primary"
              value={email}
              label="Email address"
              disabled
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:email-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              name="oldpass"
              label="Old Password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              type={showOldPassword ? 'text' : 'password'}
              placeholder="Enter your current password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:lock-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      edge="end"
                      sx={{
                        color: 'text.disabled',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      <Iconify icon={showOldPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              name="newpass"
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Enter your new password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:lock-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                      sx={{
                        color: 'text.disabled',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      <Iconify icon={showNewPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              name="confirmpass"
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your new password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:lock-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{
                        color: 'text.disabled',
                        '&:hover': {
                          color: 'primary.main',
                        },
                      }}
                    >
                      <Iconify icon={showConfirmPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <LoadingButton
              fullWidth
              size="large"
              type="submit"
              variant="contained"
              color="primary"
              loading={isPending}
              onClick={handleSubmit}
              sx={{
                height: 48,
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: (thm) => `0 8px 16px 0 ${alpha(thm.palette.primary.main, 0.24)}`,
                '&:hover': {
                  boxShadow: (thm) => `0 8px 16px 0 ${alpha(thm.palette.primary.main, 0.32)}`,
                },
              }}
            >
              Change Password
            </LoadingButton>

            <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
              <NavLink
                to="/auth/login"
                style={{
                  textDecoration: 'none',
                  color: theme.palette.primary.main,
                  fontSize: '0.875rem',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Back to Login
              </NavLink>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}