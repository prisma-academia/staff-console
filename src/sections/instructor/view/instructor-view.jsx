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

import config from 'src/config';
import { useAuthStore } from 'src/store';

import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import AddInstructorModal from '../add-instructor';

const columns = [
  { 
    id: 'employeeId', 
    label: 'ID', 
    align: 'left', 
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="subtitle2" noWrap>
        {row.employeeId}
      </Typography>
    )
  },
  { 
    id: 'fullname', 
    label: 'Full Name', 
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {`${row.personalInfo?.firstName} ${row.personalInfo?.lastName}`}
      </Typography>
    )
  },
  { 
    id: 'department', 
    label: 'Department', 
    cellSx: { width: '20%' } 
  },
  { 
    id: 'phone', 
    label: 'Phone Number', 
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {row.contactInfo?.phone || 'N/A'}
      </Typography>
    )
  },
  { 
    id: 'gender', 
    label: 'Gender', 
    cellSx: { width: '10%' },
    renderCell: (row) => (
      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
        {row.personalInfo?.gender || 'N/A'}
      </Typography>
    )
  },
];

export default function InstructorPage() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const token = useAuthStore((state) => state.token);

  async function getInstructor() {
    const response = await fetch(`${config.baseUrl}/api/v1/instructor/instructors`, {
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (result.ok) {
      return result.data;
    }
    throw new Error(result.message);
  }

  const { data, isLoading } = useQuery({
    queryKey: ['instructors'],
    queryFn: getInstructor,
  });

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Instructors
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage school instructors and faculty
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
              Add Instructor
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
              searchPlaceholder: 'Search instructors...',
              toolbarTitle: 'Instructors List',
            }}
          />
        </Card>
      </Box>

      <AddInstructorModal open={open} setOpen={setOpen}/>
    </Container>
  );
}
