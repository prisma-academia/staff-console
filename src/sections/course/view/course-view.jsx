import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { Box } from '@mui/system';
import {
  Card,
  Stack,
  alpha,
  Button,
  useTheme,
  Container,
  Typography,
  IconButton,
} from '@mui/material';

import useServerTable from 'src/hooks/use-server-table';

import { courseApi } from 'src/api';

import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import AddCourseModal from '../add-course';
import EditCourseModal from '../edit-course';

export default function CoursePage() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  const table = useServerTable({ defaultSortBy: 'name', defaultSortOrder: 'asc' });
  const { queryParams } = table;

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
      id: 'actions',
      label: 'Actions',
      align: 'right',
      sortable: false,
      cellSx: { width: '12%' },
      renderCell: (row) => (
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
      ),
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Courses
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage academic courses and curriculum
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button 
              variant="contained" 
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpen(true)}
              sx={{ 
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
            withCheckbox
            withToolbar
            withPagination
            selectable
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            count={total}
            {...table.tableProps}
            emptyRowsHeight={53}
            initialSort={{ orderBy: 'name', order: 'asc' }}
            toolbarProps={{
              ...table.searchProps,
              searchPlaceholder: 'Search courses...',
              toolbarTitle: 'Courses List',
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
    </Container>
  );
}
