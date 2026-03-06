import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';

import { Close } from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
  Stack,
  Dialog,
  Button,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { validateApplicationPayment } from 'src/api/adminApplicationApi';

export default function ViewModal({ open, onClose, data }) {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [displayData, setDisplayData] = useState(data);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (data) setDisplayData(data);
  }, [data]);

  if (!data) return null;

  const fullName = displayData.firstName || displayData.lastName
    ? `${displayData.firstName || ''} ${displayData.lastName || ''}`.trim()
    : 'N/A';

  const statusRaw = (displayData.status || '').toLowerCase();
  const statusByRaw = { paid: 'paid', rejected: 'rejected' };
  const status = statusByRaw[statusRaw] ?? 'not paid';
  const canValidate = status !== 'paid' && displayData.payment?.reference;

  const handleValidatePayment = async () => {
    if (!displayData._id || validating) return;
    setValidating(true);
    try {
      const result = await validateApplicationPayment(displayData._id);
      if (result.ok && result.data) {
        setDisplayData(result.data);
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        enqueueSnackbar(result.message || 'Payment validated successfully', { variant: 'success' });
      } else {
        enqueueSnackbar(result.message || 'Validation failed', { variant: 'error' });
      }
    } catch (err) {
      enqueueSnackbar(err?.message || err?.data?.message || 'Failed to validate payment', { variant: 'error' });
    } finally {
      setValidating(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Application Details
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Personal Information
          </Typography>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography variant="body2">
                    {fullName}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body2">
                    {displayData.email || 'N/A'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phone Number
                  </Typography>
                  <Typography variant="body2">
                    {displayData.phoneNumber || 'N/A'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Application Number
                  </Typography>
                  <Typography variant="body2">
                    {displayData.number || 'N/A'}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Card>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Location Information
          </Typography>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    State of Origin
                  </Typography>
                  <Typography variant="body2">
                    {displayData.stateOfOrigin || 'N/A'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    LGA of Origin
                  </Typography>
                  <Typography variant="body2">
                    {displayData.lgaOfOrigin || 'N/A'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Home Address
                  </Typography>
                  <Typography variant="body2">
                    {displayData.address || 'N/A'}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Card>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Application Information
          </Typography>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Programme
                  </Typography>
                  <Typography variant="body2">
                    {displayData.programme?.name ?? displayData.programme ?? 'N/A'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: { paid: 'success.main', rejected: 'error.main' }[status] ?? 'warning.main',
                      fontWeight: 'bold',
                    }}
                  >
                    {({ paid: 'Paid', rejected: 'Rejected' }[status] ?? 'Not Paid')}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Application Date
                  </Typography>
                  <Typography variant="body2">
                    {displayData.createdAt
                      ? new Date(displayData.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : 'N/A'
                    }
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        {canValidate ? (
          <Button
            variant="contained"
            onClick={handleValidatePayment}
            disabled={validating}
            startIcon={validating ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {validating ? 'Validating…' : 'Validate payment'}
          </Button>
        ) : (
          <Button variant="contained" onClick={onClose}>
            {status === 'paid' ? 'Print Receipt' : 'Process Payment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

ViewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object,
};
