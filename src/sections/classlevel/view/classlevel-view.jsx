import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Dialog, IconButton, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';

import { classLevelApi } from 'src/api';

import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import AddClassLevel from '../add-classlevel';
import EditClassLevel from '../edit-classlevel';

// ----------------------------------------------------------------------

export default function ClassLevelView() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedClassLevelId, setSelectedClassLevelId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classLevelToDelete, setClassLevelToDelete] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['classlevels'],
    queryFn: () => classLevelApi.getClassLevels(),
  });

  const { mutate: deleteClassLevel, isPending: isDeleting } = useMutation({
    mutationFn: (id) => classLevelApi.deleteClassLevel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classlevels'] });
      enqueueSnackbar('Class level deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      setClassLevelToDelete(null);
    },
    onError: (deleteError) => {
      let errorMessage = 'An error occurred';
      if (deleteError.data?.message) {
        errorMessage = deleteError.data.message;
      } else if (deleteError.message) {
        errorMessage = deleteError.message;
      }
      enqueueSnackbar(errorMessage, { variant: 'error' });
    },
  });

  const handleEdit = (classLevelId) => {
    setSelectedClassLevelId(classLevelId);
    setOpenEdit(true);
  };

  const handleDelete = (classLevel) => {
    setClassLevelToDelete(classLevel);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (classLevelToDelete) {
      deleteClassLevel(classLevelToDelete._id);
    }
  };

  const columns = [
    { 
      id: 'name', 
      label: 'Class Level Name', 
      align: 'left', 
      cellSx: { width: '25%' },
      renderCell: (row) => (
        <Typography variant="subtitle2" noWrap>
          {row.name}
        </Typography>
      )
    },
    { 
      id: 'level', 
      label: 'Level',
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Typography variant="body2">
          {row.level}
        </Typography>
      )
    },
    { 
      id: 'set', 
      label: 'Set',
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Typography variant="body2">
          {row.set}
        </Typography>
      )
    },
    { 
      id: 'createdBy', 
      label: 'Created By',
      cellSx: { width: '20%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.createdBy?.firstName && row.createdBy?.lastName
            ? `${row.createdBy.firstName} ${row.createdBy.lastName}`
            : row.createdBy?.email || 'N/A'}
        </Typography>
      )
    },
    { 
      id: 'createdAt', 
      label: 'Created At',
      cellSx: { width: '15%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
        </Typography>
      )
    },
    { 
      id: 'action', 
      label: 'Action', 
      align: 'right',
      cellSx: { width: '20%' },
      renderCell: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <IconButton 
            color="primary" 
            size="small"
            onClick={() => handleEdit(row._id)}
            title="Edit Class Level"
          >
            <Iconify icon="eva:edit-fill" />
          </IconButton>
          <IconButton 
            color="error" 
            size="small"
            onClick={() => handleDelete(row)}
            title="Delete Class Level"
          >
            <Iconify icon="eva:trash-2-fill" />
          </IconButton>
        </Stack>
      )
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Class Levels
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage class levels (e.g., 100 level, 200 level)
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button 
              variant="contained" 
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpenAdd(true)}
              sx={{ 
                px: 3,
                boxShadow: theme.customShadows.primary,
                '&:hover': {
                  boxShadow: 'none',
                }
              }}
            >
              Add Class Level
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

        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
            <Typography color="error.main">
              Error loading class levels: {error?.message || 'An error occurred'}
            </Typography>
          </Box>
        )}

        <Card sx={{ 
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
        }}>
          <GenericTable
            data={data || []}
            columns={columns}
            rowIdField="_id"
            withCheckbox
            withToolbar
            withPagination
            selectable
            isLoading={isLoading}
            emptyRowsHeight={53}
            toolbarProps={{
              searchPlaceholder: 'Search class levels...',
              toolbarTitle: 'Class Levels List',
            }}
          />
        </Card>
      </Box>

      <AddClassLevel open={openAdd} setOpen={setOpenAdd} />
      
      {selectedClassLevelId && (
        <EditClassLevel 
          open={openEdit} 
          setOpen={setOpenEdit}
          classLevelId={selectedClassLevelId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Class Level
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the class level &quot;{classLevelToDelete?.name}&quot;? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
