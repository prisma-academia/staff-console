import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { alpha, useTheme } from '@mui/material/styles';

import { FeeApi, paymentApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

// ----------------------------------------------------------------------

const getStatusColor = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'failed') return 'error';
  if (normalized === 'pending') return 'warning';
  if (normalized === 'completed') return 'success';
  if (normalized === 'overdue') return 'error';
  return 'default';
};

// Student is always the owner of the payment (populated)
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
    id: 'student',
    label: 'Student',
    align: 'left',
    cellSx: { width: '18%' },
    renderCell: (row) => (
      <Typography variant="subtitle2" noWrap>
        {getStudentName(row)}
      </Typography>
    ),
  },
  {
    id: 'regNumber',
    label: 'Reg. No.',
    cellSx: { width: '12%' },
    renderCell: (row) => (
      <Typography variant="body2" noWrap>
        {getStudentRegNumber(row)}
      </Typography>
    ),
  },
  {
    id: 'fee',
    label: 'Fee',
    cellSx: { width: '14%' },
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
    cellSx: { width: '18%' },
    renderCell: (row) => (
      <Typography variant="body2" noWrap title={row?.reference || ''}>
        {row?.reference || '—'}
      </Typography>
    ),
  },
  {
    id: 'createdAt',
    label: 'Date',
    cellSx: { width: '11%' },
    renderCell: (row) => formatDate(row?.createdAt || row?.updatedAt)
  },
  { id: 'action', label: 'Action', cellSx: { width: '8%' } },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Failed', label: 'Failed' },
  { value: 'Overdue', label: 'Overdue' },
];

export default function PaymentPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterRegNumber, setFilterRegNumber] = useState('');
  const [filterFeeId, setFilterFeeId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const queryParams = useMemo(
    () => ({
      limit: rowsPerPage,
      skip: page * rowsPerPage,
      sort: '-createdAt',
      ...(filterRegNumber?.trim() ? { regNumber: filterRegNumber.trim() } : {}),
      ...(filterFeeId ? { fee: filterFeeId } : {}),
      ...(filterStatus?.trim() ? { status: filterStatus } : {}),
    }),
    [page, rowsPerPage, filterRegNumber, filterFeeId, filterStatus]
  );

  const { data: paymentsResponse, isLoading } = useQuery({
    queryKey: ['payments', queryParams],
    queryFn: () => paymentApi.getPaymentsWithPagination(queryParams),
  });

  const payments = Array.isArray(paymentsResponse?.data) ? paymentsResponse.data : [];
  const pagination = paymentsResponse?.pagination ?? {
    total: 0,
    limit: rowsPerPage,
    skip: page * rowsPerPage,
    pages: 0,
  };

  const { data: feesData } = useQuery({
    queryKey: ['fees'],
    queryFn: FeeApi.getFees,
  });
  const feeList = Array.isArray(feesData) ? feesData : (feesData?.data ?? []);

  const handleClearFilters = () => {
    setFilterRegNumber('');
    setFilterFeeId('');
    setFilterStatus('');
    setPage(0);
  };

  const columnsWithActions = columns.map((column) => {
    if (column.id === 'action') {
      return {
        ...column,
        renderCell: (row) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Tooltip title="View details">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/payment/${row._id}`);
                }}
              >
                <Iconify icon="eva:eye-fill" />
              </IconButton>
            </Tooltip>
            <Can do="edit_payment">
              <Tooltip title="Edit payment">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/payment/${row._id}/edit`);
                  }}
                >
                  <Iconify icon="eva:edit-fill" />
                </IconButton>
              </Tooltip>
            </Can>
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
            <Can do="add_payment">
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={() => navigate('/payment/new')}
                sx={{ px: 3 }}
              >
                New payment
              </Button>
            </Can>
            <Button variant="outlined" startIcon={<Iconify icon="eva:download-fill" />} sx={{ px: 3 }}>
              Export
            </Button>
          </Stack>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          flexWrap="wrap"
        >
          <TextField
            size="small"
            placeholder="Reg. number"
            value={filterRegNumber}
            onChange={(e) => {
              setFilterRegNumber(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 160 }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="payment-filter-fee-label">Fee</InputLabel>
            <Select
              labelId="payment-filter-fee-label"
              label="Fee"
              value={filterFeeId}
              onChange={(e) => {
                setFilterFeeId(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All fees</MenuItem>
              {feeList.map((fee) => (
                <MenuItem key={fee._id} value={fee._id}>
                  {fee.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="payment-filter-status-label">Status</InputLabel>
            <Select
              labelId="payment-filter-status-label"
              label="Status"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(0);
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            size="small"
            variant="outlined"
            onClick={handleClearFilters}
            startIcon={<Iconify icon="eva:close-fill" />}
          >
            Clear filters
          </Button>
        </Stack>

        <Card
          sx={{
            boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
            borderRadius: 2,
          }}
        >
          <GenericTable
            data={payments}
            columns={columnsWithActions}
            rowIdField="_id"
            withCheckbox
            withToolbar
            withPagination
            selectable
            isLoading={isLoading}
            emptyRowsHeight={53}
            initialRowsPerPage={10}
            manualPagination
            count={pagination.total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            onRowClick={(row) => navigate(`/payment/${row._id}`)}
            toolbarProps={{
              searchPlaceholder: 'Search payments...',
              toolbarTitle: 'Payments List',
            }}
          />
        </Card>
      </Box>
    </Container>
  );
}
