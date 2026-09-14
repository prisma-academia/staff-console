import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { Box } from '@mui/system';
import { Visibility } from '@mui/icons-material';
import {
  Chip,
  Card,
  alpha,
  Stack,
  Button,
  Select,
  useTheme,
  MenuItem,
  Container,
  IconButton,
  Typography,
  InputLabel,
  FormControl,
} from '@mui/material';

import useServerTable from 'src/hooks/use-server-table';

import {
  listSessions,
  listProgrammes,
  listApplications,
  exportApplications,
} from 'src/api/adminApplicationApi';

import Iconify from 'src/components/iconify';
import { ExportMenu } from 'src/components/export';
import { GenericTable } from 'src/components/generic-table';
import { FilterChips, describeFilters, AdvancedFilterDrawer } from 'src/components/advanced-filter';

import ExportModal from '../export.modal';

const STATUS_OPTIONS = [
  { value: 'not paid', label: 'Not paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
];

const FILTER_KEYS = [
  'session',
  'programme',
  'status',
  'gender',
  'religion',
  'stateOfOrigin',
  'lgaOfOrigin',
  'stateOfResidence',
  'startDate',
  'endDate',
];

const ADVANCED_FIELDS = [
  {
    key: 'gender',
    label: 'Gender',
    type: 'select',
    options: [
      { value: 'Male', label: 'Male' },
      { value: 'Female', label: 'Female' },
    ],
  },
  {
    key: 'religion',
    label: 'Religion',
    type: 'select',
    options: [
      { value: 'Islam', label: 'Islam' },
      { value: 'Christianity', label: 'Christianity' },
    ],
  },
  { key: 'stateOfOrigin', label: 'State of origin', type: 'text' },
  { key: 'lgaOfOrigin', label: 'LGA of origin', type: 'text' },
  { key: 'stateOfResidence', label: 'State of residence', type: 'text' },
  { key: 'startDate', label: 'Applied from', type: 'date' },
  { key: 'endDate', label: 'Applied to', type: 'date' },
];

const columns = [
  {
    id: 'fullName',
    sortKey: 'lastName',
    label: 'Full Name',
    align: 'left',
    cellSx: { width: '20%' },
    renderCell: (row) =>
      [row?.firstName, row?.lastName].filter(Boolean).join(' ') || '—',
  },
  { id: 'number', sortKey: 'number', label: 'Application Number', cellSx: { width: '15%' } },
  {
    id: 'programme',
    label: 'Programme',
    cellSx: { width: '15%' },
    renderCell: (row) =>
      row?.programme?.name ?? row?.programme ?? '—',
  },
  { id: 'stateOfOrigin', sortKey: 'stateOfOrigin', label: 'State', cellSx: { width: '10%' } },
  { id: 'lgaOfOrigin', label: 'LGA', cellSx: { width: '10%' } },
  { id: 'email', sortKey: 'email', label: 'Email', cellSx: { width: '15%' } },
  {
    id: 'status',
    sortKey: 'status',
    label: 'Status',
    cellSx: { width: '10%' },
    renderCell: (row) => {
      const s = (row?.status || '').toLowerCase();
      if (s === 'paid') return <Chip label="Paid" color="success" size="small" />;
      if (s === 'rejected') return <Chip label="Rejected" color="error" size="small" />;
      return <Chip label="Not Paid" color="error" size="small" />;
    },
  },
  {
    id: 'action',
    label: 'Action',
    cellSx: { width: '5%' },
    align: 'center',
    renderCell: () => null,
  },
];

export default function ApplicationPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [openExportModal, setOpenExportModal] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const table = useServerTable({ filterKeys: FILTER_KEYS });
  const { filters, filterParams, queryParams, search, setFilter, setFilters, clearFilters } = table;

  const { data: sessionsResult } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: () => listSessions(),
  });
  const { data: programmesResult } = useQuery({
    queryKey: ['admin-programmes'],
    queryFn: () => listProgrammes(),
  });
  const sessions = sessionsResult?.data ?? (Array.isArray(sessionsResult) ? sessionsResult : []);
  const programmes = programmesResult?.data ?? (Array.isArray(programmesResult) ? programmesResult : []);

  const allFields = [
    {
      key: 'session',
      label: 'Session',
      type: 'select',
      options: (sessions || []).map((s) => ({ value: s._id || s.id, label: s.name || s._id || s.id })),
    },
    {
      key: 'programme',
      label: 'Programme',
      type: 'select',
      options: (programmes || []).map((p) => ({ value: p._id || p.id, label: p.name || p._id || p.id })),
    },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    ...ADVANCED_FIELDS,
  ];

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['applications', queryParams],
    queryFn: async () => {
      const result = await listApplications(queryParams);
      if (!result.ok) throw new Error(result.message);
      return result;
    },
    placeholderData: keepPreviousData,
  });

  const rows = data?.data?.data ?? [];
  const total = data?.data?.pagination?.total ?? 0;

  const handleRowClick = (row) => {
    navigate(`/application/${row._id}`);
  };

  const columnsWithActions = columns.map((col) => {
    if (col.id === 'action') {
      return {
        ...col,
        renderCell: (row) => (
          <IconButton
            color="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/application/${row._id}`);
            }}
          >
            <Visibility />
          </IconButton>
        ),
      };
    }
    return col;
  });

  const quickSelect = (key, label, options, minWidth = 180) => (
    <FormControl size="small" sx={{ minWidth }}>
      <InputLabel id={`filter-${key}-label`}>{label}</InputLabel>
      <Select
        labelId={`filter-${key}-label`}
        value={filters[key]}
        label={label}
        onChange={(e) => setFilter(key, e.target.value)}
      >
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
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Application Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              View and export applications; download templates and upload student results
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="eva:file-text-outline" />}
              onClick={() => setOpenExportModal(true)}
            >
              Admission import CSV
            </Button>
            <ExportMenu
              title="Applications"
              fileBase="applications"
              count={total}
              filterSummary={describeFilters(allFields, filters, search).map((f) => f.text)}
              fetchRows={() =>
                exportApplications({ ...filterParams, sortBy: queryParams.sortBy, sortOrder: queryParams.sortOrder })
              }
            />
          </Stack>
        </Box>

        <Card
          sx={{
            boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)},
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
            borderRadius: 2,
          }}
        >
          <Box sx={{ p: 2, pb: 0 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              flexWrap="wrap"
              useFlexGap
              alignItems="center"
            >
              {quickSelect('session', 'Session', allFields[0].options)}
              {quickSelect('status', 'Status', STATUS_OPTIONS, 140)}
              {quickSelect('programme', 'Programme', allFields[1].options, 200)}
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
          </Box>
          <GenericTable
            data={rows}
            columns={columnsWithActions}
            rowIdField="_id"
            withCheckbox
            withToolbar
            withPagination
            selectable
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            emptyRowsHeight={53}
            onRowClick={handleRowClick}
            count={total}
            {...table.tableProps}
            toolbarProps={{
              searchPlaceholder: 'Search name, email, phone, number or programme...',
              toolbarTitle: 'Applications',
              onFilterClick: () => setFilterOpen(true),
              filterCount: table.activeFilterCount,
              ...table.searchProps,
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

      <ExportModal open={openExportModal} onClose={() => setOpenExportModal(false)} />
    </Container>
  );
}
