import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

import {
  Box,
  Card,
  Grid,
  Stack,
  Avatar,
  Button,
  Typography,
  Container,
  CircularProgress,
  LinearProgress,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import config from 'src/config';

import { getApplicationById, getApplicationReceiptPdf, validateApplicationPayment } from 'src/api/adminApplicationApi';

// ----------------------------------------------------------------------

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [validating, setValidating] = useState(false);
  const [printingReceipt, setPrintingReceipt] = useState(false);

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ['application', id],
    queryFn: () => getApplicationById(id),
    enabled: !!id,
  });

  const application = result?.data ?? result;

  const handleValidatePayment = async () => {
    if (!id || validating) return;
    setValidating(true);
    try {
      const res = await validateApplicationPayment(id);
      if (res.ok && res.data) {
        queryClient.invalidateQueries({ queryKey: ['application', id] });
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        enqueueSnackbar(res.message || 'Payment validated successfully', { variant: 'success' });
      } else {
        enqueueSnackbar(res.message || 'Validation failed', { variant: 'error' });
      }
    } catch (err) {
      enqueueSnackbar(err?.message || err?.data?.message || 'Failed to validate payment', { variant: 'error' });
    } finally {
      setValidating(false);
    }
  };

  const handleBack = () => navigate('/application');

  const handlePrintReceipt = async () => {
    if (!id || printingReceipt) return;
    setPrintingReceipt(true);
    try {
      const { blob, filename } = await getApplicationReceiptPdf(id);
      const url = window.URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (w) w.focus();
      else {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'application-receipt.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(url);
      enqueueSnackbar('Receipt opened in new tab. Use the browser print option to print.', { variant: 'info' });
    } catch (err) {
      enqueueSnackbar(err?.message || err?.data?.message || 'Failed to load receipt', { variant: 'error' });
    } finally {
      setPrintingReceipt(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading application details...</Typography>
        </Box>
      </Container>
    );
  }

  if (isError || !application) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Application not found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {error?.message || 'The requested application could not be found. It may have been deleted or the ID is invalid.'}
          </Typography>
          <Button variant="contained" onClick={handleBack} sx={{ mt: 2 }}>
            Back to Applications
          </Button>
        </Box>
      </Container>
    );
  }

  const fullName =
    application.firstName || application.lastName
      ? `${application.firstName || ''} ${application.lastName || ''}`.trim()
      : 'N/A';

  const statusRaw = (application.status || '').toLowerCase();
  const statusByRaw = { paid: 'paid', rejected: 'rejected' };
  const status = statusByRaw[statusRaw] ?? 'not paid';
  const canValidate = status !== 'paid' && application.payment?.reference;

  const statusLabel = { paid: 'Paid', rejected: 'Rejected' }[status] ?? 'Not Paid';
  const applicationDate = application.createdAt
    ? new Date(application.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <>
      <Helmet>
        <title>Application {application.number || id} | {config.appName}</title>
      </Helmet>

      <Container maxWidth="xl">
        <Box sx={{ pb: 5, pt: 4 }}>
          <Stack direction="row" alignItems="center" sx={{ mb: 3 }}>
            <Iconify icon="eva:arrow-back-fill" sx={{ mr: 1 }} />
            <Typography
              component={Link}
              to="/application"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': { color: 'primary.main', textDecoration: 'underline' },
              }}
            >
              Applications
            </Typography>
            <Typography color="text.secondary" sx={{ mx: 1 }}>
              /
            </Typography>
            <Typography color="text.primary">Application Details</Typography>
          </Stack>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Avatar
                src={application.photo}
                alt={fullName}
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'grey.300',
                  fontSize: 28,
                  fontWeight: 600,
                }}
              >
                {!application.photo && fullName !== 'N/A' ? fullName.split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase() : null}
              </Avatar>
              <Box>
                <Typography variant="h4" color="text.primary" fontWeight="700">
                  Application Details
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  View detailed information about this application
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:arrow-back-fill" />}
                onClick={handleBack}
              >
                Back
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
              ) : status === 'paid' ? (
                <Button
                  variant="contained"
                  onClick={handlePrintReceipt}
                  disabled={printingReceipt}
                  startIcon={printingReceipt ? <CircularProgress size={16} color="inherit" /> : <Iconify icon="eva:printer-fill" />}
                >
                  {printingReceipt ? 'Loading…' : 'Print Receipt'}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleBack}>
                  Process Payment
                </Button>
              )}
            </Stack>
          </Box>

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
                    <Typography variant="body2">{fullName}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body2">{application.email || 'N/A'}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Phone Number
                    </Typography>
                    <Typography variant="body2">{application.phoneNumber || 'N/A'}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Application Number
                    </Typography>
                    <Typography variant="body2">{application.number || 'N/A'}</Typography>
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
                    <Typography variant="body2">{application.stateOfOrigin || 'N/A'}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      LGA of Origin
                    </Typography>
                    <Typography variant="body2">{application.lgaOfOrigin || 'N/A'}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Home Address
                    </Typography>
                    <Typography variant="body2">{application.address || 'N/A'}</Typography>
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
                      {application.programme?.name ?? application.programme ?? 'N/A'}
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
                      {statusLabel}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Application Date
                    </Typography>
                    <Typography variant="body2">{applicationDate}</Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Card>
          </Box>
        </Box>
      </Container>
    </>
  );
}
