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

import AddDocument from '../add-document';

const columns = [
  { 
    id: 'title', 
    label: 'Title', 
    align: 'left', 
    cellSx: { width: '25%' },
    renderCell: (row) => (
      <Typography variant="subtitle2" noWrap>
        {row.title}
      </Typography>
    )
  },
  { 
    id: 'tags', 
    label: 'Tags', 
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Typography variant="body2" color="text.secondary">
        {row.tags?.join(', ') || 'N/A'}
      </Typography>
    )
  },
  { 
    id: 'programs', 
    label: 'Programs', 
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {row.programs?.map((program) => program.code).join(', ') || 'All'}
      </Typography>
    )
  },
  { 
    id: 'classLevels', 
    label: 'Class Levels', 
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2">
        {row.classLevels?.map((classLevel) => classLevel?.name).join(', ') || 'All'}
      </Typography>
    )
  },
  { 
    id: 'size', 
    label: 'Size', 
    cellSx: { width: '10%' } 
  },
];

export default function DocumentPage() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const token = useAuthStore((state) => state.token);

  async function getDocuments() {
    const response = await fetch(`${config.baseUrl}/api/v1/document`, {
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
    queryKey: ['documents'],
    queryFn: getDocuments,
  });

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Documents
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage school documents and resources
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
              Upload Document
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
              searchPlaceholder: 'Search documents...',
              toolbarTitle: 'Documents List',
            }}
          />
        </Card>
      </Box>

      <AddDocument open={open} setOpen={setOpen} />
    </Container>
  );
}
