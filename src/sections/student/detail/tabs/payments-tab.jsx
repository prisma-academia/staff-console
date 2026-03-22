import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
  Divider,
  useTheme,
  TableRow,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  TableContainer,
} from '@mui/material';

import { FeeApi, paymentApi } from 'src/api';

import Iconify from 'src/components/iconify';

const statusColors = {
  active: 'success',
  pending: 'warning',
  disable: 'error',
  Completed: 'success',
  Processing: 'warning',
  Failed: 'error',
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(amount);
};

export default function PaymentsTab({ student }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState('');

  const paymentHistory = student?.payments || [];

  const { data: fees = [] } = useQuery({
    queryKey: ['fees'],
    queryFn: FeeApi.getFees,
    enabled: createModalOpen,
  });
  const feeList = Array.isArray(fees) ? fees : (fees?.data ?? []);

  const { mutate: initializePayment, isPending: isInitializing } = useMutation({
    mutationFn: (body) => paymentApi.initializePaymentForStudent(body),
    onSuccess: (data) => {
      const url = data?.authorizationUrl;
      if (url) {
        setCreateModalOpen(false);
        setSelectedFeeId('');
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['student', student?._id] });
        window.open(url, '_blank', 'noopener,noreferrer');
        enqueueSnackbar('Payment page opened in a new tab.', { variant: 'success' });
      } else {
        enqueueSnackbar('No payment URL returned', { variant: 'error' });
      }
    },
    onError: (err) => {
      enqueueSnackbar(err?.message || 'Failed to initialize payment', { variant: 'error' });
    },
  });

  const handleCreatePayment = () => {
    if (!student?._id || !selectedFeeId) {
      enqueueSnackbar('Please select a fee', { variant: 'warning' });
      return;
    }
    initializePayment({
      studentId: student._id,
      feeId: selectedFeeId,
      gateway: 'Paystack',
    });
  };

  return (
    <Card sx={{ boxShadow: theme.shadows[2] }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 3, py: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Iconify icon="mdi:cash" color={theme.palette.primary.main} />
          <Typography variant="h6" fontWeight={600}>
            Payment History
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            startIcon={<Iconify icon="mdi:plus" />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create payment
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Iconify icon="mdi:download" />}
          >
            Export
          </Button>
        </Stack>
      </Stack>
      <Divider />

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.background.neutral }}>
              <TableCell>Description</TableCell>
              <TableCell>Fee Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="center">Date</TableCell>
              <TableCell align="center">Reference</TableCell>
              <TableCell align="center">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentHistory && paymentHistory.length > 0 ? (
              paymentHistory.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell>{payment.fee?.feeType || 'N/A'}</TableCell>
                  <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell align="center">{formatDate(payment.createdAt)}</TableCell>
                  <TableCell align="center">{payment.reference || 'N/A'}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={payment.status?.toUpperCase() || 'N/A'}
                      color={statusColors[payment.status] || 'default'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">No payment records found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={createModalOpen} onClose={() => !isInitializing && setCreateModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a fee to initialize payment. You will be redirected to the payment gateway to complete the transaction.
          </Typography>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel id="create-payment-fee-label">Fee</InputLabel>
            <Select
              labelId="create-payment-fee-label"
              label="Fee"
              value={selectedFeeId}
              onChange={(e) => setSelectedFeeId(e.target.value)}
            >
              <MenuItem value="">
                <em>Select fee</em>
              </MenuItem>
              {feeList.map((fee) => (
                <MenuItem key={fee._id} value={fee._id}>
                  {fee.name} — ₦{typeof fee.amount === 'number' ? fee.amount.toLocaleString() : fee.amount}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)} disabled={isInitializing}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleCreatePayment}
            loading={isInitializing}
            disabled={!selectedFeeId}
          >
            Continue to payment
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

PaymentsTab.propTypes = {
  student: PropTypes.object,
};

