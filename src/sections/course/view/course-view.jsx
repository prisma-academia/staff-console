import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Box } from '@mui/system';
import { 
  Card, 
  Stack, 
  alpha, 
  Button,
  useTheme,
  Container,
  Typography
} from '@mui/material';

import { courseApi } from 'src/api';

import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import AddCourseModal from '../add-course';

const columns = [
  { 
    id: 'title', 
    label: 'Title', 
    align: 'left', 
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Typography variant="subtitle2" noWrap>
        {row.title}
      </Typography>
    )
  },
  { 
    id: 'code', 
    label: 'Code', 
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
        {row.code}
      </Typography>
    )
  },
  { 
    id: 'program', 
    label: 'Programs', 
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Typography variant="body2" noWrap>
        {row.programs?.map((prog) => prog.code).join(', ') || 'N/A'}
      </Typography>
    )
  },
  { 
    id: 'classLevel', 
    label: 'Class Levels', 
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {row.classLevel?.name || 'N/A'}
      </Typography>
    )
  },
  { 
    id: 'semester', 
    label: 'Semester', 
    cellSx: { width: '10%' } 
  },
  { 
    id: 'credit', 
    label: 'Credit', 
    cellSx: { width: '10%' } 
  },
];

export default function CoursePage() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: courseApi.getCourses,
  });

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
            data={data}
            columns={columns}
            rowIdField="_id"
            withCheckbox
            withToolbar
            withPagination
            selectable
            isLoading={isLoading}
            emptyRowsHeight={53}
            toolbarProps={{
              searchPlaceholder: 'Search courses...',
              toolbarTitle: 'Courses List',
            }}
          />
        </Card>
      </Box>

      <AddCourseModal open={open} setOpen={setOpen}/>
    </Container>
  );
}
