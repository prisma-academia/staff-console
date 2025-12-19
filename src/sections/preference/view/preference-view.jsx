import { useSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

import { LoadingButton } from '@mui/lab';
import {
  Card,
  Grid,
  Alert,
  Stack,
  Divider,
  Container,
  TextField,
  Typography,
  CardContent,
  CircularProgress,
} from '@mui/material';

import config from 'src/config';
import { useAuthStore } from 'src/store';

const PREFERENCE_ENDPOINT = `${config.applicationBaseUrl}${config.apiVersion}/preference/console`;

const toLocalDatetimeValue = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offsetMs);
  return localDate.toISOString().slice(0, 16);
};

const toIsoString = (localValue) => {
  if (!localValue) return '';
  const date = new Date(localValue);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
};

export default function PreferenceView() {
  const token = useAuthStore((state) => state.token);
  const { enqueueSnackbar } = useSnackbar();

  const [preferenceId, setPreferenceId] = useState('');
  const [formState, setFormState] = useState({
    acceptanceFee: '',
    price: '',
    closingDate: '',
    annoucement: '',
  });

  const fetchPreference = async () => {
    const response = await fetch(PREFERENCE_ENDPOINT, {
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage || 'Failed to fetch preference');
    }

    const result = await response.json();
    if (result.ok) {
      return result.data;
    }
    throw new Error(result.message || 'Failed to fetch preference');
  };

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['preference'],
    queryFn: fetchPreference,
    enabled: !!token,
  });

  useEffect(() => {
    if (data) {
      setPreferenceId(data._id || '');
      setFormState({
        acceptanceFee: data.acceptanceFee?.toString() || '',
        price: data.price?.toString() || '',
        closingDate: toLocalDatetimeValue(data.closingDate),
        annoucement: data.annoucement || '',
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await fetch(`${PREFERENCE_ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage || 'Failed to update preference');
      }

      const result = await response.json();
      if (result.ok) {
        return result.data;
      }
      throw new Error(result.message || 'Failed to update preference');
    },
    onSuccess: (updatedPreference) => {
      enqueueSnackbar({ message: 'Preference updated successfully', variant: 'success' });
      setFormState({
        acceptanceFee: updatedPreference.acceptanceFee?.toString() || '',
        price: updatedPreference.price?.toString() || '',
        closingDate: toLocalDatetimeValue(updatedPreference.closingDate),
        annoucement: updatedPreference.annoucement || '',
      });
      refetch();
    },
    onError: (mutError) => {
      enqueueSnackbar({ message: mutError.message, variant: 'error' });
    },
  });

  const computedMinutesLeft = useMemo(() => {
    if (!data?.minutesLeft && data?.closingDate) {
      const closing = new Date(data.closingDate);
      const diffMs = closing.getTime() - Date.now();
      return diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
    }
    return data?.minutesLeft ?? null;
  }, [data]);

  const handleInputChange = (field) => (event) => {
    const { value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!preferenceId) {
      enqueueSnackbar({ message: 'Preference ID not found', variant: 'error' });
      return;
    }

    const acceptanceFeeNumber = Number(formState.acceptanceFee);
    const priceNumber = Number(formState.price);
    const closingDateIso = toIsoString(formState.closingDate);
    const announcementTrimmed = formState.annoucement.trim();

    if (!Number.isFinite(acceptanceFeeNumber) || acceptanceFeeNumber <= 0) {
      enqueueSnackbar({ message: 'Acceptance fee must be a valid number greater than zero', variant: 'error' });
      return;
    }

    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      enqueueSnackbar({ message: 'Application price must be a valid number greater than zero', variant: 'error' });
      return;
    }

    if (!closingDateIso) {
      enqueueSnackbar({ message: 'Provide a valid closing date and time', variant: 'error' });
      return;
    }

    if (!announcementTrimmed) {
      enqueueSnackbar({ message: 'Announcement cannot be empty', variant: 'error' });
      return;
    }

    mutation.mutate({
      id: preferenceId,
      payload: {
        acceptanceFee: acceptanceFeeNumber,
        price: priceNumber,
        closingDate: closingDateIso,
        annoucement: announcementTrimmed,
      },
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography variant="h4">Preference Configuration</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage pricing, acceptance fee, and closing date for the preference application cycle.
          </Typography>
        </Stack>

        {isLoading && (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        )}

        {isError && (
          <Alert severity="error">
            {error?.message || 'Unable to load preference data.'}
          </Alert>
        )}

        {!isLoading && !isError && (
          <Stack spacing={3} component="form" noValidate onSubmit={handleSubmit}>
            <Card>
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Acceptance Fee (₦)"
                      type="number"
                      value={formState.acceptanceFee}
                      onChange={handleInputChange('acceptanceFee')}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Application Price (₦)"
                      type="number"
                      value={formState.price}
                      onChange={handleInputChange('price')}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Closing Date"
                      type="datetime-local"
                      value={formState.closingDate}
                      onChange={handleInputChange('closingDate')}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={4}
                      label="Announcement"
                      value={formState.annoucement}
                      onChange={handleInputChange('annoucement')}
                    />
                  </Grid>
                </Grid>
              </CardContent>
              <Divider />
              <Stack direction="row" justifyContent="flex-end" sx={{ p: 3 }}>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={mutation.isLoading}
                  disabled={isFetching}
                >
                  Save Changes
                </LoadingButton>
              </Stack>
            </Card>

            {data && (
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6">Current Preference Snapshot</Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Acceptance Fee: <Typography component="span" variant="subtitle2">₦{Number(data.acceptanceFee || 0).toLocaleString()}</Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Application Price: <Typography component="span" variant="subtitle2">₦{Number(data.price || 0).toLocaleString()}</Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Closing Date:{' '}
                        <Typography component="span" variant="subtitle2">
                          {data.closingDate ? new Date(data.closingDate).toLocaleString() : 'Not set'}
                        </Typography>
                      </Typography>
                      {computedMinutesLeft !== null && (
                        <Typography variant="body2" color="text.secondary">
                          Minutes Left:{' '}
                          <Typography component="span" variant="subtitle2">
                            {computedMinutesLeft.toLocaleString()}
                          </Typography>
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        Last Updated:{' '}
                        <Typography component="span" variant="subtitle2">
                          {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'Not available'}
                        </Typography>
                      </Typography>
                    </Stack>
                    <Divider />
                    <Typography variant="subtitle1">Announcement Preview</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {data.annoucement || 'No announcement provided.'}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}


