import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { RouterLink } from 'src/routes/components';

import useServerTable from 'src/hooks/use-server-table';

import { fetchAllPages } from 'src/utils/fetch-all-pages';

import { FeeApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { ExportMenu } from 'src/components/export';
import { GenericTable } from 'src/components/generic-table';
import { FilterChips, describeFilters, AdvancedFilterDrawer } from 'src/components/advanced-filter';

import { formatDate, formatCurrency } from '../fee-format';

const FILTER_KEYS = ['status', 'program', 'classLevel'];

const PAID_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'unpaid', label: 'Unpaid' },
];

const EXPORT_COLUMNS = [
  { key: 'regNumber', label: 'Reg. number' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'program', label: 'Programme' },
  { key: 'classLevel', label: 'Class level' },
  { key: 'paid', label: 'Payment status' },
  { key: 'amountDue', label: 'Amount due' },
  { key: 'amountPaid', label: 'Amount paid' },
  { key: 'reference', label: 'Reference' },
  { key: 'paidAt', label: 'Paid on' },
];

export default function FeeStudentsTab({ fee, programOptions, classLevelOptions }) {
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);

  const table = useServerTable({
    filterKeys: FILTER_KEYS,
    defaultSortBy: 'regNumber',
    defaultSortOrder: 'asc',
    defaultRowsPerPage: 25,
  });
  const { filters, filterParams, queryParams, search, setFilter, setFilters, clearFilters } = table;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['fee', fee._id, 'students', queryParams],
    queryFn: () => FeeApi.getFeeStudents(fee._id, queryParams),
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  const fields = [
    { key: 'status', label: 'Payment', type: 'select', options: PAID_OPTIONS },
    { key: 'program', label: 'Programme', type: 'select', options: programOptions },
    { key: 'classLevel', label: 'Class level', type: 'select', options: classLevelOptions },
  ];

  const columns = [
    {
      id: 'name',
      sortKey: 'personalInfo.lastName',
      label: 'Student',
      renderCell: (row) => (
        <Stack sx={{ minWidth: 160 }}>
          <Typography variant="subtitle2" noWrap>
            {row.name || '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.email}
          </Typography>
        </Stack>
      ),
    },
    { id: 'regNumber', sortKey: 'regNumber', label: 'Reg. no.', renderCell: (row) => row.regNumber || '—' },
    { id: 'program', label: 'Programme', renderCell: (row) => row.program?.name || '—' },
    { id: 'classLevel', label: 'Class', renderCell: (row) => row.classLevel?.name || '—' },
    {
      id: 'paid',
      label: 'Payment',
      renderCell: (row) => (
        <Stack spacing={0.5} alignItems="flex-start">
          <Label color={row.paid ? 'success' : 'warning'}>{row.paid ? 'Paid' : 'Unpaid'}</Label>
          {row.paymentCount > 1 && (
            <Typography variant="caption" color="error.main">
              {row.paymentCount} payments
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      id: 'amount',
      label: 'Amount paid',
      align: 'right',
      renderCell: (row) => (row.payment ? formatCurrency(row.payment.amount) : '—'),
    },
    {
      id: 'reference',
      label: 'Reference',
      renderCell: (row) =>
        row.payment ? (
          <Link component={RouterLink} href={`/payment/${row.payment._id}`} variant="body2" noWrap>
            {row.payment.reference || 'View payment'}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      id: 'paidAt',
      label: 'Paid on',
      renderCell: (row) => (row.payment ? formatDate(row.payment.paidAt) : '—'),
    },
  ];

  const fetchExportRows = async () => {
    const students = await fetchAllPages((params) => FeeApi.getFeeStudents(fee._id, params), {
      ...filterParams,
      sortBy: queryParams.sortBy,
      sortOrder: queryParams.sortOrder,
    });
    return {
      columns: EXPORT_COLUMNS,
      rows: students.map((s) => ({
        regNumber: s.regNumber,
        name: s.name,
        email: s.email,
        program: s.program?.name || '',
        classLevel: s.classLevel?.name || '',
        paid: s.paid ? 'Paid' : 'Unpaid',
        amountDue: fee.amount,
        amountPaid: s.payment?.amount || 0,
        reference: s.payment?.reference || '',
        paidAt: s.payment?.paidAt ? new Date(s.payment.paidAt).toISOString().slice(0, 10) : '',
      })),
    };
  };

  const quickSelect = (key, label, options) => (
    <FormControl size="small" sx={{ minWidth: 180 }}>
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
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        flexWrap="wrap"
        useFlexGap
        sx={{ p: 2 }}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filters.status || ''}
          onChange={(e, value) => value !== null && setFilter('status', value)}
        >
          <ToggleButton value="">All</ToggleButton>
          <ToggleButton value="paid">Paid</ToggleButton>
          <ToggleButton value="unpaid">Unpaid</ToggleButton>
        </ToggleButtonGroup>
        {programOptions.length > 1 && quickSelect('program', 'Programme', programOptions)}
        {classLevelOptions.length > 1 && quickSelect('classLevel', 'Class level', classLevelOptions)}
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<Iconify icon="ic:round-filter-list" />}
          onClick={() => setFilterOpen(true)}
        >
          More filters
        </Button>
        <Stack direction="row" sx={{ ml: { md: 'auto' } }}>
          <ExportMenu
            title={`${fee.name} — students`}
            fileBase={`${String(fee.name || 'fee').trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-students`}
            count={total}
            filterSummary={describeFilters(fields, filters, search).map((f) => f.text)}
            fetchRows={fetchExportRows}
          />
        </Stack>
      </Stack>

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
        maxHeight="max(380px, calc(100vh - 420px))"
        onRowClick={(row) => navigate(`/student/${row._id}`)}
        toolbarProps={{
          ...table.searchProps,
          searchPlaceholder: 'Search name, reg number or email...',
          toolbarTitle: `${total.toLocaleString()} student${total === 1 ? '' : 's'}`,
          onFilterClick: () => setFilterOpen(true),
          filterCount: table.activeFilterCount,
        }}
      />
      <FilterChips
        fields={fields}
        values={filters}
        search={search}
        onRemove={(key) => (key === 'search' ? clearFilters() : setFilter(key, ''))}
        onClearAll={clearFilters}
      />

      <AdvancedFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        fields={fields}
        values={filters}
        onApply={setFilters}
      />
    </>
  );
}

FeeStudentsTab.propTypes = {
  fee: PropTypes.object.isRequired,
  programOptions: PropTypes.array.isRequired,
  classLevelOptions: PropTypes.array.isRequired,
};
