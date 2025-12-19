import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { NavLink } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';

import { useRouter } from 'src/routes/hooks';

import config from 'src/config';
import { UserApi } from 'src/api';
import { useAuthStore } from 'src/store';
import { bgGradient } from 'src/theme/css';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function LoginView() {
  const theme = useTheme();
  const router = useRouter();
  const logIn = useAuthStore((state) => state.logIn);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const [changeReason, setChangeReason] = useState('');

  const { enqueueSnackbar } = useSnackbar();

  const { mutate, isPending } = useMutation({ 
    mutationFn: (credentials) => UserApi.login(credentials),
    onSuccess: (data) => {
      logIn(data);
      enqueueSnackbar('Login successful', { variant: 'success' });
      router.push('/');
    },
    onError: (error) => {
      const message = error.message || 'Login failed';
      
      if (message.includes('New password required') || 
          message.includes('pending') || 
          (error.data && error.data.mustChangePassword)) {
        setPasswordChangeRequired(true);
        setChangeReason(message);
        enqueueSnackbar(message, { variant: 'info' });
      } else {
        enqueueSnackbar(message, { variant: 'error' });
      }
    }
  });

  const handleClick = async () => {
    if (!email || !password) {
      enqueueSnackbar('Please fill in all fields', { variant: 'warning' });
      return;
    }
    
    const payload = { email, password };
    if (passwordChangeRequired) {
      if (!newPassword) {
        enqueueSnackbar('New password is required', { variant: 'warning' });
        return;
      }
      if (newPassword !== confirmNewPassword) {
        enqueueSnackbar('Passwords do not match', { variant: 'error' });
        return;
      }
      payload.newPassword = newPassword;
    }
    
    mutate(payload);
  };

  const handleCloseModal = () => {
    if (!isPending) {
      setPasswordChangeRequired(false);
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const renderForm = (
    <Fade in timeout={1000}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Welcome back
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Please sign in to continue
          </Typography>
        </Stack>

        <TextField
          fullWidth
          color="primary"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          name="email"
          label="Email address"
          placeholder="Enter your email"
          disabled={passwordChangeRequired}
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
          name="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          disabled={passwordChangeRequired}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:lock-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton 
                  onClick={() => setShowPassword(!showPassword)} 
                  edge="end"
                  disabled={passwordChangeRequired}
                  sx={{ 
                    color: 'text.disabled',
                    '&:hover': {
                      color: 'primary.main'
                    }
                  }}
                >
                  <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
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
          onClick={handleClick}
          sx={{
            height: 48,
            borderRadius: 1,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: thm=> `0 8px 16px 0 ${alpha(thm.palette.primary.main, 0.24)}`,
            '&:hover': {
              boxShadow: thm=> `0 8px 16px 0 ${alpha(thm.palette.primary.main, 0.32)}`,
            },
          }}
        >
          Sign In
        </LoadingButton>

        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
          <NavLink
            to="/auth/forgot-password"
            style={{
              textDecoration: 'none',
              color: theme.palette.primary.main,
              fontSize: '0.875rem',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Forgot password?
          </NavLink>
        </Stack>
      </Stack>
    </Fade>
  );

  const renderPasswordChangeModal = (
    <Modal
      open={passwordChangeRequired}
      onClose={handleCloseModal}
      aria-labelledby="password-change-modal"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card
        sx={{
          p: 5,
          width: 1,
          maxWidth: 420,
          borderRadius: 3,
        }}
      >
        <Stack spacing={3}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Change Password Required
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {changeReason || 'Your account requires a password update before proceeding.'}
          </Typography>

          <TextField
            fullWidth
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                    <Iconify icon={showNewPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Confirm New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />

          <Stack direction="row" spacing={2}>
            <Button fullWidth variant="outlined" onClick={handleCloseModal} disabled={isPending}>
              Cancel
            </Button>
            <LoadingButton
              fullWidth
              variant="contained"
              loading={isPending}
              onClick={handleClick}
            >
              Update & Login
            </LoadingButton>
          </Stack>
        </Stack>
      </Card>
    </Modal>
  );

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
            boxShadow: thm=> `0 8px 32px 0 ${alpha(thm.palette.grey[900], 0.12)}`,
            backdropFilter: 'blur(8px)',
            backgroundColor: thm=> alpha(thm.palette.background.paper, 0.9),
            border: thm=> `solid 1px ${alpha(thm.palette.grey[500], 0.12)}`,
          }}
        >
          <Stack spacing={4}>
            <Box display="flex" justifyContent="center">
              <Logo />
            </Box>

            <Divider sx={{ borderStyle: 'dashed', borderColor: alpha(theme.palette.grey[500], 0.12) }} />

            {renderForm}
          </Stack>
        </Card>
      </Stack>
      
      {renderPasswordChangeModal}
    </Box>
  );
}

