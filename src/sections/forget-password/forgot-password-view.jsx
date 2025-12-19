import { useSnackbar } from 'notistack';
import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';

import config from 'src/config';
import { UserApi } from 'src/api';
import { bgGradient } from 'src/theme/css';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ForgotPasswordView() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [email, setEmail] = useState('');
  const { data, mutate, isError, error, isPending } = useMutation({ 
    mutationFn: (credentials) => UserApi.forgotPassword(credentials) 
  });

  const handleClick = async () => {
    try {
      if (!email) {
        enqueueSnackbar('Please enter your email address', { variant: 'warning' });
        return;
      }
      mutate({ email });
    } catch (err) {
      console.error('Request failed:', err.message);
    }
  };
  
  useEffect(() => {
    if (isError && error) {
      enqueueSnackbar(error.message || 'Password reset request failed', { variant: 'error' });
      return;
    }
    if (data) {
      enqueueSnackbar('Temporary password sent to your email. Please login using it.', { 
        variant: 'success',
        autoHideDuration: 6000 
      });
    }
  }, [data, isError, error, enqueueSnackbar]);

  const renderForm = (
    <Fade in timeout={1000}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Forgot Password
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Enter your email address and we will send you instructions to reset your password
          </Typography>
        </Stack>

        <TextField 
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
          name="email" 
          label="Email address"
          placeholder="Enter your email"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:email-fill" sx={{ color: 'text.disabled' }} />
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
          Send Reset Link
        </LoadingButton>

        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
          <NavLink
            to="/auth/login"
            style={{
              textDecoration: 'none',
              color: theme.palette.primary.main,
              fontSize: '0.875rem',
              fontWeight: 600,
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Iconify icon="eva:arrow-ios-back-fill" width={16} height={16} />
              <Typography variant="body2">Back to Login</Typography>
            </Stack>
          </NavLink>
        </Stack>
      </Stack>
    </Fade>
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
    </Box>
  );
}
