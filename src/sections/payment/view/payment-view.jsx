import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Button, IconButton } from '@mui/material';

import { paymentApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import PaymentDetails from '../payment-details';

// ----------------------------------------------------------------------

const getStatusColor = (status) => {
  if (status === 'Failed') return 'error';
  if (status === 'Pending') return 'warning';
  if (status === 'Completed') return 'success';
  if (status === 'Overdue') return 'error';
  return 'default';
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

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

const columns = [
  { 
    id: 'user', 
    label: 'Full Name', 
    align: 'left', 
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Typography variant="subtitle2" noWrap>
        {getUserName(row)}
      </Typography>
    )
  },
  { 
    id: 'fee', 
    label: 'Fee',
    cellSx: { width: '15%' },
    renderCell: (row) => getFeeName(row)
  },
  { 
    id: 'amount', 
    label: 'Amount',
    cellSx: { width: '15%' },
    renderCell: (row) => (
      typeof row?.amount === 'number' ? `₦${row.amount.toLocaleString()}` : row?.amount || 'N/A'
    )
  },
  { 
    id: 'status', 
    label: 'Status',
    cellSx: { width: '10%' },
    renderCell: (row) => (
      <Label color={getStatusColor(row?.status)}>
        {row?.status || 'N/A'}
      </Label>
    )
  },
  { 
    id: 'reference', 
    label: 'Reference',
    cellSx: { width: '20%' },
    renderCell: (row) => row?.reference || 'N/A'
  },
  { 
    id: 'createdAt', 
    label: 'Date',
    cellSx: { width: '10%' },
    renderCell: (row) => formatDate(row?.createdAt || row?.updatedAt)
  },
  { id: 'action', label: 'Action', cellSx: { width: '10%' } },
];

export default function PaymentPage() {
  const theme = useTheme();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedUser] = useState('');
  const [selectedFee] = useState('');
  const [selectedRegNumber] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payments', selectedUser, selectedFee, selectedRegNumber],
    queryFn: () => paymentApi.getPayments(
      selectedUser || undefined,
      selectedFee || undefined,
      selectedRegNumber || undefined
    ),
  });

  const columnsWithActions = columns.map((column) => {
    if (column.id === 'action') {
      return {
        ...column,
        renderCell: (row) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
             <IconButton onClick={(e) => {
                e.stopPropagation();
                setSelectedPayment(row);
             }}>
              <Iconify icon="carbon:settings-edit" />
            </IconButton>
          </Stack>
        ),
      };
    }
    return column;
  });

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Payments
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage fee payments and transactions
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            {/* Add Payment Button if needed, currently not in original view */}
             <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:download-fill" />}
              sx={{ px: 3 }}
            >
              Export
            </Button>
          </Stack>
        </Box>

        <Card sx={{ 
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
        }}>
          <GenericTable
            data={data}
            columns={columnsWithActions}
            rowIdField="_id"
            withCheckbox
            withToolbar
            withPagination
            selectable
            isLoading={isLoading}
            emptyRowsHeight={53}
            onRowClick={(row) => setSelectedPayment(row)}
            toolbarProps={{
              searchPlaceholder: 'Search payments...',
              toolbarTitle: 'Payments List',
            }}
          />
        </Card>
      </Box>

      <PaymentDetails 
        open={Boolean(selectedPayment)} 
        setOpen={(val) => !val && setSelectedPayment(null)} 
        payment={selectedPayment} 
      />
    </Container>
  );
}
