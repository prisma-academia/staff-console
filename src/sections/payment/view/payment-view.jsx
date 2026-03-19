import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { FeeApi, paymentApi, StudentApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

import PaymentDetails from '../payment-details';

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
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterRegNumber, setFilterRegNumber] = useState('');
  const [filterFeeId, setFilterFeeId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStudentId, setCreateStudentId] = useState('');
  const [createFeeId, setCreateFeeId] = useState('');

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

  const { data: studentsData } = useQuery({
    queryKey: ['students'],
    queryFn: () => StudentApi.getStudents(),
    enabled: createModalOpen,
  });
  const studentList = Array.isArray(studentsData) ? studentsData : (studentsData?.data ?? studentsData ?? []);

  const { mutate: initializePayment, isPending: isInitializing } = useMutation({
    mutationFn: (body) => paymentApi.initializePaymentForStudent(body),
    onSuccess: (result) => {
      const url = result?.authorizationUrl;
      if (url) {
        setCreateModalOpen(false);
        setCreateStudentId('');
        setCreateFeeId('');
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        const payer = result?.payment?.student;
        if (payer) {
          const uid = typeof payer === 'object' ? payer._id : payer;
          if (uid) queryClient.invalidateQueries({ queryKey: ['student', uid] });
        }
        enqueueSnackbar('Redirecting to payment gateway...', { variant: 'info' });
        window.location.href = url;
      } else {
        enqueueSnackbar('No payment URL returned', { variant: 'error' });
      }
    },
    onError: (err) => {
      enqueueSnackbar(err?.message || 'Failed to initialize payment', { variant: 'error' });
    },
  });

  const handleCreatePayment = () => {
    if (!createStudentId || !createFeeId) {
      enqueueSnackbar('Please select a student and a fee', { variant: 'warning' });
      return;
    }
    initializePayment({ studentId: createStudentId, feeId: createFeeId });
  };

  const handleClearFilters = () => {
    setFilterRegNumber('');
    setFilterFeeId('');
    setFilterStatus('');
    setPage(0);
  };

  const getStudentLabel = (student) => {
    if (!student) return '';
    const reg = student.regNumber || '';
    const name =
      typeof student.personalInfo === 'object'
        ? [student.personalInfo?.firstName, student.personalInfo?.lastName].filter(Boolean).join(' ')
        : '';
    return name ? `${reg} — ${name}` : reg || student.email || student._id;
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
            <Tooltip title="Edit">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPayment(row);
                }}
              >
                <Iconify icon="carbon:settings-edit" />
              </IconButton>
            </Tooltip>
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
                onClick={() => setCreateModalOpen(true)}
                sx={{ px: 3 }}
              >
                Create payment
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

      <PaymentDetails
        open={Boolean(selectedPayment)}
        setOpen={(val) => !val && setSelectedPayment(null)}
        payment={selectedPayment}
      />

      <Dialog
        open={createModalOpen}
        onClose={() => !isInitializing && setCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a student and fee to initialize payment. You will be redirected to the payment gateway to complete
            the transaction.
          </Typography>
          <FormControl fullWidth size="small" sx={{ mt: 1, mb: 2 }}>
            <InputLabel id="create-payment-student-label">Student</InputLabel>
            <Select
              labelId="create-payment-student-label"
              label="Student"
              value={createStudentId}
              onChange={(e) => setCreateStudentId(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">
                <em>Select student</em>
              </MenuItem>
              {studentList.map((student) => (
                <MenuItem key={student._id} value={student._id}>
                  {getStudentLabel(student)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel id="create-payment-fee-label">Fee</InputLabel>
            <Select
              labelId="create-payment-fee-label"
              label="Fee"
              value={createFeeId}
              onChange={(e) => setCreateFeeId(e.target.value)}
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
            disabled={!createStudentId || !createFeeId}
          >
            Continue to payment
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
