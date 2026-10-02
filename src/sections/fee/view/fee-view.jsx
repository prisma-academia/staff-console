import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { Box } from '@mui/system';
import {
  Card,
  Stack,
  alpha,
  Button,
  Select,
  Tooltip,
  useTheme,
  MenuItem,
  Container,
  InputLabel,
  Typography,
  IconButton,
  FormControl,
} from '@mui/material';

import useServerTable from 'src/hooks/use-server-table';
import useActiveSession from 'src/hooks/use-active-session';

import { fetchAllPages } from 'src/utils/fetch-all-pages';

import { FeeApi, programApi, classLevelApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { ExportMenu } from 'src/components/export';
import { GenericTable } from 'src/components/generic-table';
import { FilterChips, describeFilters, AdvancedFilterDrawer } from 'src/components/advanced-filter';

import AddFee from '../add-fee';
import EditFee from '../edit-fee';
import FeeProgress from '../fee-progress';
import {
  formatDate,
  sessionLabel,
  feeStatusColor,
  formatCurrency,
  FEE_TYPE_OPTIONS,
  SEMESTER_OPTIONS,
  FEE_STATUS_OPTIONS,
} from '../fee-format';

const FILTER_KEYS = [
  'status',
  'feeType',
  'semester',
  'isActive',
  'programs',
  'classLevels',
  'dueFrom',
  'dueTo',
  'amountMin',
  'amountMax',
];

const EXPORT_COLUMNS = [
  { key: 'name', label: 'Fee' },
  { key: 'session', label: 'Session' },
  { key: 'feeType', label: 'Type' },
  { key: 'semester', label: 'Semester' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Amount' },
  { key: 'dueDate', label: 'Due date' },
  { key: 'students', label: 'Students' },
  { key: 'paidStudents', label: 'Paid students' },
  { key: 'expected', label: 'Expected' },
  { key: 'made', label: 'Collected' },
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'progress', label: 'Progress %' },
];

const asList = (data) => (Array.isArray(data) ? data : data?.data ?? []);

export default function FeePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { sessionId, session } = useActiveSession();
  const table = useServerTable({ filterKeys: FILTER_KEYS, defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });
  const { filters, search, setFilter, setFilters, clearFilters } = table;
  const queryParams = { ...table.queryParams, session: sessionId };
  const filterParams = { ...table.filterParams, session: sessionId };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['fees', 'page', queryParams],
    queryFn: () => FeeApi.getFeesPage(queryParams),
    placeholderData: keepPreviousData,
  });

  const { data: programs } = useQuery({ queryKey: ['programs'], queryFn: () => programApi.getPrograms() });
  const { data: classLevels } = useQuery({ queryKey: ['classLevels'], queryFn: () => classLevelApi.getClassLevels() });

  const rows = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  const allFields = [
    { key: 'status', label: 'Status', type: 'select', options: FEE_STATUS_OPTIONS },
    { key: 'feeType', label: 'Fee type', type: 'select', options: FEE_TYPE_OPTIONS },
    { key: 'semester', label: 'Semester', type: 'select', options: SEMESTER_OPTIONS },
    {
      key: 'programs',
      label: 'Programme',
      type: 'select',
      options: asList(programs).map((p) => ({ value: p._id, label: p.name })),
    },
    {
      key: 'classLevels',
      label: 'Class level',
      type: 'select',
      options: asList(classLevels).map((c) => ({ value: c._id, label: c.name })),
    },
    {
      key: 'isActive',
      label: 'Active',
      type: 'select',
      options: [
        { value: 'true', label: 'Active only' },
        { value: 'false', label: 'Inactive only' },
      ],
    },
    { key: 'dueFrom', label: 'Due from', type: 'date' },
    { key: 'dueTo', label: 'Due to', type: 'date' },
    { key: 'amountMin', label: 'Min amount', type: 'text' },
    { key: 'amountMax', label: 'Max amount', type: 'text' },
  ];

  const deleteFeeMutation = useMutation({
    mutationFn: FeeApi.deleteFee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      enqueueSnackbar('Fee deleted successfully', { variant: 'success' });
    },
    onError: (mutationError) => {
      enqueueSnackbar(mutationError.message || 'An error occurred while deleting the fee', { variant: 'error' });
    },
  });

  const hasPayments = (fee) => (fee?.payment?.paidStudents || 0) > 0;

  const handleDelete = (fee, e) => {
    e.stopPropagation();
    if (hasPayments(fee)) {
      enqueueSnackbar('Cannot delete fee with completed payments', { variant: 'error' });
      return;
    }
    if (window.confirm('Are you sure you want to delete this fee?')) {
      deleteFeeMutation.mutate(fee._id);
    }
  };

  const handleEdit = (fee, e) => {
    e.stopPropagation();
    setEditingFee(fee);
  };

  const columns = [
    {
      id: 'name',
      sortKey: 'name',
      label: 'Fee',
      renderCell: (row) => (
        <Stack sx={{ minWidth: 160 }}>
          <Typography variant="subtitle2" noWrap>
            {row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {[row.feeType, row.semester, sessionLabel(row.session)].filter(Boolean).join(' · ')}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'amount',
      sortKey: 'amount',
      label: 'Amount',
      renderCell: (row) => formatCurrency(row.amount),
    },
    {
      id: 'status',
      sortKey: 'status',
      label: 'Status',
      renderCell: (row) => (
        <Stack spacing={0.5} alignItems="flex-start">
          <Label color={feeStatusColor(row.status)}>{row.status}</Label>
          {row.isActive === false && (
            <Typography variant="caption" color="text.disabled">
              Inactive
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      id: 'dueDate',
      sortKey: 'dueDate',
      label: 'Due',
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {formatDate(row.dueDate)}
        </Typography>
      ),
    },
    {
      id: 'students',
      label: 'Students',
      align: 'right',
      renderCell: (row) => (
        <Tooltip title={`${row.payment?.paidStudents || 0} of ${row.studentCount || 0} students have paid`}>
          <Typography variant="body2" noWrap>
            {(row.payment?.paidStudents || 0).toLocaleString()} / {(row.studentCount || 0).toLocaleString()}
          </Typography>
        </Tooltip>
      ),
    },
    {
      id: 'expected',
      label: 'Expected',
      align: 'right',
      renderCell: (row) => formatCurrency(row.payment?.expected),
    },
    {
      id: 'made',
      label: 'Collected',
      align: 'right',
      renderCell: (row) => (
        <Stack alignItems="flex-end">
          <Typography variant="body2">{formatCurrency(row.payment?.made)}</Typography>
          {(row.payment?.outstanding || 0) > 0 && (
            <Typography variant="caption" color="error.main" noWrap>
              {formatCurrency(row.payment.outstanding)} due
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      id: 'progress',
      label: 'Progress',
      renderCell: (row) => <FeeProgress value={row.payment?.progress || 0} />,
    },
    {
      id: 'action',
      label: '',
      align: 'right',
      renderCell: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit fee">
            <IconButton onClick={(e) => handleEdit(row, e)} size="small">
              <Iconify icon="eva:edit-fill" />
            </IconButton>
          </Tooltip>
          <Tooltip title={hasPayments(row) ? 'Cannot delete fee with completed payments' : 'Delete fee'}>
            <span>
              <IconButton onClick={(e) => handleDelete(row, e)} size="small" disabled={hasPayments(row)} color="error">
                <Iconify icon="eva:trash-2-fill" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const filterSummary = [
    `Session: ${session ? sessionLabel(session) : 'All sessions'}`,
    ...describeFilters(allFields, filters, search).map((f) => f.text),
  ];

  const fetchExportRows = async () => {
    const fees = await fetchAllPages(FeeApi.getFeesPage, {
      ...filterParams,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder,
    });
    return {
      columns: EXPORT_COLUMNS,
      rows: fees.map((fee) => ({
        name: fee.name,
        session: sessionLabel(fee.session),
        feeType: fee.feeType,
        semester: fee.semester || '',
        status: fee.status,
        amount: fee.amount,
        dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString().slice(0, 10) : '',
        students: fee.studentCount,
        paidStudents: fee.payment?.paidStudents,
        expected: fee.payment?.expected,
        made: fee.payment?.made,
        outstanding: fee.payment?.outstanding,
        progress: fee.payment?.progress,
      })),
    };
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
              Fees Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {session ? `Fees for ${session.name || session.code}` : 'Fees across all sessions'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpen(true)}
              sx={{
                px: 3,
                flexGrow: { xs: 1, sm: 0 },
                boxShadow: theme.customShadows.primary,
                '&:hover': { boxShadow: 'none' },
              }}
            >
              Add Fee
            </Button>
            <ExportMenu
              title="Fees"
              fileBase="fees"
              count={total}
              filterSummary={filterSummary}
              fetchRows={fetchExportRows}
            />
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
          {quickSelect('status', 'Status', FEE_STATUS_OPTIONS)}
          {quickSelect('feeType', 'Fee type', FEE_TYPE_OPTIONS)}
          {quickSelect('programs', 'Programme', allFields[3].options, 200)}
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
            data={rows}
            columns={columns}
            rowIdField="_id"
            withToolbar
            withPagination
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            count={total}
            {...table.tableProps}
            minWidth={960}
            emptyRowsHeight={53}
            onRowClick={(row) => navigate(`/fee/${row._id}`)}
            toolbarProps={{
              ...table.searchProps,
              searchPlaceholder: 'Search fees...',
              toolbarTitle: 'Fees',
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

      <AddFee open={open} setOpen={setOpen} />
      <EditFee open={Boolean(editingFee)} setOpen={(value) => !value && setEditingFee(null)} fee={editingFee} />
    </Container>
  );
}
