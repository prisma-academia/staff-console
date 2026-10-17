import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { Box } from '@mui/system';
import {
  Card,
  Stack,
  alpha,
  Button,
  Dialog,
  Tooltip,
  MenuItem,
  useTheme,
  Container,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';

import useServerTable from 'src/hooks/use-server-table';

import { courseApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

import AddCourseModal from '../add-course';
import EditCourseModal from '../edit-course';

// ?isActive filter: empty shows every course
const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Disabled' },
];

export default function CoursePage() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [toggling, setToggling] = useState(null);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const table = useServerTable({ filterKeys: ['isActive'], defaultSortBy: 'name', defaultSortOrder: 'asc' });
  const { queryParams, filters, setFilter } = table;

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
      cellSx: { width: '18%' },
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
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {row.code}
        </Typography>
      ),
    },
    {
      id: 'program',
      label: 'Programs',
      cellSx: { width: '14%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.programs?.map((prog) => prog.code).join(', ') || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'classLevel',
      label: 'Class Level',
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Typography variant="body2">
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
      cellSx: { width: '8%' },
    },
    {
      id: 'instructors',
      label: 'Instructors',
      cellSx: { width: '18%' },
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
      cellSx: { width: '8%' },
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
      cellSx: { width: '12%' },
      renderCell: (row) => {
        const active = row.isActive !== false;
        return (
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            <IconButton
              size="small"
              color="inherit"
              onClick={(e) => {
                e.stopPropagation();
                setEditingCourse(row);
              }}
              aria-label="Edit course"
            >
              <Iconify icon="solar:pen-bold" />
            </IconButton>
            <Can do={PERMISSIONS.EDIT_COURSE}>
              <Tooltip title={active ? 'Disable course' : 'Enable course'}>
                <IconButton
                  size="small"
                  color={active ? 'inherit' : 'success'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setToggling(row);
                  }}
                  aria-label={active ? 'Disable course' : 'Enable course'}
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
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Courses
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage academic courses and curriculum
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 2 }}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpen(true)}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                px: 3,
                boxShadow: theme.customShadows.primary,
                '&:hover': {
                  boxShadow: 'none',
                }
              }}
            >
              Add Course
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:download-fill" />}
              sx={{ px: 3 }}
            >
              Export
            </Button>
          </Stack>
        </Box>

        <Card sx={{ 
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
        }}>
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
              toolbarTitle: 'Courses List',
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
      </Box>

      <AddCourseModal open={open} setOpen={setOpen} />
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
    </Container>
  );
}
