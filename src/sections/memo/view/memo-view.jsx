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

import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import { MemoApi } from '../../../api';
import AddAnnouncementModal from '../add-memo';

const columns = [
  { 
    id: 'name', 
    label: 'Memo', 
    align: 'left', 
    cellSx: { width: '25%' },
    renderCell: (row) => (
      <Typography textTransform="capitalize" variant="subtitle2" noWrap>
        {row.name}
      </Typography>
    )
  },
  { 
    id: 'published', 
    label: 'Published', 
    cellSx: { width: '15%' },
    renderCell: (row) => (row.published ? 'True' : 'False')
  },
  { 
    id: 'programs', 
    label: 'Program', 
    cellSx: { width: '25%' },
    renderCell: (row) => (
      <Typography variant="body2" noWrap>
        {row.programs?.map((program) => program.name).join(', ') || 'All'}
      </Typography>
    )
  },
  { 
    id: 'classLevels', 
    label: 'Class Level', 
    cellSx: { width: '25%' },
    renderCell: (row) => (
      <Typography variant="body2" noWrap>
        {row.classLevels?.map((level) => level.name).join(', ') || 'All'}
      </Typography>
    )
  },
];

export default function MemoPage() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const { data, loading: isLoading } = useQuery({
    queryKey: ['memos'],
    queryFn: MemoApi.getMemos,
  });

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Memos
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage school announcements and memos
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
              Add Memo
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
              searchPlaceholder: 'Search memos...',
              toolbarTitle: 'Memos List',
            }}
          />
        </Card>
      </Box>

      <AddAnnouncementModal open={open} setOpen={setOpen} />
    </Container>
  );
}
