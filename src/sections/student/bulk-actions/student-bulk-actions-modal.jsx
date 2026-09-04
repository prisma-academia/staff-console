import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Fade,
  Chip,
  Stack,
  Table,
  Paper,
  Alert,
  Button,
  Dialog,
  Select,
  Divider,
  MenuItem,
  TableRow,
  Checkbox,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  InputLabel,
  Typography,
  IconButton,
  AlertTitle,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  TablePagination,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';
import { formatProgrammeLabel } from 'src/utils/format-programme';

import { StudentApi, programApi, classLevelApi } from 'src/api';

import Iconify from 'src/components/iconify';

import { ACTIONS, needsTypedConfirmation } from './bulk-action-definitions';

const SECTION_LABEL_SX = {
  fontSize: '0.6875rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'text.secondary',
  mb: 1.5,
  display: 'block',
};

const EMPTY_FILTERS = { search: '', programId: '', classLevelId: '', status: '' };

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'setup', label: 'Setup' },
  { value: 'disable', label: 'Disabled' },
];

const STATUS_COLOR = {
  active: 'success',
  pending: 'warning',
  setup: 'info',
  disable: 'error',
};

const fullName = (student) =>
  `${student?.personalInfo?.firstName || ''} ${student?.personalInfo?.lastName || ''}`.trim();

export default function StudentBulkActionsModal({ open, setOpen }) {
  const { check } = usePermissions();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [action, setAction] = useState('');
  const [targetId, setTargetId] = useState('');
  const [format, setFormat] = useState('xlsx');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState('');

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => StudentApi.getStudents(),
    enabled: open,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
    enabled: open,
  });

  const { data: classLevels = [] } = useQuery({
    queryKey: ['classLevels'],
    queryFn: classLevelApi.getClassLevels,
    enabled: open,
  });

  // Start every visit from a clean slate — a stale selection from last time is
  // the kind of thing that quietly deletes the wrong students.
  useEffect(() => {
    if (!open) return;
    setFilters(EMPTY_FILTERS);
    setSelectedIds(new Set());
    setAction('');
    setTargetId('');
    setFormat('xlsx');
    setPage(0);
    setConfirmOpen(false);
    setTypedConfirmation('');
  }, [open]);

  const setFilterValue = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const filtered = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return (students || []).filter((student) => {
      if (filters.status && student.status !== filters.status) return false;
      if (filters.programId && (student.program?._id || student.program) !== filters.programId) {
        return false;
      }
      if (
        filters.classLevelId &&
        (student.classLevel?._id || student.classLevel) !== filters.classLevelId
      ) {
        return false;
      }
      if (!search) return true;
      return [
        student.regNumber,
        student.email,
        student.contactInfo?.email,
        fullName(student),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [students, filters]);

  const selectedInFilterCount = useMemo(
    () => filtered.reduce((count, student) => count + (selectedIds.has(student._id) ? 1 : 0), 0),
    [filtered, selectedIds]
  );

  const hiddenSelectedCount = selectedIds.size - selectedInFilterCount;
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const pageRows = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  const allInFilterSelected = filtered.length > 0 && selectedInFilterCount === filtered.length;

  // Scoped to the whole filtered set, not just this page — that is the point of
  // the modal: filter down, then select everything that matched.
  const handleToggleAllInFilter = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allInFilterSelected) {
        filtered.forEach((student) => next.delete(student._id));
      } else {
        filtered.forEach((student) => next.add(student._id));
      }
      return next;
    });
  };

  const handleToggleOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const activeAction = action ? ACTIONS[action] : null;
  const selectedCount = selectedIds.size;
  const requiresTypedConfirmation = needsTypedConfirmation(action, selectedCount);
  const confirmWord = activeAction?.confirmWord || '';
  const typedConfirmationSatisfied =
    !requiresTypedConfirmation || typedConfirmation.trim().toUpperCase() === confirmWord;

  const targetLabel = useMemo(() => {
    if (activeAction?.field === 'class') {
      const level = classLevels.find((item) => item._id === targetId);
      return level?.name || '';
    }
    if (activeAction?.field === 'programme') {
      const program = programs.find((item) => item._id === targetId);
      return program ? formatProgrammeLabel(program) : '';
    }
    return '';
  }, [activeAction, targetId, classLevels, programs]);

  const downloadExport = async (blob) => {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `students-export.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
  };

  const { mutate: runAction, isPending } = useMutation({
    mutationFn: async () => {
      const studentIds = Array.from(selectedIds);
      switch (action) {
        case 'moveClass':
          return StudentApi.bulkMoveStudents({ studentIds, classId: targetId });
        case 'moveProgramme':
          return StudentApi.bulkMoveStudents({ studentIds, programmeId: targetId });
        case 'activate':
          return StudentApi.bulkUpdateStudentStatus({ studentIds, status: 'active' });
        case 'disable':
          return StudentApi.bulkUpdateStudentStatus({ studentIds, status: 'disable' });
        case 'delete':
          return StudentApi.bulkDeleteStudents({ studentIds });
        case 'export': {
          const blob = await StudentApi.bulkExportStudents({ studentIds, format });
          await downloadExport(blob);
          return { exported: studentIds.length };
        }
        default:
          throw new Error('Unknown bulk action');
      }
    },
    onSuccess: (data) => {
      if (action === 'export') {
        enqueueSnackbar(`Exported ${data?.exported ?? selectedCount} student(s)`, {
          variant: 'success',
        });
        setConfirmOpen(false);
        setTypedConfirmation('');
        return;
      }

      const affected = data?.moved ?? data?.updated ?? data?.deleted ?? selectedCount;
      enqueueSnackbar(`${affected} student(s) updated`, { variant: 'success' });
      if (data?.unchanged) {
        enqueueSnackbar(`${data.unchanged} student(s) already had that value`, { variant: 'info' });
      }
      if (data?.notFound?.length) {
        enqueueSnackbar(`${data.notFound.length} student(s) could not be found`, {
          variant: 'warning',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setSelectedIds(new Set());
      setConfirmOpen(false);
      setTypedConfirmation('');
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Bulk action failed', { variant: 'error' });
    },
  });

  const handleClose = () => {
    if (isPending) return;
    setOpen(false);
  };

  const availableActions = Object.entries(ACTIONS).filter(([, value]) => check(value.permission));
  const requiresTarget = Boolean(activeAction?.field);
  const canReview = selectedCount > 0 && Boolean(action) && (!requiresTarget || Boolean(targetId));

  const handleOpenConfirm = () => {
    setTypedConfirmation('');
    setConfirmOpen(true);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        TransitionComponent={Fade}
        transitionDuration={280}
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="eva:options-2-fill" width={24} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.25 }}>
                  Bulk operations
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 0.25 }}
                >
                  Filter students, select them, then apply one operation to the whole set
                </Typography>
              </Box>
            </Stack>
            <IconButton
              size="small"
              onClick={handleClose}
              aria-label="Close"
              sx={{
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
              }}
            >
              <Iconify icon="eva:close-fill" width={22} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2.5, bgcolor: 'background.paper' }}>
          <Stack spacing={3}>
            {/* 1. Filters */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'grey.50' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography component="span" sx={SECTION_LABEL_SX}>
                  1. Find students
                </Typography>
                {activeFilterCount > 0 && (
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => {
                      setFilters(EMPTY_FILTERS);
                      setPage(0);
                    }}
                    sx={{ mb: 1.5 }}
                  >
                    Clear filters
                  </Button>
                )}
              </Stack>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(4, minmax(0, 1fr))',
                  },
                }}
              >
                <TextField
                  size="small"
                  label="Search"
                  placeholder="Name, reg number, email"
                  value={filters.search}
                  onChange={(event) => setFilterValue('search', event.target.value)}
                />
                <FormControl size="small">
                  <InputLabel id="bulk-filter-programme">Programme</InputLabel>
                  <Select
                    labelId="bulk-filter-programme"
                    label="Programme"
                    value={filters.programId}
                    onChange={(event) => setFilterValue('programId', event.target.value)}
                  >
                    <MenuItem value="">All programmes</MenuItem>
                    {programs.map((program) => (
                      <MenuItem key={program._id} value={program._id}>
                        {formatProgrammeLabel(program)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small">
                  <InputLabel id="bulk-filter-class">Class level</InputLabel>
                  <Select
                    labelId="bulk-filter-class"
                    label="Class level"
                    value={filters.classLevelId}
                    onChange={(event) => setFilterValue('classLevelId', event.target.value)}
                  >
                    <MenuItem value="">All classes</MenuItem>
                    {classLevels.map((level) => (
                      <MenuItem key={level._id} value={level._id}>
                        {level.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small">
                  <InputLabel id="bulk-filter-status">Status</InputLabel>
                  <Select
                    labelId="bulk-filter-status"
                    label="Status"
                    value={filters.status}
                    onChange={(event) => setFilterValue('status', event.target.value)}
                  >
                    <MenuItem value="">All statuses</MenuItem>
                    {STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Paper>

            {/* 2. Selection */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'grey.50' }}>
              <Typography component="span" sx={SECTION_LABEL_SX}>
                2. Select students
              </Typography>

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                sx={{ gap: 1, mb: 1.5 }}
              >
                <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                  <Typography variant="body2" fontWeight={600}>
                    {selectedCount} of {filtered.length} selected
                  </Typography>
                  {hiddenSelectedCount > 0 && (
                    <Chip
                      size="small"
                      color="warning"
                      label={`+${hiddenSelectedCount} selected outside current filters`}
                    />
                  )}
                </Stack>
                {selectedCount > 0 && (
                  <Button size="small" color="inherit" onClick={() => setSelectedIds(new Set())}>
                    Clear selection
                  </Button>
                )}
              </Stack>

              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <TableContainer sx={{ maxHeight: 320 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={allInFilterSelected}
                            indeterminate={selectedInFilterCount > 0 && !allInFilterSelected}
                            disabled={filtered.length === 0}
                            onChange={handleToggleAllInFilter}
                            inputProps={{ 'aria-label': 'Select all students matching filters' }}
                          />
                        </TableCell>
                        <TableCell>Student</TableCell>
                        <TableCell>Reg number</TableCell>
                        <TableCell>Programme</TableCell>
                        <TableCell>Class</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pageRows.map((student) => {
                        const isSelected = selectedIds.has(student._id);
                        return (
                          <TableRow
                            hover
                            key={student._id}
                            selected={isSelected}
                            onClick={() => handleToggleOne(student._id)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding="checkbox">
                              <Checkbox checked={isSelected} />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {fullName(student) || '—'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {student.contactInfo?.email || student.email}
                              </Typography>
                            </TableCell>
                            <TableCell>{student.regNumber}</TableCell>
                            <TableCell>{student.program?.name || '—'}</TableCell>
                            <TableCell>{student.classLevel?.name || '—'}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={student.status}
                                color={STATUS_COLOR[student.status] || 'default'}
                                sx={{ borderRadius: 1 }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {!isLoading && filtered.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No students match these filters
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Divider />
                <TablePagination
                  component="div"
                  count={filtered.length}
                  page={page}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[10, 25, 50]}
                  onPageChange={(event, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                  }}
                />
              </Box>
            </Paper>

            {/* 3. Operation */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'grey.50' }}>
              <Typography component="span" sx={SECTION_LABEL_SX}>
                3. Choose an operation
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                }}
              >
                <FormControl size="small">
                  <InputLabel id="bulk-operation">Operation</InputLabel>
                  <Select
                    labelId="bulk-operation"
                    label="Operation"
                    value={action}
                    onChange={(event) => {
                      setAction(event.target.value);
                      setTargetId('');
                    }}
                  >
                    {availableActions.map(([key, value]) => (
                      <MenuItem key={key} value={key}>
                        {value.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {activeAction?.field === 'class' && (
                  <FormControl size="small">
                    <InputLabel id="bulk-target-class">Target class level</InputLabel>
                    <Select
                      labelId="bulk-target-class"
                      label="Target class level"
                      value={targetId}
                      onChange={(event) => setTargetId(event.target.value)}
                    >
                      {classLevels.map((level) => (
                        <MenuItem key={level._id} value={level._id}>
                          {level.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {activeAction?.field === 'programme' && (
                  <FormControl size="small">
                    <InputLabel id="bulk-target-programme">Target programme</InputLabel>
                    <Select
                      labelId="bulk-target-programme"
                      label="Target programme"
                      value={targetId}
                      onChange={(event) => setTargetId(event.target.value)}
                    >
                      {programs.map((program) => (
                        <MenuItem key={program._id} value={program._id}>
                          {formatProgrammeLabel(program)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {activeAction?.field === 'format' && (
                  <FormControl size="small">
                    <InputLabel id="bulk-export-format">Format</InputLabel>
                    <Select
                      labelId="bulk-export-format"
                      label="Format"
                      value={format}
                      onChange={(event) => setFormat(event.target.value)}
                    >
                      <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                      <MenuItem value="csv">CSV (.csv)</MenuItem>
                    </Select>
                  </FormControl>
                )}
              </Box>

              {activeAction?.destructive && (
                <Alert severity="error" variant="outlined" sx={{ mt: 2 }}>
                  Deleted students cannot be recovered. Disabling them instead is reversible.
                </Alert>
              )}
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50',
            gap: 1,
          }}
        >
          <Button color="inherit" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={activeAction?.destructive ? 'error' : 'primary'}
            disabled={!canReview || isPending}
            onClick={handleOpenConfirm}
          >
            Review &amp; confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Strict confirmation gate — nothing is sent until this is cleared. */}
      <Dialog
        open={confirmOpen}
        onClose={isPending ? undefined : () => setConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirm bulk operation</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity={activeAction?.destructive ? 'error' : 'warning'} variant="outlined">
              <AlertTitle sx={{ mb: 0.5 }}>
                {activeAction?.destructive ? 'This cannot be undone' : 'Please confirm'}
              </AlertTitle>
              You are about to {activeAction?.summary}{' '}
              <strong>
                {selectedCount} student{selectedCount === 1 ? '' : 's'}
              </strong>
              {targetLabel ? (
                <>
                  {' '}
                  to <strong>{targetLabel}</strong>
                </>
              ) : null}
              .
            </Alert>

            {hiddenSelectedCount > 0 && (
              <Alert severity="warning" variant="outlined">
                {hiddenSelectedCount} of these {hiddenSelectedCount === 1 ? 'is' : 'are'} not
                visible under your current filters. The operation applies to all {selectedCount}.
              </Alert>
            )}

            {requiresTypedConfirmation && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Type <strong>{confirmWord}</strong> to confirm.
                </Typography>
                <TextField
                  size="small"
                  autoFocus
                  fullWidth
                  value={typedConfirmation}
                  onChange={(event) => setTypedConfirmation(event.target.value)}
                  placeholder={confirmWord}
                  disabled={isPending}
                  inputProps={{ 'aria-label': `Type ${confirmWord} to confirm` }}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button color="inherit" onClick={() => setConfirmOpen(false)} disabled={isPending}>
            Go back
          </Button>
          <LoadingButton
            variant="contained"
            color={activeAction?.destructive ? 'error' : 'primary'}
            loading={isPending}
            disabled={!typedConfirmationSatisfied}
            onClick={() => runAction()}
          >
            {activeAction?.confirmLabel} {selectedCount}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

StudentBulkActionsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
};
