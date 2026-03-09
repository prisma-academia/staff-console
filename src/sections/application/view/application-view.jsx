import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { Box } from '@mui/system';
import { Visibility, FileDownload } from '@mui/icons-material';
import {
  Chip,
  Card,
  alpha,
  Button,
  useTheme,
  Container,
  IconButton,
  Typography,
  Stack,
  MenuItem,
  Select,
  TextField,
  FormControl,
  InputLabel,
} from '@mui/material';

import { listApplications, listSessions, listProgrammes } from 'src/api/adminApplicationApi';

import { GenericTable } from 'src/components/generic-table';

import ExportModal from '../export.modal';

const DEBOUNCE_MS = 300;
const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'not paid', label: 'Not paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
];

const columns = [
  {
    id: 'fullName',
    label: 'Full Name',
    align: 'left',
    cellSx: { width: '20%' },
    renderCell: (row) =>
      [row?.firstName, row?.lastName].filter(Boolean).join(' ') || '—',
  },
  { id: 'number', label: 'Application Number', cellSx: { width: '15%' } },
  {
    id: 'programme',
    label: 'Programme',
    cellSx: { width: '15%' },
    renderCell: (row) =>
      row?.programme?.name ?? row?.programme ?? '—',
  },
  { id: 'stateOfOrigin', label: 'State', cellSx: { width: '10%' } },
  { id: 'lgaOfOrigin', label: 'LGA', cellSx: { width: '10%' } },
  { id: 'email', label: 'Email', cellSx: { width: '15%' } },
  {
    id: 'status',
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy] = useState('createdAt');
  const [sortOrder] = useState('desc');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [session, setSession] = useState('');
  const [status, setStatus] = useState('');
  const [programme, setProgramme] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

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

  const queryParams = useMemo(() => {
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      sortBy,
      sortOrder,
    };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (session) params.session = session;
    if (status) params.status = status;
    if (programme) params.programme = programme;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return params;
  }, [page, rowsPerPage, sortBy, sortOrder, debouncedSearch, session, status, programme, startDate, endDate]);

  const { data, isLoading } = useQuery({
    queryKey: ['applications', queryParams],
    queryFn: async () => {
      const result = await listApplications(queryParams);
      if (!result.ok) throw new Error(result.message);
      return result;
    },
  });

  const rows = data?.data?.data ?? [];
  const pagination = data?.data?.pagination ?? {
    total: 0,
    page: 1,
    limit: rowsPerPage,
    pages: 0,
  };

  const handleRowClick = (row) => {
    navigate(`/application/${row._id}`);
  };

  const handleOpenExportModal = () => {
    setOpenExportModal(true);
  };

  const handleCloseExportModal = () => {
    setOpenExportModal(false);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    setPage(0);
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
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleOpenExportModal}
          >
            Export
          </Button>
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
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="filter-session-label">Session</InputLabel>
                <Select
                  labelId="filter-session-label"
                  value={session}
                  label="Session"
                  onChange={handleFilterChange(setSession)}
                >
                  <MenuItem value="">All</MenuItem>
                  {(sessions || []).map((s) => (
                    <MenuItem key={s._id || s.id} value={s._id || s.id}>
                      {s.name || s._id || s.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="filter-status-label">Status</InputLabel>
                <Select
                  labelId="filter-status-label"
                  value={status}
                  label="Status"
                  onChange={handleFilterChange(setStatus)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="filter-programme-label">Programme</InputLabel>
                <Select
                  labelId="filter-programme-label"
                  value={programme}
                  label="Programme"
                  onChange={handleFilterChange(setProgramme)}
                >
                  <MenuItem value="">All</MenuItem>
                  {(programmes || []).map((p) => (
                    <MenuItem key={p._id || p.id} value={p._id || p.id}>
                      {p.name || p._id || p.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Start date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 160 }}
              />
              <TextField
                size="small"
                label="End date"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ width: 160 }}
              />
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
            emptyRowsHeight={53}
            noDataComponent={null}
            EmptyStateComponent={null}
            customTableHead={null}
            renderRow={null}
            onRowClick={handleRowClick}
            manualPagination
            count={pagination.total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            toolbarProps={{
              searchPlaceholder: 'Search applications...',
              toolbarTitle: 'Applications',
              filterName: searchInput,
              onFilterName: handleSearchChange,
            }}
          />
        </Card>
      </Box>

      <ExportModal open={openExportModal} onClose={handleCloseExportModal} />
    </Container>
  );
}
