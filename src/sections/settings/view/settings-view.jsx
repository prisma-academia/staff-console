import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useMutation } from '@tanstack/react-query';

import { LoadingButton } from '@mui/lab';
import { Card, Grid, Stack, Button, TextField, Typography, IconButton, InputAdornment } from '@mui/material';

import config from 'src/config';
import { useAuthStore } from 'src/store';

import Iconify from 'src/components/iconify';

export default function SettingsView() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const { enqueueSnackbar } = useSnackbar();

  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePic, setImageFile] = useState(null);
  const [preview, setPreview] = useState(user.profilePic || '');

  const updateUserSettings = async (credentials) => {
    const response = await fetch(`${config.baseUrl}/api/v1/user/update`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${user.token}`,
      },
      body: credentials,
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (result.ok) {
      return result.data;
    }
    throw new Error(result.message);
  };

  const { mutate, isError, error, isLoading } = useMutation({ mutationFn: updateUserSettings });

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = () => {
    if (!firstName || !lastName || !phone || !profilePic) {
      enqueueSnackbar({ message: 'All fields are required', variant: 'error' });
      return;
    }
    const form = new FormData();
    form.append('firstName', firstName);
    form.append('lastName', lastName);
    form.append('phone', phone);
    form.append('photo', profilePic);
    mutate(form, {
      onSuccess: (data) => {
        enqueueSnackbar({ message: 'Profile Updated Successfully', variant: 'success' });
        updateUser(data);
      },
      onError: (err) => {
        enqueueSnackbar({ message: err.message, variant: 'error' });
      }
    });
  };

  const handleChangePassword = () => {
    if (!password || !confirmPassword) {
      enqueueSnackbar({ message: 'Both password fields are required', variant: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      enqueueSnackbar({ message: 'Passwords do not match', variant: 'error' });
      return;
    }
    const form = new FormData();
    form.append('password', password);
    mutate(form, {
      onSuccess: () => {
        enqueueSnackbar({ message: 'Password Changed Successfully', variant: 'success' });
        setPassword('');
        setConfirmPassword('');
      },
      onError: (err) => {
        enqueueSnackbar({ message: err.message, variant: 'error' });
      }
    });
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 5 }}>
          <Typography variant="h5" mb={3}>Account Settings</Typography>
          <Stack spacing={2}>
          <Stack direction="row-reverse" justifyContent="space-evenly" alignItems="center" spacing={1}>
              <Button size='small' variant="outlined" component="label">
                Upload Picture
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </Button>
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  style={{ width: '120px', height: '120px', marginTop: '5px' }}
                />
              )}
            </Stack>
            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              variant="outlined"
            />
            <TextField
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              variant="outlined"
            />
            <TextField
              label="Phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">+234</InputAdornment>,
              }}
              variant="outlined"
            />
          </Stack>
          {isError && <Typography color="red">{error.message}</Typography>}
          <LoadingButton
            sx={{ mt: 3 }}
            fullWidth
            type="submit"
            variant="contained"
            color="inherit"
            loading={isLoading}
            onClick={handleProfileUpdate}
          >
            Update Profile
          </LoadingButton>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 5 }}>
          <Typography variant="h5" mb={3}>Change Password</Typography>
          <Stack spacing={2}>
            <TextField
              name="password"
              label="New Password"
              value={password}
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
              name="confirmPassword"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
          {isError && <Typography color="red">{error.message}</Typography>}
          <LoadingButton
            sx={{ mt: 3 }}
            fullWidth
            type="submit"
            variant="outlined"
            color="inherit"
            loading={isLoading}
            onClick={handleChangePassword}
          >
            Change Password
          </LoadingButton>
        </Card>
      </Grid>
    </Grid>
  );
}
