import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { Box } from '@mui/system';
import {
  Chip,
  Card,
  Stack,
  alpha,
  Avatar,
  Button,
  Select,
  useTheme,
  MenuItem,
  Container,
  IconButton,
  InputLabel,
  Typography,
  FormControl,
} from '@mui/material';

import useServerTable from 'src/hooks/use-server-table';

import { usePermissions } from 'src/utils/permissions';

import config from 'src/config';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';
import { ExportMenu } from 'src/components/export';
import { GenericTable } from 'src/components/generic-table';
import { FilterChips, describeFilters, AdvancedFilterDrawer } from 'src/components/advanced-filter';

import { StudentBulkActionsModal } from '../bulk-actions';
import { StudentApi, programApi, classLevelApi } from '../../../api';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'setup', label: 'Setup' },
  { value: 'disable', label: 'Disabled' },
];

const FILTER_KEYS = ['programId', 'classLevelId', 'status', 'gender', 'state', 'startDate', 'endDate'];

const ADVANCED_FIELDS = [
  {
    key: 'gender',
    label: 'Gender',
    type: 'select',
    options: [
      { value: 'Male', label: 'Male' },
      { value: 'Female', label: 'Female' },
      { value: 'Other', label: 'Other' },
    ],
  },
  { key: 'state', label: 'State', type: 'text' },
  { key: 'startDate', label: 'Enrolled from', type: 'date' },
  { key: 'endDate', label: 'Enrolled to', type: 'date' },
];

const columns = [
  {
    id: 'picture',
    label: '',
    cellSx: { width: '5%' },
    renderCell: (row) => {
      let avatarSrc;
      if (row?.picture) {
        avatarSrc = config.utils.isAbsoluteUrl(row.picture)
          ? row.picture
          : config.utils.buildImageUrl(config.upload.baseUrl || `${config.baseUrl}/uploads`, row.picture);
      }
      return (
        <Avatar
          src={avatarSrc}
          sx={{
            width: 40,
            height: 40,
            border: '2px solid #f5f5f5'
          }}
        />
      );
    }
  },
  {
    id: 'fullName',
    sortKey: 'personalInfo.lastName',
    label: 'Full Name',
    align: 'left',
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Stack>
        <Typography variant="subtitle2" noWrap>
          {row.personalInfo?.firstName} {row.personalInfo?.lastName}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {row.contactInfo?.email}
        </Typography>
      </Stack>
    ),
  },
  {
    id: 'regNumber',
    sortKey: 'regNumber',
    label: 'Reg Number',
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2" fontWeight={500}>
        {row.regNumber}
      </Typography>
    )
  },
  {
    id: 'program',
    label: 'Program',
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {row.program?.name || 'N/A'}
      </Typography>
    )
  },
  {
    id: 'classLevel',
    label: 'Class',
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {row.classLevel?.name || 'N/A'}
      </Typography>
    )
  },
  {
    id: 'status',
    sortKey: 'status',
    label: 'Status',
    cellSx: { width: '10%' },
    renderCell: (row) => {
      const status = row?.status || 'pending';
      const statusConfig = {
        active: { label: 'Active', color: 'success' },
        pending: { label: 'Pending', color: 'warning' },
        disable: { label: 'Disabled', color: 'error' },
      };
      const statusConfigValue = statusConfig[status] || { label: status, color: 'default' };
      return (
        <Chip
          label={statusConfigValue.label}
          color={statusConfigValue.color}
          size="small"
          sx={{ borderRadius: 1 }}
        />
      );
    }
  },
  { id: 'action', label: 'Action', cellSx: { width: '15%' } },
];

export default function StudentView() {
  const theme = useTheme();
  const navigate = useNavigate();

  const { check } = usePermissions();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const table = useServerTable({
    filterKeys: FILTER_KEYS,
    defaultSortBy: 'regNumber',
    defaultSortOrder: 'asc',
  });
  const { filters, filterParams, queryParams, search, setFilter, setFilters, clearFilters } = table;

  const canBulkOperate =
    check(PERMISSIONS.EDIT_STUDENT) ||
    check(PERMISSIONS.DELETE_STUDENT) ||
    check(PERMISSIONS.VIEW_STUDENT);

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: () => programApi.getPrograms(),
  });
  const { data: classLevels } = useQuery({
    queryKey: ['classLevels'],
    queryFn: () => classLevelApi.getClassLevels(),
  });

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['students', queryParams],
    queryFn: () => StudentApi.getStudentsPage(queryParams),
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  const allFields = [
    {
      key: 'programId',
      label: 'Program',
      type: 'select',
      options: (Array.isArray(programs) ? programs : []).map((p) => ({ value: p._id, label: p.name })),
    },
    {
      key: 'classLevelId',
      label: 'Class',
      type: 'select',
      options: (Array.isArray(classLevels) ? classLevels : []).map((c) => ({ value: c._id, label: c.name })),
    },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    ...ADVANCED_FIELDS,
  ];

  const handleRowClick = (row) => {
    navigate(`/student/${row._id}`);
  };

  const columnsWithActions = columns.map((column) => {
    if (column.id === 'action') {
      return {
        ...column,
        renderCell: (row) => (
          <Stack direction="row" spacing={1}>
            <IconButton
              color="primary"
              size="small"
              sx={{
                boxShadow: `0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }
              }}
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click from firing
                handleRowClick(row);
              }}
            >
              <Iconify icon="eva:eye-fill" />
            </IconButton>
          </Stack>
        ),
      };
    }
    return column;
  });

  const quickSelect = (key, label, options, minWidth = 180) => (
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
      <Box
        sx={{
          pb: 5,
          pt: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Student Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              View and manage student information
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => navigate('/student/intake')}
              sx={{
                px: 3,
                boxShadow: theme.customShadows.primary,
                '&:hover': {
                  boxShadow: 'none',
                }
              }}
            >
              Student Intake
            </Button>
            {canBulkOperate && (
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:options-2-fill" />}
                onClick={() => setBulkOpen(true)}
                sx={{ px: 3 }}
              >
                Bulk Operations
              </Button>
            )}
            <ExportMenu
              title="Students"
              fileBase="students"
              count={total}
              filterSummary={describeFilters(allFields, filters, search).map((f) => f.text)}
              fetchRows={() =>
                StudentApi.exportStudentsByFilter({
                  ...filterParams,
                  sortBy: queryParams.sortBy,
                  sortOrder: queryParams.sortOrder,
                })
              }
            />
          </Stack>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          flexWrap="wrap"
          useFlexGap
        >
          {quickSelect('programId', 'Program', allFields[0].options, 200)}
          {quickSelect('classLevelId', 'Class', allFields[1].options)}
          {quickSelect('status', 'Status', STATUS_OPTIONS, 160)}
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

        <Card sx={{
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)},
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
        }}>
          <GenericTable
            data={rows}
            columns={columnsWithActions}
            rowIdField="_id"
            withCheckbox={false}
            withToolbar
            withPagination
            selectable={false}
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            emptyRowsHeight={53}
            onRowClick={handleRowClick}
            count={total}
            {...table.tableProps}
            toolbarProps={{
              searchPlaceholder: 'Search name, reg number, email or phone...',
              toolbarTitle: 'Students',
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

      <StudentBulkActionsModal open={bulkOpen} setOpen={setBulkOpen} />
    </Container>
  );
}
