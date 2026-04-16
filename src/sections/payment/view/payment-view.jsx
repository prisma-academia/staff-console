import { useSnackbar } from 'notistack';
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

import {
  FeeApi,
  paymentApi,
  SessionApi,
  programApi,
  classLevelApi,
} from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

import PaymentExportDialog from 'src/sections/payment/payment-export-dialog';

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
  { value: 'Abandoned', label: 'Abandoned' },
];

const GATEWAY_OPTIONS = [
  { value: '', label: 'All gateways' },
  { value: 'Paystack', label: 'Paystack' },
  { value: 'Flutterwave', label: 'Flutterwave' },
  { value: 'Paypal', label: 'Paypal' },
  { value: 'Stripe', label: 'Stripe' },
];

const FEE_TYPE_OPTIONS = [
  { value: '', label: 'All fee types' },
  { value: 'Tuition', label: 'Tuition' },
  { value: 'Hostel', label: 'Hostel' },
  { value: 'Laboratory', label: 'Laboratory' },
  { value: 'Others', label: 'Others' },
];

const FEE_STATUS_OPTIONS = [
  { value: '', label: 'All fee statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Active', label: 'Active' },
  { value: 'Overdue', label: 'Overdue' },
];

const SEMESTER_OPTIONS = [
  { value: '', label: 'All semesters' },
  { value: 'First Semester', label: 'First Semester' },
  { value: 'Second Semester', label: 'Second Semester' },
];

const INITIAL_FILTERS = {
  search: '',
  regNumber: '',
  reference: '',
  fee: '',
  status: '',
  gateway: '',
  sessionId: '',
  feeType: '',
  semester: '',
  feeStatus: '',
  programId: '',
  classLevelId: '',
  startDate: '',
  endDate: '',
  amountMin: '',
  amountMax: '',
};

export default function PaymentPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [isExporting, setIsExporting] = useState(false);

  const queryParams = useMemo(
    () => ({
      limit: rowsPerPage,
      skip: page * rowsPerPage,
      sort: '-createdAt',
      ...(filters.search?.trim() ? { search: filters.search.trim() } : {}),
      ...(filters.regNumber?.trim() ? { regNumber: filters.regNumber.trim() } : {}),
      ...(filters.reference?.trim() ? { reference: filters.reference.trim() } : {}),
      ...(filters.fee ? { fee: filters.fee } : {}),
      ...(filters.status?.trim() ? { status: filters.status } : {}),
      ...(filters.gateway?.trim() ? { gateway: filters.gateway } : {}),
      ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
      ...(filters.feeType?.trim() ? { feeType: filters.feeType } : {}),
      ...(filters.semester?.trim() ? { semester: filters.semester } : {}),
      ...(filters.feeStatus?.trim() ? { feeStatus: filters.feeStatus } : {}),
      ...(filters.programId ? { programId: filters.programId } : {}),
      ...(filters.classLevelId ? { classLevelId: filters.classLevelId } : {}),
      ...(filters.startDate ? { startDate: filters.startDate } : {}),
      ...(filters.endDate ? { endDate: filters.endDate } : {}),
      ...(filters.amountMin !== '' ? { amountMin: filters.amountMin } : {}),
      ...(filters.amountMax !== '' ? { amountMax: filters.amountMax } : {}),
    }),
    [page, rowsPerPage, filters]
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
  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: SessionApi.getSessions,
  });
  const { data: programsData } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });
  const { data: classLevelsData } = useQuery({
    queryKey: ['classLevels'],
    queryFn: classLevelApi.getClassLevels,
  });
  const feeList = Array.isArray(feesData) ? feesData : (feesData?.data ?? []);
  const sessionList = Array.isArray(sessionsData) ? sessionsData : (sessionsData?.data ?? []);
  const programList = Array.isArray(programsData) ? programsData : (programsData?.data ?? []);
  const classLevelList = Array.isArray(classLevelsData)
    ? classLevelsData
    : (classLevelsData?.data ?? []);

  const setFilterValue = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleClearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setPage(0);
  };

  const handleExport = async () => {
    if (
      filters.startDate &&
      filters.endDate &&
      new Date(filters.startDate) > new Date(filters.endDate)
    ) {
      enqueueSnackbar('Start date cannot be after end date', { variant: 'warning' });
      return;
    }

    setIsExporting(true);
    try {
      const blob = await paymentApi.exportPayments({
        ...queryParams,
        format: exportFormat,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payments-export-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      setExportDialogOpen(false);
      enqueueSnackbar('Payment export downloaded', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.message || 'Failed to export payments', { variant: 'error' });
    } finally {
      setIsExporting(false);
    }
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
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:download-fill" />}
              sx={{ px: 3 }}
              onClick={() => setExportDialogOpen(true)}
            >
              Export
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            mb: 2,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(3, minmax(0, 1fr))',
              xl: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          <TextField
            size="small"
            label="Search"
            placeholder="Student, fee, reference"
            value={filters.search}
            onChange={(e) => {
              setFilterValue('search', e.target.value);
            }}
          />
          <TextField
            size="small"
            label="Reg. number"
            value={filters.regNumber}
            onChange={(e) => {
              setFilterValue('regNumber', e.target.value);
            }}
          />
          <TextField
            size="small"
            label="Reference"
            value={filters.reference}
            onChange={(e) => {
              setFilterValue('reference', e.target.value);
            }}
          />
          <FormControl size="small">
            <InputLabel id="payment-filter-fee-label">Fee</InputLabel>
            <Select
              labelId="payment-filter-fee-label"
              label="Fee"
              value={filters.fee}
              onChange={(e) => {
                setFilterValue('fee', e.target.value);
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
          <FormControl size="small">
            <InputLabel id="payment-filter-status-label">Status</InputLabel>
            <Select
              labelId="payment-filter-status-label"
              label="Status"
              value={filters.status}
              onChange={(e) => {
                setFilterValue('status', e.target.value);
              }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="payment-filter-gateway-label">Gateway</InputLabel>
            <Select
              labelId="payment-filter-gateway-label"
              label="Gateway"
              value={filters.gateway}
              onChange={(e) => {
                setFilterValue('gateway', e.target.value);
              }}
            >
              {GATEWAY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="payment-filter-session-label">Session</InputLabel>
            <Select
              labelId="payment-filter-session-label"
              label="Session"
              value={filters.sessionId}
              onChange={(e) => {
                setFilterValue('sessionId', e.target.value);
              }}
            >
              <MenuItem value="">All sessions</MenuItem>
              {sessionList.map((session) => (
                <MenuItem key={session._id} value={session._id}>
                  {session.name || session.code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="payment-filter-fee-type-label">Fee type</InputLabel>
            <Select
              labelId="payment-filter-fee-type-label"
              label="Fee type"
              value={filters.feeType}
              onChange={(e) => {
                setFilterValue('feeType', e.target.value);
              }}
            >
              {FEE_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="payment-filter-semester-label">Semester</InputLabel>
            <Select
              labelId="payment-filter-semester-label"
              label="Semester"
              value={filters.semester}
              onChange={(e) => {
                setFilterValue('semester', e.target.value);
              }}
            >
              {SEMESTER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="payment-filter-fee-status-label">Fee status</InputLabel>
            <Select
              labelId="payment-filter-fee-status-label"
              label="Fee status"
              value={filters.feeStatus}
              onChange={(e) => {
                setFilterValue('feeStatus', e.target.value);
              }}
            >
              {FEE_STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="payment-filter-program-label">Program</InputLabel>
            <Select
              labelId="payment-filter-program-label"
              label="Program"
              value={filters.programId}
              onChange={(e) => {
                setFilterValue('programId', e.target.value);
              }}
            >
              <MenuItem value="">All programs</MenuItem>
              {programList.map((program) => (
                <MenuItem key={program._id} value={program._id}>
                  {program.name || program.code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="payment-filter-class-level-label">Class level</InputLabel>
            <Select
              labelId="payment-filter-class-level-label"
              label="Class level"
              value={filters.classLevelId}
              onChange={(e) => {
                setFilterValue('classLevelId', e.target.value);
              }}
            >
              <MenuItem value="">All class levels</MenuItem>
              {classLevelList.map((classLevel) => (
                <MenuItem key={classLevel._id} value={classLevel._id}>
                  {classLevel.name || classLevel.code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Start date"
            type="date"
            value={filters.startDate}
            onChange={(e) => {
              setFilterValue('startDate', e.target.value);
            }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="End date"
            type="date"
            value={filters.endDate}
            onChange={(e) => {
              setFilterValue('endDate', e.target.value);
            }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="Min amount"
            type="number"
            value={filters.amountMin}
            onChange={(e) => {
              setFilterValue('amountMin', e.target.value);
            }}
          />
          <TextField
            size="small"
            label="Max amount"
            type="number"
            value={filters.amountMax}
            onChange={(e) => {
              setFilterValue('amountMax', e.target.value);
            }}
          />
          <Stack direction="row" spacing={1} sx={{ gridColumn: { xs: '1 / -1' } }}>
          <Button
            size="small"
            variant="outlined"
            onClick={handleClearFilters}
            startIcon={<Iconify icon="eva:close-fill" />}
          >
            Clear filters
          </Button>
          </Stack>
        </Box>

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
            withToolbar={false}
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
          />
        </Card>
      </Box>
      <PaymentExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        format={exportFormat}
        onFormatChange={setExportFormat}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </Container>
  );
}
