import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Breadcrumbs from '@mui/material/Breadcrumbs';

import { paymentApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

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
  return fee.dueDate ? formatDate(fee.dueDate) : '—';
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

export default function PaymentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [printingReceipt, setPrintingReceipt] = useState(false);

  const { data: payment, isLoading, error } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentApi.getPaymentById(id),
    enabled: Boolean(id),
  });

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
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', id] });
      enqueueSnackbar('Payment validated successfully', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err?.message || 'Failed to validate payment', { variant: 'error' });
    },
  });

  const handlePrintReceipt = async () => {
    if (!id) return;
    setPrintingReceipt(true);
    try {
      const blob = await paymentApi.getReceiptPdf(id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      enqueueSnackbar('Receipt opened in new tab', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err?.message || 'Failed to load receipt', { variant: 'error' });
    } finally {
      setPrintingReceipt(false);
    }
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

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link to="/payment" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
              Payments
            </Typography>
          </Link>
          <Typography color="text.primary">Payment details</Typography>
        </Breadcrumbs>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Typography variant="h4" color="text.primary" fontWeight="700">
            Payment Details
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Can do="edit_payment">
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Iconify icon="eva:edit-fill" />}
                onClick={() => navigate(`/payment/${id}/edit`)}
              >
                Edit payment
              </Button>
            </Can>
            <LoadingButton
              variant="outlined"
              startIcon={<Iconify icon="eva:printer-fill" />}
              onClick={handlePrintReceipt}
              loading={printingReceipt}
            >
              Print receipt
            </LoadingButton>
            <LoadingButton
              variant="contained"
              color="info"
              startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
              loading={isValidating}
              onClick={() => validatePayment()}
            >
              Validate payment
            </LoadingButton>
            <Button variant="outlined" startIcon={<Iconify icon="eva:arrow-back-fill" />} onClick={() => navigate('/payment')}>
              Back
            </Button>
          </Stack>
        </Stack>

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
    </Container>
  );
}
