import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { Box } from '@mui/system';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Chip,
  Card,
  Stack,
  alpha,
  Button,
  Dialog,
  Select,
  Tooltip,
  useTheme,
  MenuItem,
  TextField,
  Container,
  IconButton,
  Typography,
  InputLabel,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import useServerTable from 'src/hooks/use-server-table';

import { PERMISSIONS } from 'src/permissions/constants';
import {
  listSessions,
  listAdmissions,
  listProgrammes,
  deleteAdmission,
  exportAdmissions,
  validateAdmissionPayment,
} from 'src/api/adminApplicationApi';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { ExportMenu } from 'src/components/export';
import { GenericTable } from 'src/components/generic-table';
import { FilterChips, describeFilters, AdvancedFilterDrawer } from 'src/components/advanced-filter';

import AddAdmission from '../add-admission';
import AddStudentModal from '../add-student';
import AdmissionLetterModal from '../admission-letter-modal';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'offered', label: 'Offered' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
];

const QUICK_FILTER_KEYS = ['session', 'programme', 'status'];
const FILTER_KEYS = [...QUICK_FILTER_KEYS, 'paid', 'gender', 'stateOfOrigin', 'startDate', 'endDate'];

const ADVANCED_FIELDS = [
  {
    key: 'paid',
    label: 'Acceptance fee',
    type: 'select',
    options: [
      { value: 'true', label: 'Paid' },
      { value: 'false', label: 'Not paid' },
    ],
  },
  {
    key: 'gender',
    label: 'Gender',
    type: 'select',
    options: [
      { value: 'Male', label: 'Male' },
      { value: 'Female', label: 'Female' },
    ],
  },
  { key: 'stateOfOrigin', label: 'State of origin', type: 'text' },
  { key: 'startDate', label: 'Created from', type: 'date' },
  { key: 'endDate', label: 'Created to', type: 'date' },
];

const columns = [
  {
    id: 'fullName',
    label: 'Full Name',
    align: 'left',
    cellSx: { width: '25%' },
    renderCell: (row) => (
      <Typography variant="subtitle2" noWrap>
        {[row.application?.firstName, row.application?.lastName, row.application?.otherName]
          .filter(Boolean)
          .join(' ') || '—'}
      </Typography>
    ),
  },
  {
    id: 'number',
    sortKey: 'number',
    label: 'Admission Number',
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Typography variant="body2" fontWeight={500}>
        {row.number}
      </Typography>
    ),
  },
  {
    id: 'programme',
    label: 'Programme',
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {row.programme?.name ?? row.programme ?? 'N/A'}
      </Typography>
    ),
  },
  {
    id: 'status',
    sortKey: 'status',
    label: 'Status',
    cellSx: { width: '15%' },
    renderCell: (row) => {
      const status = (row?.status || 'pending').toLowerCase();
      const statusConfig = {
        accepted: { label: 'Accepted', color: 'success' },
        offered: { label: 'Offered', color: 'info' },
        pending: { label: 'Pending', color: 'warning' },
        declined: { label: 'Declined', color: 'error' },
      };
      const config = statusConfig[status] || { label: row?.status || 'Pending', color: 'default' };
      return (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          <Chip label={config.label} color={config.color} size="small" sx={{ borderRadius: 1 }} />
          {row?.payment?.paid && (
            <Chip label="Fee paid" color="success" variant="outlined" size="small" sx={{ borderRadius: 1 }} />
          )}
        </Stack>
      );
    },
  },
  {
    id: 'offerDate',
    sortKey: 'offerDate',
    label: 'Offer Date',
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {row.offerDate ? new Date(row.offerDate).toLocaleDateString() : 'N/A'}
      </Typography>
    ),
  },
  { id: 'action', label: 'Action', cellSx: { width: '5%' } },
];

export default function AdmissionPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [openModal, setOpenModal] = useState(false);
  const [openAdmsModal, setOpenAdmsModal] = useState(false);
  const [modalObj, setModalObj] = useState(null);
  const [letterObj, setLetterObj] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [validateConfirm, setValidateConfirm] = useState(null);
  const [validateReference, setValidateReference] = useState('');
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
  const sessions = sessionsResult?.data ?? [];
  const programmes = programmesResult?.data ?? [];

  // Quick filters + advanced fields, used for the chips and the PDF filter summary.
  const allFields = [
    {
      key: 'session',
      label: 'Session',
      type: 'select',
      options: sessions.map((s) => ({ value: s._id || s.id, label: s.name || s._id })),
    },
    {
      key: 'programme',
      label: 'Programme',
      type: 'select',
      options: programmes.map((p) => ({ value: p._id || p.id, label: p.name })),
    },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    ...ADVANCED_FIELDS,
  ];

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['admissions', queryParams],
    queryFn: async () => {
      const result = await listAdmissions(queryParams);
      if (!result.ok) throw new Error(result.message);
      return result;
    },
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteAdmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      enqueueSnackbar('Admission deleted successfully', { variant: 'success' });
      setDeleteConfirm(null);
    },
    onError: (e) => enqueueSnackbar(e.message || 'Failed to delete admission', { variant: 'error' }),
  });

  const closeValidate = () => {
    setValidateConfirm(null);
    setValidateReference('');
  };

  const validateMutation = useMutation({
    mutationFn: async ({ id, reference }) => {
      const res = await validateAdmissionPayment(id, reference);
      if (!res.ok) throw new Error(res.message || 'Validation failed');
      return res;
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      enqueueSnackbar(res.message || 'Payment validated successfully', { variant: 'success' });
      closeValidate();
    },
    onError: (e) => enqueueSnackbar(e.message || 'Failed to validate payment', { variant: 'error' }),
  });

  const rows = data?.data?.data ?? [];
  const total = data?.data?.pagination?.total ?? 0;

  const handleOpen = (obj) => {
    setOpenModal(true);
    setModalObj(obj);
  };

  const handleClose = () => {
    setOpenModal(false);
    setModalObj(null);
  };

  const columnsWithActions = columns.map((col) => {
    if (col.id === 'action') {
      return {
        ...col,
        renderCell: (row) => (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Admission letter">
              <IconButton
                color="primary"
                size="small"
                sx={{
                  boxShadow: `0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setLetterObj(row);
                }}
              >
                <Iconify icon="eva:file-text-fill" />
              </IconButton>
            </Tooltip>
            {!(row.status === 'accepted' && row.payment?.paid) && (
              <Can do={PERMISSIONS.EDIT_ADMISSION}>
                <Tooltip title="Validate acceptance payment">
                  <IconButton
                    color="success"
                    size="small"
                    sx={{
                      boxShadow: `0 0 2px ${alpha(theme.palette.success.main, 0.2)}`,
                      '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setValidateConfirm(row);
                    }}
                  >
                    <Iconify icon="eva:checkmark-circle-2-fill" />
                  </IconButton>
                </Tooltip>
              </Can>
            )}
            {row.status === 'accepted' && row.payment?.paid && (
              <Can do={PERMISSIONS.ADD_STUDENT}>
                <Tooltip title="Create student record">
                  <IconButton
                    color="primary"
                    size="small"
                    sx={{
                      boxShadow: `0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpen(row);
                    }}
                  >
                    <Iconify icon="mdi:account-plus" />
                  </IconButton>
                </Tooltip>
              </Can>
            )}
            {!row.payment?.paid && (
              <Can do={PERMISSIONS.DELETE_ADMISSION}>
                <Tooltip title="Delete">
                  <IconButton
                    color="error"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(row);
                    }}
                  >
                    <Iconify icon="eva:trash-2-fill" />
                  </IconButton>
                </Tooltip>
              </Can>
            )}
          </Stack>
        ),
      };
    }
    return col;
  });

  const quickSelect = (key, label, options, minWidth = 180) => (
    <FormControl size="small" sx={{ minWidth }}>
      <InputLabel>{label}</InputLabel>
      <Select value={filters[key]} onChange={(e) => setFilter(key, e.target.value)} label={label}>
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
      {modalObj && <AddStudentModal open={openModal} handleClose={handleClose} object={modalObj} />}

      {letterObj && (
        <AdmissionLetterModal
          open={Boolean(letterObj)}
          onClose={() => setLetterObj(null)}
          admission={letterObj}
        />
      )}

      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Admissions
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage student admissions and enrollments
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpenAdmsModal(true)}
              sx={{
                px: 3,
                boxShadow: theme.customShadows?.primary,
                '&:hover': { boxShadow: 'none' },
              }}
            >
              New Admission
            </Button>
            <ExportMenu
              title="Admissions"
              fileBase="admissions"
              count={total}
              filterSummary={describeFilters(allFields, filters, search).map((f) => f.text)}
              fetchRows={() => exportAdmissions({ ...filterParams, sortBy: queryParams.sortBy, sortOrder: queryParams.sortOrder })}
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
          {quickSelect('session', 'Session', allFields[0].options)}
          {quickSelect('programme', 'Programme', allFields[1].options)}
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

        <Card
          sx={{
            boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)},
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
            borderRadius: 2,
          }}
        >
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
            count={total}
            {...table.tableProps}
            toolbarProps={{
              searchPlaceholder: 'Search name, email, phone or number...',
              toolbarTitle: 'Admissions List',
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

      <AddAdmission open={openAdmsModal} setOpen={setOpenAdmsModal} />

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Admission</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete admission &quot;{deleteConfirm?.number}&quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <LoadingButton
            loading={deleteMutation.isPending}
            color="error"
            variant="contained"
            onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm._id)}
          >
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(validateConfirm)} onClose={closeValidate} fullWidth maxWidth="xs">
        <DialogTitle>Validate Acceptance Payment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>
              Re-query the payment gateway for admission &quot;{validateConfirm?.number}&quot;. If the
              transaction was successful the admission will be marked as accepted.
            </Typography>
            {validateConfirm?.payment?.reference ? (
              <Typography variant="body2" color="text.secondary">
                Stored reference: {validateConfirm.payment.reference}
              </Typography>
            ) : (
              <Typography variant="body2" color="warning.main">
                No payment reference is stored for this admission. Enter the Paystack reference
                from the applicant&apos;s receipt below.
              </Typography>
            )}
            <TextField
              label="Paystack reference (optional override)"
              size="small"
              fullWidth
              value={validateReference}
              onChange={(e) => setValidateReference(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeValidate}>Cancel</Button>
          <LoadingButton
            loading={validateMutation.isPending}
            color="success"
            variant="contained"
            disabled={!validateConfirm?.payment?.reference && !validateReference.trim()}
            onClick={() =>
              validateConfirm &&
              validateMutation.mutate({
                id: validateConfirm._id,
                reference: validateReference.trim() || undefined,
              })
            }
          >
            Validate payment
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
