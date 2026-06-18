import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import config from 'src/config';
import { paymentApi } from 'src/api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function PaymentStatusPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const status = searchParams.get('status');
  const reference = searchParams.get('reference');

  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verified, setVerified] = useState(false);

  const isSuccess = status === 'success';
  const isFailed = status === 'failed';
  const hasParams = Boolean(status && reference);

  useEffect(() => {
    if (!reference) return undefined;

    let cancelled = false;
    setVerifying(true);
    setVerifyError('');

    paymentApi
      .verifyPayment(undefined, reference)
      .then(() => {
        if (cancelled) return;
        setVerified(true);
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['student'] });
      })
      .catch((err) => {
        if (cancelled) return;
        setVerifyError(err?.message || 'Could not verify payment');
      })
      .finally(() => {
        if (!cancelled) setVerifying(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reference, queryClient]);

  const handleBack = () => {
    navigate('/payment');
  };

  return (
    <>
      <Helmet>
        <title>Payment status | {config.appName}</title>
      </Helmet>

      <Container maxWidth="sm">
        <Stack spacing={3} sx={{ py: 5 }}>
          <Box>
            <Typography variant="h4">Payment status</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Result of the recent payment attempt.
            </Typography>
          </Box>

          <Card sx={{ p: 3 }}>
            {!hasParams && (
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Iconify icon="mdi:help-circle-outline" width={48} sx={{ color: 'text.secondary' }} />
                <Typography variant="h6">Invalid return link</Typography>
                <Typography variant="body2" color="text.secondary">
                  This page expects payment status details from the gateway.
                </Typography>
                <Button variant="contained" onClick={handleBack}>
                  Back to payments
                </Button>
              </Stack>
            )}

            {hasParams && verifying && (
              <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                  Confirming payment…
                </Typography>
              </Stack>
            )}

            {hasParams && !verifying && isSuccess && (
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Iconify icon="mdi:check-circle" width={52} sx={{ color: 'success.main' }} />
                <Typography variant="h6" color="success.main">
                  Payment successful
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {verified
                    ? 'The payment has been recorded.'
                    : 'Payment was accepted by the gateway.'}
                </Typography>
                {reference && (
                  <Typography variant="caption" color="text.secondary">
                    Reference: {reference}
                  </Typography>
                )}
                {verifyError && (
                  <Alert severity="warning" sx={{ width: '100%' }}>
                    {verifyError}
                  </Alert>
                )}
                <Button variant="contained" onClick={handleBack}>
                  Back to payments
                </Button>
              </Stack>
            )}

            {hasParams && !verifying && isFailed && (
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Iconify icon="mdi:close-circle" width={52} sx={{ color: 'error.main' }} />
                <Typography variant="h6" color="error.main">
                  Payment failed
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The payment was not completed. You can initialize a new payment from the
                  payments area.
                </Typography>
                {reference && (
                  <Typography variant="caption" color="text.secondary">
                    Reference: {reference}
                  </Typography>
                )}
                {verifyError && (
                  <Alert severity="error" sx={{ width: '100%' }}>
                    {verifyError}
                  </Alert>
                )}
                <Button variant="outlined" onClick={handleBack}>
                  Back to payments
                </Button>
              </Stack>
            )}

            {hasParams && !verifying && !isSuccess && !isFailed && (
              <Stack spacing={2} alignItems="center" textAlign="center">
                <Iconify icon="mdi:help-circle-outline" width={48} sx={{ color: 'text.secondary' }} />
                <Typography variant="h6">Unknown status</Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {status}
                </Typography>
                <Button variant="contained" onClick={handleBack}>
                  Back to payments
                </Button>
              </Stack>
            )}
          </Card>
        </Stack>
      </Container>
    </>
  );
}
