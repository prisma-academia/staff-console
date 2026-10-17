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
  useTheme,
  Container,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';

import useServerTable from 'src/hooks/use-server-table';

import { PERMISSIONS } from 'src/permissions/constants';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

import { MemoApi } from '../../../api';
import MemoFormDialog from '../memo-form-dialog';

export default function MemoPage() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  // Memo being edited; null means the dialog creates a new one
  const [editingMemo, setEditingMemo] = useState(null);
  const [memoToDelete, setMemoToDelete] = useState(null);

  const table = useServerTable({ defaultSortBy: 'createdAt', defaultSortOrder: 'desc' });
  const { queryParams } = table;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['memos', 'page', queryParams],
    queryFn: () => MemoApi.getMemosPage(queryParams),
    placeholderData: keepPreviousData,
  });

  const { mutate: deleteMemo, isPending: isDeleting } = useMutation({
    mutationFn: (id) => MemoApi.deleteMemo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      enqueueSnackbar('Memo deleted', { variant: 'success' });
      setMemoToDelete(null);
    },
    onError: (deleteError) => {
      enqueueSnackbar(deleteError.data?.message || deleteError.message || 'Failed to delete memo', { variant: 'error' });
    },
  });

  const rows = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  const openCreate = () => {
    setEditingMemo(null);
    setOpen(true);
  };

  const openEdit = (memo) => {
    setEditingMemo(memo);
    setOpen(true);
  };

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
      label: 'Visibility',
      cellSx: { width: '12%' },
      renderCell: (row) => (
        <Label color={row.isPublic ? 'success' : 'default'}>{row.isPublic ? 'Public' : 'Targeted'}</Label>
      )
    },
    {
      id: 'programs',
      label: 'Program',
      cellSx: { width: '24%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.programs?.map((program) => program.name).join(', ') || 'All'}
        </Typography>
      )
    },
    {
      id: 'classLevels',
      label: 'Class Level',
      cellSx: { width: '24%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.classLevels?.map((level) => level.name).join(', ') || 'All'}
        </Typography>
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      sortable: false,
      cellSx: { width: '15%' },
      renderCell: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Can do={PERMISSIONS.EDIT_MEMO}>
            <Tooltip title="Edit memo">
              <IconButton
                size="small"
                color="inherit"
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(row);
                }}
                aria-label="Edit memo"
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>
          </Can>
          <Can do={PERMISSIONS.DELETE_MEMO}>
            <Tooltip title="Delete memo">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  setMemoToDelete(row);
                }}
                aria-label="Delete memo"
              >
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </Can>
        </Stack>
      ),
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
              Memos
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage school announcements and memos
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 2 }}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={openCreate}
              sx={{
                width: { xs: '100%', sm: 'auto' },
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
            withToolbar
            withPagination
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

      <MemoFormDialog open={open} setOpen={setOpen} memo={editingMemo} />

      {/* Delete confirmation */}
      <Dialog open={!!memoToDelete} onClose={() => !isDeleting && setMemoToDelete(null)}>
        <DialogTitle>Delete memo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{memoToDelete?.name}&quot;? Students will no longer see it.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemoToDelete(null)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={isDeleting}
            onClick={() => deleteMemo(memoToDelete._id)}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
