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
  Typography
} from '@mui/material';

import useServerTable from 'src/hooks/use-server-table';

import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import { MemoApi } from '../../../api';
import AddAnnouncementModal from '../add-memo';

const columns = [
  { 
    id: 'name',
    sortKey: 'name',
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
    sortKey: 'isPublic',
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

  const table = useServerTable({ defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });
  const { queryParams } = table;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['memos', 'page', queryParams],
    queryFn: () => MemoApi.getMemosPage(queryParams),
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

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
            toolbarProps={{
              ...table.searchProps,
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
