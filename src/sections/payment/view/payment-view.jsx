import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { alpha, useTheme } from '@mui/material/styles';

import useServerTable from 'src/hooks/use-server-table';
import useActiveSession from 'src/hooks/use-active-session';

import { PERMISSIONS } from 'src/permissions/constants';
import { FeeApi, paymentApi, programApi, classLevelApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';
import { FilterChips, describeFilters, AdvancedFilterDrawer } from 'src/components/advanced-filter';

import PaymentExportDialog from 'src/sections/payment/payment-export-dialog';
import {
  formatDate,
  sessionLabel,
  formatCurrency,
  FEE_TYPE_OPTIONS,
  SEMESTER_OPTIONS,
  FEE_STATUS_OPTIONS,
} from 'src/sections/fee/fee-format';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = ['Completed', 'Pending', 'Failed', 'Abandoned', 'Overdue'].map((value) => ({ value, label: value }));

const GATEWAY_OPTIONS = ['Paystack', 'Flutterwave', 'Paypal', 'Stripe'].map((value) => ({ value, label: value }));

const FILTER_KEYS = [
  'status',
  'fee',
  'startDate',
  'endDate',
  'regNumber',
  'reference',
  'gateway',
  'feeType',
  'semester',
  'feeStatus',
  'programId',
  'classLevelId',
  'amountMin',
  'amountMax',
];

const getStatusColor = (status) =>
  ({ completed: 'success', pending: 'warning', failed: 'error', overdue: 'error' })[String(status || '').toLowerCase()] ||
  'default';

const getStudentName = (payment) => {
  const student = payment?.student;
  if (!student || typeof student === 'string') return 'Unknown';
  const fullName = [student.personalInfo?.firstName, student.personalInfo?.middleName, student.personalInfo?.lastName]
    .filter(Boolean)
    .join(' ');
  return fullName || student.email || 'Unknown';
};

const asList = (data) => (Array.isArray(data) ? data : data?.data ?? []);

const columns = [
  {
    id: 'student',
    label: 'Student',
    renderCell: (row) => (
      <Stack sx={{ minWidth: 150 }}>
        <Typography variant="subtitle2" noWrap>
          {getStudentName(row)}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {row.student?.regNumber || '—'}
        </Typography>
      </Stack>
    ),
  },
  {
    id: 'fee',
    label: 'Fee',
    renderCell: (row) => (
      <Stack sx={{ minWidth: 140 }}>
        <Typography variant="body2" noWrap>
          {row.fee?.name || 'Unknown'}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {sessionLabel(row.session || row.fee?.session) || '—'}
        </Typography>
      </Stack>
    ),
  },
  {
    id: 'amount',
    sortKey: 'amount',
    label: 'Amount',
    align: 'right',
    renderCell: (row) => formatCurrency(row.amount),
  },
  {
    id: 'status',
    sortKey: 'status',
    label: 'Status',
    renderCell: (row) => <Label color={getStatusColor(row.status)}>{row.status || '—'}</Label>,
  },
  {
    id: 'reference',
    sortKey: 'reference',
    label: 'Reference',
    renderCell: (row) => (
      <Typography variant="body2" noWrap title={row.reference || ''} sx={{ maxWidth: 200 }}>
        {row.reference || '—'}
      </Typography>
    ),
  },
  {
    id: 'createdAt',
    sortKey: 'createdAt',
    label: 'Date',
    renderCell: (row) => (
      <Typography variant="body2" noWrap>
        {formatDate(row.createdAt)}
      </Typography>
    ),
  },
];

export default function PaymentPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [isExporting, setIsExporting] = useState(false);

  const { sessionId, session } = useActiveSession();
  const table = useServerTable({ filterKeys: FILTER_KEYS, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });
  const { filters, search, setFilter, setFilters, clearFilters } = table;
  const queryParams = { ...table.queryParams, session: sessionId };
  const filterParams = {
    ...table.filterParams,
    session: sessionId,
    sortBy: table.sortBy,
    sortOrder: table.sortOrder,
  };

  const { data: paymentsResponse, isLoading, isFetching, error } = useQuery({
    queryKey: ['payments', queryParams],
    queryFn: () => paymentApi.getPaymentsWithPagination(queryParams),
    placeholderData: keepPreviousData,
  });
  const payments = Array.isArray(paymentsResponse?.data) ? paymentsResponse.data : [];
  const total = paymentsResponse?.pagination?.total ?? 0;

  const { data: feesData } = useQuery({
    queryKey: ['fees', 'options', sessionId],
    queryFn: () => FeeApi.getFees({ session: sessionId }),
  });
  const { data: programsData } = useQuery({ queryKey: ['programs'], queryFn: () => programApi.getPrograms() });
  const { data: classLevelsData } = useQuery({ queryKey: ['classLevels'], queryFn: () => classLevelApi.getClassLevels() });

  const feeOptions = asList(feesData).map((fee) => ({ value: fee._id, label: fee.name }));

  const allFields = [
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { key: 'fee', label: 'Fee', type: 'select', options: feeOptions },
    { key: 'startDate', label: 'From', type: 'date' },
    { key: 'endDate', label: 'To', type: 'date' },
    { key: 'regNumber', label: 'Reg. number', type: 'text' },
    { key: 'reference', label: 'Reference', type: 'text' },
    { key: 'gateway', label: 'Gateway', type: 'select', options: GATEWAY_OPTIONS },
    {
      key: 'programId',
      label: 'Student programme',
      type: 'select',
      options: asList(programsData).map((p) => ({ value: p._id, label: p.name })),
    },
    {
      key: 'classLevelId',
      label: 'Student class level',
      type: 'select',
      options: asList(classLevelsData).map((c) => ({ value: c._id, label: c.name })),
    },
    { key: 'feeType', label: 'Fee type', type: 'select', options: FEE_TYPE_OPTIONS },
    { key: 'semester', label: 'Semester', type: 'select', options: SEMESTER_OPTIONS },
    { key: 'feeStatus', label: 'Fee status', type: 'select', options: FEE_STATUS_OPTIONS },
    { key: 'amountMin', label: 'Min amount', type: 'text' },
    { key: 'amountMax', label: 'Max amount', type: 'text' },
  ];

  const filterSummary = [
    `Session: ${session ? sessionLabel(session) : 'All sessions'}`,
    ...describeFilters(allFields, filters, search).map((f) => f.text),
  ];

  const handleExport = async () => {
    if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
      enqueueSnackbar('Start date cannot be after end date', { variant: 'warning' });
      return;
    }
    setIsExporting(true);
    try {
      const blob = await paymentApi.exportPayments({ ...filterParams, format: exportFormat });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payments-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setExportDialogOpen(false);
      enqueueSnackbar('Payment export downloaded', { variant: 'success' });
    } catch (exportError) {
      enqueueSnackbar(exportError?.message || 'Failed to export payments', { variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const quickSelect = (key, label, options, minWidth = 160) => (
    <FormControl size="small" sx={{ minWidth }}>
      <InputLabel>{label}</InputLabel>
      <Select value={filters[key]} label={label} onChange={(e) => setFilter(key, e.target.value)}>
        <MenuItem value="">All</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const dateField = (key, label) => (
    <TextField
      size="small"
      type="date"
      label={label}
      value={filters[key]}
      onChange={(e) => setFilter(key, e.target.value)}
      InputLabelProps={{ shrink: true }}
      sx={{ minWidth: 150 }}
    />
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: { xs: 2, md: 4 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Payments
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {session ? `Payments for ${session.name || session.code}` : 'Payments across all sessions'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Can do={PERMISSIONS.ADD_PAYMENT}>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={() => navigate('/payment/new')}
                sx={{ px: 3, flexGrow: { xs: 1, sm: 0 } }}
              >
                New payment
              </Button>
            </Can>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:download-fill" />}
              sx={{ px: 3, flexGrow: { xs: 1, sm: 0 } }}
              onClick={() => setExportDialogOpen(true)}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          {quickSelect('status', 'Status', STATUS_OPTIONS)}
          {quickSelect('fee', 'Fee', feeOptions, 220)}
          {dateField('startDate', 'From')}
          {dateField('endDate', 'To')}
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<Iconify icon="ic:round-filter-list" />}
            onClick={() => setFilterOpen(true)}
          >
            More filters
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
            columns={columns}
            rowIdField="_id"
            withToolbar
            withPagination
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            count={total}
            {...table.tableProps}
            emptyRowsHeight={53}
            onRowClick={(row) => navigate(`/payment/${row._id}`)}
            toolbarProps={{
              ...table.searchProps,
              searchPlaceholder: 'Search student, reg number, fee or reference...',
              toolbarTitle: `${total.toLocaleString()} payment${total === 1 ? '' : 's'}`,
              onFilterClick: () => setFilterOpen(true),
              filterCount: table.activeFilterCount,
            }}
          />
          <FilterChips
            fields={allFields}
            values={filters}
            search={search}
            onRemove={(key) => (key === 'search' ? clearFilters() : setFilter(key, ''))}
            onClearAll={clearFilters}
          />
        </Card>
      </Box>

      <AdvancedFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        fields={allFields}
        values={filters}
        onApply={setFilters}
      />
      <PaymentExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        format={exportFormat}
        onFormatChange={setExportFormat}
        onExport={handleExport}
        isExporting={isExporting}
        count={total}
        filterSummary={filterSummary}
      />
    </Container>
  );
}
