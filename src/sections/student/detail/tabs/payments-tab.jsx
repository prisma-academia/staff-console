import PropTypes from 'prop-types';

import {
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Divider,
  useTheme,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
} from '@mui/material';

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
  const paymentHistory = student?.payments || [];

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

        <Button
          size="small"
          variant="contained"
          startIcon={<Iconify icon="mdi:download" />}
        >
          Export
        </Button>
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
    </Card>
  );
}

PaymentsTab.propTypes = {
  student: PropTypes.object,
};

