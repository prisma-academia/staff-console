import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import config from 'src/config';
import { paymentApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { usePdfPreview } from 'src/components/pdf-viewer';

import { formatDate as formatDay } from 'src/sections/fee/fee-format';

// ----------------------------------------------------------------------

const getStatusColor = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'failed') return 'error';
  if (normalized === 'pending') return 'warning';
  if (normalized === 'completed') return 'success';
  if (normalized === 'overdue') return 'error';
  return 'default';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

const getStudent = (payment) => payment?.student;

const getStudentName = (payment) => {
  const student = getStudent(payment);
  if (!student) return 'Unknown';
  if (typeof student === 'string') return student;
  const fullName = [
    student?.personalInfo?.firstName,
    student?.personalInfo?.middleName,
    student?.personalInfo?.lastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
  return fullName || student?.email || 'Unknown';
};

const getStudentRegNumber = (payment) => {
  const student = getStudent(payment);
  if (!student || typeof student === 'string') return '—';
  return student?.regNumber ?? '—';
};

const getStudentEmail = (payment) => {
  const student = getStudent(payment);
  if (!student || typeof student === 'string') return '—';
  return student?.email ?? student?.contactInfo?.email ?? '—';
};

const getFeeName = (payment) => {
  if (!payment?.fee) return '—';
  if (typeof payment.fee === 'string') return payment.fee;
  return payment.fee?.name || '—';
};

const getFeeAmount = (payment) => {
  const fee = payment?.fee;
  if (!fee || typeof fee === 'string') return '—';
  return typeof fee.amount === 'number' ? `₦${fee.amount.toLocaleString()}` : fee.amount ?? '—';
};

const getFeeType = (payment) => {
  const fee = payment?.fee;
  if (!fee || typeof fee === 'string') return '—';
  return fee.feeType ?? '—';
};

const getFeeDueDate = (payment) => {
  const fee = payment?.fee;
  if (!fee || typeof fee === 'string') return '—';
  // Due dates are date-only; formatting with a time shows a timezone-shifted hour.
  return formatDay(fee.dueDate);
};

const getFeeDescription = (payment) => {
  const fee = payment?.fee;
  if (!fee || typeof fee === 'string') return '—';
  return fee.description ?? '—';
};

const getCreatedByName = (payment) => {
  if (!payment?.createdBy) return '—';
  if (typeof payment.createdBy === 'string') return payment.createdBy;
  const name = [payment.createdBy.firstName, payment.createdBy.lastName].filter(Boolean).join(' ');
  return name || payment.createdBy.email || '—';
};

const getCreatedByEmail = (payment) => {
  if (!payment?.createdBy || typeof payment.createdBy === 'string') return '—';
  return payment.createdBy?.email ?? '—';
};

function InfoRow({ label, value }) {
  return (
    <Grid container spacing={1} sx={{ py: 1 }}>
      <Grid item xs={12} sm={4}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={8}>
        <Typography variant="body2">{value ?? 'N/A'}</Typography>
      </Grid>
    </Grid>
  );
}

InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};

const formatNaira = (value) => (typeof value === 'number' ? `₦${value.toLocaleString()}` : '—');

/** Shown when the gateway disagrees with a completed payment; offers to adopt the gateway's status. */
function GatewayCheckPanel({ check, onApply, onRecheck, onDismiss, isRechecking }) {
  const canApply = check.found && check.suggestedStatus && check.suggestedStatus !== check.recordedStatus;

  return (
    <Alert
      severity={check.found ? 'warning' : 'error'}
      sx={{ mb: 3, '& .MuiAlert-message': { width: 1 } }}
    >
      <AlertTitle>
        {check.found ? 'The gateway disagrees with this payment' : 'The gateway could not confirm this payment'}
      </AlertTitle>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        {check.message}
      </Typography>
      {check.found && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 4 }} sx={{ mb: 2 }}>
          <Typography variant="body2">
            Recorded: <strong>{check.recordedStatus}</strong> · {formatNaira(check.recordedAmount)}
          </Typography>
          <Typography variant="body2">
            Gateway: <strong>{check.gatewayStatus || 'unknown'}</strong> · {formatNaira(check.gatewayAmount)}
          </Typography>
        </Stack>
      )}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {canApply && (
          <Can do={PERMISSIONS.ADD_PAYMENT}>
            <Button
              size="small"
              variant="contained"
              color={check.suggestedStatus === 'Completed' ? 'success' : 'error'}
              onClick={onApply}
            >
              Mark as {check.suggestedStatus}
            </Button>
          </Can>
        )}
        <Button size="small" variant="outlined" color="inherit" onClick={onDismiss}>
          Keep as {check.recordedStatus}
        </Button>
        <LoadingButton size="small" color="inherit" loading={isRechecking} onClick={onRecheck}>
          Check again
        </LoadingButton>
      </Stack>
    </Alert>
  );
}

GatewayCheckPanel.propTypes = {
  check: PropTypes.object.isRequired,
  onApply: PropTypes.func.isRequired,
  onRecheck: PropTypes.func.isRequired,
  onDismiss: PropTypes.func.isRequired,
  isRechecking: PropTypes.bool,
};

export default function PaymentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const receiptPreview = usePdfPreview();

  const { data: payment, isLoading, error } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentApi.getPaymentById(id),
    enabled: Boolean(id),
  });

  // What the gateway said on the last failed re-check of a completed payment
  const [gatewayCheck, setGatewayCheck] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const refreshPayment = () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['payment', id] });
  };

  const { mutate: validatePayment, isPending: isValidating } = useMutation({
    mutationFn: () => {
      const paymentId = payment?._id;
      const reference = payment?.reference;
      if (!paymentId && !reference) {
        throw new Error('Payment ID or reference is required');
      }
      return paymentApi.verifyPayment(paymentId, reference);
    },
    onSuccess: () => {
      setGatewayCheck(null);
      refreshPayment();
      // A completed payment is only re-checked with the gateway; its status never changes
      enqueueSnackbar(payment?.status === 'Completed' ? 'Payment confirmed by the gateway' : 'Payment validated successfully', { variant: 'success' });
    },
    onError: (err) => {
      const check = err?.data?.gatewayCheck;
      if (check) {
        // The panel below explains the mismatch and offers the actions
        setGatewayCheck({ ...check, message: err.message });
        return;
      }
      enqueueSnackbar(err?.message || 'Failed to validate payment', { variant: 'error', autoHideDuration: 10000 });
    },
  });

  const { mutate: applyGatewayStatus, isPending: isApplying } = useMutation({
    mutationFn: () => paymentApi.applyGatewayStatus(payment._id, gatewayCheck?.suggestedStatus),
    onSuccess: () => {
      enqueueSnackbar(`Payment marked ${gatewayCheck?.suggestedStatus} to match the gateway`, { variant: 'success' });
      setConfirmOpen(false);
      setGatewayCheck(null);
      refreshPayment();
    },
    onError: (err) => {
      setConfirmOpen(false);
      enqueueSnackbar(err?.message || 'Failed to update payment status', { variant: 'error', autoHideDuration: 10000 });
    },
  });

  const handlePrintReceipt = () => {
    if (!id) return;
    receiptPreview.open({
      title: `Receipt ${payment?.reference || ''}`.trim(),
      filename: `receipt-${payment?.reference || id}`,
      fetchBlob: () => paymentApi.getReceiptPdf(id),
    });
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography>Loading payment details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !payment) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Payment not found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {error?.message || 'The requested payment could not be found.'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/payment')} sx={{ mt: 2 }}>
            Back to Payments
          </Button>
        </Box>
      </Container>
    );
  }

  const payer = getStudent(payment);
  const studentId = typeof payer === 'object' ? payer?._id || payer?.id : payer;
  const isCompleted = payment.status === 'Completed';

  return (
    <Container maxWidth="xl">
      <Helmet>
        <title>Payment {payment.reference || ''} | {config.appName}</title>
      </Helmet>
      <Box sx={{ pb: 5, pt: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link to="/payment" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
              Payments
            </Typography>
          </Link>
          <Typography color="text.primary">Payment details</Typography>
        </Breadcrumbs>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Typography variant="h4" color="text.primary" fontWeight="700">
            Payment Details
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {isCompleted && (
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:printer-fill" />}
                onClick={handlePrintReceipt}
              >
                Print receipt
              </Button>
            )}
            {payment.reference && (
              <LoadingButton
                variant={isCompleted ? 'outlined' : 'contained'}
                color="info"
                startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
                loading={isValidating}
                onClick={() => validatePayment()}
              >
                {isCompleted ? 'Re-validate with gateway' : 'Validate payment'}
              </LoadingButton>
            )}
            <Button variant="outlined" startIcon={<Iconify icon="eva:arrow-back-fill" />} onClick={() => navigate('/payment')}>
              Back
            </Button>
          </Stack>
        </Stack>

        {gatewayCheck && (
          <GatewayCheckPanel
            check={gatewayCheck}
            onApply={() => setConfirmOpen(true)}
            onRecheck={() => validatePayment()}
            onDismiss={() => setGatewayCheck(null)}
            isRechecking={isValidating}
          />
        )}

        <Card sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Payment information
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <InfoRow label="Reference" value={payment.reference || '—'} />
              <InfoRow
                label="Amount"
                value={typeof payment.amount === 'number' ? `₦${payment.amount.toLocaleString()}` : payment.amount ?? '—'}
              />
              <InfoRow label="Description" value={payment.description || '—'} />
              <InfoRow label="Gateway" value={payment.gateway || '—'} />
              <InfoRow
                label="Status"
                value={
                  <Label color={getStatusColor(payment.status)}>
                    {payment.status || 'N/A'}
                  </Label>
                }
              />
              <InfoRow label="Created at" value={formatDate(payment.createdAt)} />
              <InfoRow label="Updated at" value={formatDate(payment.updatedAt)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Student
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <InfoRow
                label="Name"
                value={
                  studentId ? (
                    <Link to={`/student/${studentId}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                      {getStudentName(payment)}
                    </Link>
                  ) : (
                    getStudentName(payment)
                  )
                }
              />
              <InfoRow label="Reg. No." value={getStudentRegNumber(payment)} />
              <InfoRow label="Email" value={getStudentEmail(payment)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Fee
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <InfoRow label="Name" value={getFeeName(payment)} />
              <InfoRow label="Amount" value={getFeeAmount(payment)} />
              <InfoRow label="Fee type" value={getFeeType(payment)} />
              <InfoRow label="Due date" value={getFeeDueDate(payment)} />
              <InfoRow label="Description" value={getFeeDescription(payment)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Created by (User)
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <InfoRow label="Name" value={getCreatedByName(payment)} />
              <InfoRow label="Email" value={getCreatedByEmail(payment)} />
            </Grid>
          </Grid>
        </Card>
      </Box>
      {receiptPreview.dialog}
      <Dialog open={confirmOpen} onClose={isApplying ? undefined : () => setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Change payment status?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Payment <strong>{payment.reference}</strong> will change from <strong>{payment.status}</strong> to{' '}
            <strong>{gatewayCheck?.suggestedStatus}</strong>, matching the gateway status &quot;{gatewayCheck?.gatewayStatus}&quot;.
          </DialogContentText>
          {gatewayCheck?.suggestedStatus !== 'Completed' && (
            <DialogContentText sx={{ mt: 1.5 }}>
              The student&apos;s fee balance will no longer count this payment and its receipt will stop being valid.
              The gateway is checked again before the change is saved.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" color="inherit" disabled={isApplying} onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            color={gatewayCheck?.suggestedStatus === 'Completed' ? 'success' : 'error'}
            loading={isApplying}
            onClick={() => applyGatewayStatus()}
          >
            Confirm change
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
