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

import { EventApi } from 'src/api';

import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import AddCalenderModal from '../add-calender';

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
    id: 'start', 
    label: 'Start Date', 
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {row.start}
      </Typography>
    )
  },
  { 
    id: 'end', 
    label: 'End Date', 
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {row.end}
      </Typography>
    )
  },
  { 
    id: 'category', 
    label: 'Category', 
    cellSx: { width: '10%' },
    renderCell: (row) => (
      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
        {row.category}
      </Typography>
    )
  },
  { 
    id: 'classLevels', 
    label: 'Class Levels', 
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2" noWrap>
        {row.classLevels?.map((level) => level.name).join(', ') || 'All'}
      </Typography>
    )
  },
  { 
    id: 'programs', 
    label: 'Programs', 
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2" noWrap>
        {row.programs?.map((prog) => prog.name).join(', ') || 'All'}
      </Typography>
    )
  },
  { 
    id: 'createdBy', 
    label: 'Created By', 
    cellSx: { width: '10%' } 
  },
];

export default function CalenderPage() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: EventApi.getEvents,
  });

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Calendar Events
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage school calendar events and schedules
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
              Add Event
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
              searchPlaceholder: 'Search events...',
              toolbarTitle: 'Events List',
            }}
          />
        </Card>
      </Box>

      <AddCalenderModal open={open} setOpen={setOpen} />
    </Container>
  );
}
