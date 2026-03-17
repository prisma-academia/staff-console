import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useNavigate } from 'react-router-dom';

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

import PaymentDetails from '../payment-details';

// ----------------------------------------------------------------------

const getStatusColor = (status) => {
  if (status === 'Failed') return 'error';
  if (status === 'Pending') return 'warning';
  if (status === 'Completed') return 'success';
  if (status === 'Overdue') return 'error';
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

const getUserName = (payment) => {
  if (!payment?.user) return 'Unknown';
  if (typeof payment.user === 'string') return payment.user;
  const fullName = `${payment.user?.personalInfo?.firstName || ''} ${payment.user?.personalInfo?.lastName || ''}`.trim();
  return fullName || payment.user?.email || 'Unknown';
};

const getFeeName = (payment) => {
  if (!payment?.fee) return 'Unknown';
  if (typeof payment.fee === 'string') return payment.fee;
  return payment.fee?.name || 'Unknown';
};

const getCreatedByName = (payment) => {
  if (!payment?.createdBy) return 'N/A';
  if (typeof payment.createdBy === 'string') return payment.createdBy;
  const name = [payment.createdBy.firstName, payment.createdBy.lastName].filter(Boolean).join(' ');
  return name || payment.createdBy.email || 'N/A';
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
  const { enqueueSnackbar } = useSnackbar();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [printingReceipt, setPrintingReceipt] = useState(false);

  const { data: payment, isLoading, error, refetch } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentApi.getPaymentById(id),
    enabled: Boolean(id),
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

  const handleEditSuccess = () => {
    refetch();
    setEditModalOpen(false);
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

  const studentId = typeof payment.user === 'object' ? payment.user?._id : payment.user;

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
          <Stack direction="row" spacing={1}>
            <LoadingButton
              variant="outlined"
              startIcon={<Iconify icon="eva:printer-fill" />}
              onClick={handlePrintReceipt}
              loading={printingReceipt}
            >
              Print receipt
            </LoadingButton>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:edit-fill" />}
              onClick={() => setEditModalOpen(true)}
            >
              Edit
            </Button>
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
              <InfoRow label="Reference" value={payment.reference} />
              <InfoRow
                label="Amount"
                value={typeof payment.amount === 'number' ? `₦${payment.amount.toLocaleString()}` : payment.amount}
              />
              <InfoRow label="Description" value={payment.description} />
              <InfoRow label="Gateway" value={payment.gateway} />
              <InfoRow
                label="Status"
                value={
                  <Label color={getStatusColor(payment.status)}>
                    {payment.status || 'N/A'}
                  </Label>
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Related records
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <InfoRow
                label="Student"
                value={
                  studentId ? (
                    <Link to={`/student/${studentId}`} style={{ color: 'inherit', textDecoration: 'underline' }}>
                      {getUserName(payment)}
                    </Link>
                  ) : (
                    getUserName(payment)
                  )
                }
              />
              <InfoRow label="Fee" value={getFeeName(payment)} />
              <InfoRow label="Created by" value={getCreatedByName(payment)} />
              <InfoRow label="Created at" value={formatDate(payment.createdAt)} />
              <InfoRow label="Updated at" value={formatDate(payment.updatedAt)} />
            </Grid>
          </Grid>
        </Card>
      </Box>

      <PaymentDetails
        open={editModalOpen}
        setOpen={setEditModalOpen}
        payment={payment}
        onSuccess={handleEditSuccess}
      />
    </Container>
  );
}
