import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import {
  Card,
  Stack,
  alpha,
  Button,
  Dialog,
  Tooltip,
  MenuItem,
  useTheme,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';

import useServerTable from 'src/hooks/use-server-table';
import useActiveSession from 'src/hooks/use-active-session';

import { usePermissions } from 'src/utils/permissions';

import { ResitApi, courseApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

import EditCourseModal from './edit-course';
import { formatPrice } from './resit/resit-format';

// ?isActive filter: empty shows every course
const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Disabled' },
];

/** The resit fee of every course for the header session: its own session price, else the default. */
function useResitFees(enabled) {
  const { sessionId } = useActiveSession();
  const { data } = useQuery({
    queryKey: ['resit', 'prices', 'fees-by-course', sessionId || null],
    queryFn: () => ResitApi.getPrices(sessionId ? { sessionId } : {}),
    enabled,
    staleTime: 60 * 1000,
  });
  return useMemo(() => {
    const fees = new Map();
    (Array.isArray(data) ? data : []).forEach((row) => {
      const own = sessionId ? row.sessionPrice : null;
      const amount = own ?? row.defaultPrice ?? null;
      fees.set(String(row.courseId), amount);
    });
    return fees;
  }, [data, sessionId]);
}

/** The course catalogue: every course, with its resit fee and a shortcut to its resit score sheet. */
export default function CourseListTab({ onOpenResitScores }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { check } = usePermissions();
  const canViewResits = check(PERMISSIONS.VIEW_RESIT);
  const [editingCourse, setEditingCourse] = useState(null);
  const [toggling, setToggling] = useState(null);

  const table = useServerTable({ filterKeys: ['isActive'], defaultSortBy: 'name', defaultSortOrder: 'asc' });
  const { queryParams, filters, setFilter } = table;
  const resitFees = useResitFees(canViewResits);

  const { mutate: toggleCourse, isPending: isToggling } = useMutation({
    mutationFn: ({ id, isActive }) => courseApi.updateCourse(id, { isActive }),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      enqueueSnackbar(isActive ? 'Course enabled' : 'Course disabled', { variant: 'success' });
      setToggling(null);
    },
    onError: (toggleError) => {
      enqueueSnackbar(toggleError.data?.message || toggleError.message || 'Failed to update course', { variant: 'error' });
    },
  });

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['courses', 'page', queryParams],
    queryFn: () => courseApi.getCoursesPage(queryParams),
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  const columns = [
    {
      id: 'name',
      sortKey: 'name',
      label: 'Title',
      align: 'left',
      cellSx: { width: '17%' },
      renderCell: (row) => (
        <Typography variant="subtitle2" noWrap>
          {row.name}
        </Typography>
      ),
    },
    {
      id: 'code',
      sortKey: 'code',
      label: 'Code',
      cellSx: { width: '9%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap sx={{ fontFamily: 'monospace' }}>
          {row.code}
        </Typography>
      ),
    },
    {
      id: 'program',
      label: 'Programs',
      cellSx: { width: '11%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.programs?.map((prog) => prog.code).join(', ') || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'classLevel',
      label: 'Class Level',
      cellSx: { width: '9%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.classLevel?.name || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'semester',
      sortKey: 'semester',
      label: 'Semester',
      cellSx: { width: '10%' },
    },
    {
      id: 'credit',
      sortKey: 'credit',
      label: 'Credit',
      cellSx: { width: '6%' },
    },
    ...(canViewResits
      ? [
          {
            id: 'resitFee',
            label: (
              <Tooltip title="For the session picked in the header. Set it on the Resit fees tab.">
                <span style={{ whiteSpace: 'nowrap' }}>Resit fee</span>
              </Tooltip>
            ),
            sortable: false,
            cellSx: { width: '9%' },
            renderCell: (row) => {
              const fee = resitFees.get(String(row._id));
              return fee === null || fee === undefined ? (
                <Typography variant="body2" color="text.secondary" noWrap>
                  Not set
                </Typography>
              ) : (
                <Typography variant="body2" noWrap sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatPrice(fee)}
                </Typography>
              );
            },
          },
        ]
      : []),
    {
      id: 'instructors',
      label: 'Instructors',
      cellSx: { width: '13%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.instructors?.length
            ? row.instructors
                .map((i) =>
                  i.firstName && i.lastName ? `${i.firstName} ${i.lastName}` : i.email
                )
                .join(', ')
            : '—'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      sortable: false,
      cellSx: { width: '7%' },
      renderCell: (row) => (
        <Label color={row.isActive === false ? 'default' : 'success'}>
          {row.isActive === false ? 'Disabled' : 'Active'}
        </Label>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      sortable: false,
      cellSx: { width: '9%' },
      renderCell: (row) => {
        const active = row.isActive !== false;
        return (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            {canViewResits && (
              <Tooltip title={`Resit scores for ${row.code}`}>
                <IconButton
                  size="small"
                  color="inherit"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenResitScores(row._id);
                  }}
                  aria-label={`Resit scores for ${row.code}`}
                >
                  <Iconify icon="mdi:restore" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Edit course">
              <IconButton
                size="small"
                color="inherit"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingCourse(row);
                }}
                aria-label={`Edit ${row.code}`}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
            <Can do={PERMISSIONS.EDIT_COURSE}>
              <Tooltip title={active ? 'Disable course' : 'Enable course'}>
                <IconButton
                  size="small"
                  color={active ? 'inherit' : 'success'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setToggling(row);
                  }}
                  aria-label={`${active ? 'Disable' : 'Enable'} ${row.code}`}
                >
                  <Iconify icon={active ? 'solar:forbidden-circle-bold' : 'solar:check-circle-bold'} />
                </IconButton>
              </Tooltip>
            </Can>
          </Stack>
        );
      },
    },
  ];

  return (
    <>
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
          emptyRowsHeight={53}
          initialSort={{ orderBy: 'name', order: 'asc' }}
          onRowClick={(row) => setEditingCourse(row)}
          toolbarProps={{
            ...table.searchProps,
            searchPlaceholder: 'Search courses...',
            toolbarTitle: `${total.toLocaleString()} course${total === 1 ? '' : 's'}`,
            customActions: (
              <TextField
                select
                size="small"
                label="Status"
                value={filters.isActive}
                onChange={(e) => setFilter('isActive', e.target.value)}
                sx={{ minWidth: 140 }}
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.label} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            ),
          }}
        />
      </Card>

      <EditCourseModal
        open={!!editingCourse}
        setOpen={(isOpen) => !isOpen && setEditingCourse(null)}
        course={editingCourse}
      />

      {/* Enable/disable confirmation */}
      <Dialog open={!!toggling} onClose={() => !isToggling && setToggling(null)}>
        <DialogTitle>{toggling?.isActive === false ? 'Enable' : 'Disable'} {toggling?.code}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toggling?.isActive === false
              ? 'The course will be back on course forms, score sheets and result compute.'
              : 'The course will be left out of course forms, score sheets and result compute. Saved results and transcripts keep it.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToggling(null)} disabled={isToggling}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={toggling?.isActive === false ? 'success' : 'warning'}
            disabled={isToggling}
            onClick={() => toggleCourse({ id: toggling._id, isActive: toggling.isActive === false })}
          >
            {toggling?.isActive === false ? 'Enable' : 'Disable'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

CourseListTab.propTypes = {
  onOpenResitScores: PropTypes.func.isRequired,
};
