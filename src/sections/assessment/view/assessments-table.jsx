import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';

import {
  Card,
  Stack,
  alpha,
  Table,
  Tooltip,
  TableRow,
  useTheme,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';

import { AssessmentApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import Scrollbar from 'src/components/scrollbar';

import EditAssessment from '../edit-assessment';

const formatCreatedBy = (createdBy) => {
  if (!createdBy) return 'N/A';
  if (typeof createdBy === 'object') {
    const first = createdBy.firstName || '';
    const last = createdBy.lastName || '';
    return [first, last].filter(Boolean).join(' ') || createdBy.email || 'N/A';
  }
  return 'N/A';
};

export default function AssessmentsTable({ sessionId, programId, courseId, addOpen: addOpenProp, setAddOpen: setAddOpenProp }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [, setAddOpenLocal] = useState(false);
  const setAddOpen = setAddOpenProp != null ? setAddOpenProp : setAddOpenLocal;
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');

  const hasContext = Boolean(programId && courseId);

  const { data: assessmentsResponse, isLoading } = useQuery({
    queryKey: ['assessments', programId, courseId],
    queryFn: () => AssessmentApi.getAssessments({ programId, courseId }),
    enabled: hasContext,
  });

  const assessments = useMemo(() => {
    if (!hasContext) return [];
    const raw = assessmentsResponse;
    return Array.isArray(raw) ? raw : [];
  }, [hasContext, assessmentsResponse]);

  const deleteMutation = useMutation({
    mutationFn: AssessmentApi.deleteAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', programId, courseId] });
      enqueueSnackbar('Assessment deleted successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error?.message || 'Failed to delete assessment', { variant: 'error' });
    },
  });

  const handleDelete = useCallback((id, e) => {
    e?.stopPropagation?.();
    if (window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const handleEdit = useCallback((row, e) => {
    e?.stopPropagation?.();
    setEditingAssessment(row);
  }, []);

  const columns = useMemo(
    () => [
      {
        id: 'details',
        header: 'Details',
        columns: [
          {
            accessorKey: 'type',
            header: 'Type',
            size: 100,
            cell: ({ getValue }) => (
              <Label variant="soft" color="default">
                {getValue() || '—'}
              </Label>
            ),
          },
          {
            accessorKey: 'maxScore',
            header: 'Max Score',
            size: 90,
            cell: ({ getValue }) => (
              <Typography variant="body2">{getValue() ?? '—'}</Typography>
            ),
          },
          {
            accessorKey: 'weight',
            header: 'Weight',
            size: 80,
            cell: ({ getValue }) => (
              <Typography variant="body2">
                {getValue() != null ? `${getValue()}%` : 'N/A'}
              </Typography>
            ),
          },
        ],
      },
      {
        id: 'context',
        header: 'Context',
        columns: [
          {
            id: 'program',
            accessorFn: (row) => (row.program && (typeof row.program === 'object' ? row.program.name : row.program)) || '—',
            header: 'Program',
            size: 140,
            cell: ({ row }) => (
              <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                {row.original.program && (typeof row.original.program === 'object' ? row.original.program.name : row.original.program) || '—'}
              </Typography>
            ),
          },
          {
            id: 'semester',
            accessorFn: (row) => (row.course && typeof row.course === 'object' && row.course.semester) || '—',
            header: 'Semester',
            size: 120,
            cell: ({ row }) => (
              <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                {row.original.course && typeof row.original.course === 'object' && row.original.course.semester || '—'}
              </Typography>
            ),
          },
          {
            accessorKey: 'isActive',
            header: 'Status',
            size: 90,
            cell: ({ getValue }) => (
              <Label variant="soft" color={getValue() !== false ? 'success' : 'default'}>
                {getValue() !== false ? 'Active' : 'Inactive'}
              </Label>
            ),
          },
        ],
      },
      {
        id: 'meta',
        header: 'Meta',
        columns: [
          {
            id: 'createdBy',
            accessorFn: (row) => formatCreatedBy(row.createdBy),
            header: 'Created By',
            size: 130,
            cell: ({ row }) => (
              <Typography variant="body2" noWrap sx={{ maxWidth: 130 }}>
                {formatCreatedBy(row.original.createdBy)}
              </Typography>
            ),
          },
        ],
      },
      {
        id: 'actions',
        header: '',
        columns: [
          {
            id: 'action',
            header: '',
            size: 100,
            cell: ({ row }) => (
              <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
                <Can do={PERMISSIONS.EDIT_ASSESSMENT}>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={(e) => handleEdit(row.original, e)}>
                      <Iconify icon="eva:edit-fill" />
                    </IconButton>
                  </Tooltip>
                </Can>
                <Can do={PERMISSIONS.DELETE_ASSESSMENT}>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => handleDelete(row.original._id, e)}
                    >
                      <Iconify icon="eva:trash-2-fill" />
                    </IconButton>
                  </Tooltip>
                </Can>
              </Stack>
            ),
          },
        ],
      },
    ],
    [handleDelete, handleEdit]
  );

  const table = useReactTable({
    data: assessments,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row._id,
  });

  if (!hasContext) {
    return (
      <Card
        sx={{
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <Typography variant="body2" color="text.secondary">
            Select program and course above to view assessment definitions.
          </Typography>
        </Stack>
      </Card>
    );
  }

  return (
    <>
      <Card
        sx={{
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Search assessments…"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 260 }}
          />
          <Can do={PERMISSIONS.ADD_ASSESSMENT}>
            <IconButton
              color="primary"
              onClick={() => setAddOpen(true)}
              disabled={!hasContext}
              sx={{ bgcolor: 'primary.lighter', '&:hover': { bgcolor: 'primary.light' } }}
              title={!hasContext ? 'Select program and course to add an assessment' : 'Add assessment'}
            >
              <Iconify icon="eva:plus-fill" />
            </IconButton>
          </Can>
        </Stack>

        <Scrollbar>
          <Table sx={{ minWidth: 960 }}>
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isLeftAlign = ['name', 'program', 'semester', 'createdBy', 'action'].includes(header.column.id);
                    return (
                    <TableCell
                      key={header.id}
                      colSpan={header.colSpan}
                      align={isLeftAlign ? 'left' : 'center'}
                      sx={{
                        fontWeight: 700,
                        fontSize: header.depth === 0 ? '0.75rem' : '0.8125rem',
                        textTransform: header.depth === 0 ? 'uppercase' : 'none',
                        bgcolor: header.depth === 0 ? 'grey.100' : 'grey.50',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        minWidth: header.getSize?.() ?? 80,
                      }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableCell>
                  );})}
                </TableRow>
              ))}
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={columns.flatMap((c) => c.columns).length} align="center" sx={{ py: 4 }}>
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && table.getRowModel().rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.flatMap((c) => c.columns).length} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No assessments found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && table.getRowModel().rows.length > 0 &&
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        align={cell.column.id === 'name' || cell.column.id === 'program' || cell.column.id === 'semester' || cell.column.id === 'createdBy' || cell.column.id === 'action' ? 'left' : 'center'}
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          minWidth: cell.column.getSize?.() ?? 80,
                          py: 1.5,
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>

      <EditAssessment
        open={Boolean(editingAssessment)}
        setOpen={() => setEditingAssessment(null)}
        assessment={editingAssessment}
      />
    </>
  );
}

AssessmentsTable.propTypes = {
  sessionId: PropTypes.string,
  programId: PropTypes.string,
  courseId: PropTypes.string,
  addOpen: PropTypes.bool,
  setAddOpen: PropTypes.func,
};

