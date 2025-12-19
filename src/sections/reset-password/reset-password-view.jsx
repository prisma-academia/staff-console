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
import { bgGradient } from 'src/theme/css';

import Logo from 'src/components/logo';
import Iconify from 'src/components/iconify';


// ----------------------------------------------------------------------
const resetPassword = async (credentials) => {
  // Perform your login logic here, like making an API call
  const response = await fetch(`${config.baseUrl}/api/v1/user/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }

  return response.json();
};
export default function ResetPasswordView() {
  const theme = useTheme();
  const router = useRouter();
  const {enqueueSnackbar} = useSnackbar()

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState(null);
  const { data, mutate, isError, error, isPending } = useMutation({ mutationFn: resetPassword });

  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(null);

  useEffect(() => {
    const extractedToken = searchParams.get('token');
    setToken(extractedToken);
  }, [searchParams]); 

  const handleClick = async () => {
    try {
      if (!password) {
        alert('All fields are required');
        return;
      }
      mutate({ password,token });
    } catch (err) {
      console.error('Reset password failed:', err.message);
    }
  };

  
  useEffect(() => {
    if(isError){
      enqueueSnackbar({ message:JSON.parse(error.message).message, variant: 'error' })
      return
    }
    if (data&&data.ok) {
      enqueueSnackbar({message:error.message,variant:"success"})
      setTimeout(() => {
        router.push('/auth/login');    
      }, 3000);
      }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data,isError]);




  const renderForm = (
    <>
      <Stack mt={5} spacing={3}>
        <TextField
          name="password"
          label="Password"
          onChange={(e) => setPassword(e.target.value)}
          type={showPassword ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
           <TextField
          name="password"
          label="Confirm Password"
          onChange={(e) => setPassword(e.target.value)}
          type={showPassword ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ my: 3 }}>
        {/* <Link href="/auth/login" variant="subtitle2" underline="hover">
          Goto Login?
        </Link> */}
         <NavLink to="/auth/login" style={{textDecoration:"none","&hover":{
          textDecoration:"underline"
        }}}>
          Goto Login?
        </NavLink>
      </Stack>
      {isError && <p>{error.message.message}</p>}

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        color="inherit"
        loading={isPending}
        onClick={handleClick}
      >
        Change Password
      </LoadingButton>
    </>
  );

  return (
    <Box
      sx={{
        ...bgGradient({
          color: alpha(theme.palette.background.default, 0.7),
          imgUrl: config.assets.backgrounds.overlay,
        }),
        height: 1,
      }}
    >
      {/* <Logo
        sx={{
          position: 'fixed',
          top: { xs: 16, md: 24 },
          left: { xs: 16, md: 24 },
        }}
      /> */}

      <Stack alignItems="center" justifyContent="center" sx={{ height: 1 }}>
        <Card
          sx={{
            p: 5,
            width: 1,
            maxWidth: 420,
          }}
        >
      <Logo
     
      />
          <Typography variant="h4">Set up a new password</Typography>
          {renderForm}
        </Card>
      </Stack>
    </Box>
  );
}
