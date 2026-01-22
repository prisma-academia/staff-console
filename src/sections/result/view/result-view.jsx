import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import { Box, IconButton } from '@mui/material';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { EventApi } from 'src/api';

import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import AddResultModal from '../add-result';

// ----------------------------------------------------------------------

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
    cellSx: { width: '10%' }
  },
  { 
    id: 'end', 
    label: 'End Date',
    cellSx: { width: '10%' }
  },
  { 
    id: 'category', 
    label: 'Category',
    cellSx: { width: '10%' }
  },
  { 
    id: 'classLevels', 
    label: 'Class Levels',
    cellSx: { width: '15%' },
    renderCell: (row) => row.classLevels?.map((level) => level.name).join(', ') || 'N/A'
  },
  { 
    id: 'programs', 
    label: 'Programs',
    cellSx: { width: '15%' },
    renderCell: (row) => row.programs?.map((prog) => prog.name).join(', ') || 'N/A'
  },
  { 
    id: 'createdBy', 
    label: 'Created By',
    cellSx: { width: '10%' }
  },
  { id: 'action', label: 'Action', cellSx: { width: '10%' } },
];

export default function ResultPage() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: EventApi.getEvents,
  });

  const columnsWithActions = columns.map((column) => {
    if (column.id === 'action') {
      return {
        ...column,
        renderCell: (row) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton color="primary" onClick={() => {
              // Handle action
            }}>
               <Iconify icon="eva:edit-fill" />
            </IconButton>
          </Stack>
        ),
      };
    }
    return column;
  });

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Results Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Download templates and upload student results
            </Typography>
          </Box>
          <AddResultModal open={open} setOpen={setOpen} />
        </Box>

        <Card sx={{ 
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
        }}>
          <GenericTable
            data={data}
            columns={columnsWithActions}
            rowIdField="_id"
            withCheckbox
            withToolbar
            withPagination
            selectable
            isLoading={isLoading}
            emptyRowsHeight={53}
            toolbarProps={{
              searchPlaceholder: 'Search results...',
              toolbarTitle: 'Results List',
            }}
          />
        </Card>
      </Box>
    </Container>
  );
}
