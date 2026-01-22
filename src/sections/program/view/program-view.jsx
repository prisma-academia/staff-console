import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Chip, Dialog, IconButton, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';

import { programApi } from 'src/api';

import Iconify from 'src/components/iconify';
import { GenericTable } from 'src/components/generic-table';

import AddProgram from '../add-program';
import EditProgram from '../edit-program';

// ----------------------------------------------------------------------

export default function ProgramPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['programs'],
    queryFn: () => programApi.getPrograms(),
  });

  const { mutate: deleteProgram, isPending: isDeleting } = useMutation({
    mutationFn: (id) => programApi.deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      enqueueSnackbar('Program deleted successfully', { variant: 'success' });
      setDeleteDialogOpen(false);
      setProgramToDelete(null);
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

  const handleEdit = (programId) => {
    setSelectedProgramId(programId);
    setOpenEdit(true);
  };

  const handleDelete = (program) => {
    setProgramToDelete(program);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (programToDelete) {
      deleteProgram(programToDelete._id);
    }
  };

  const columns = [
    { 
      id: 'name', 
      label: 'Program Name', 
      align: 'left', 
      cellSx: { width: '20%' },
      renderCell: (row) => (
        <Typography variant="subtitle2" noWrap>
          {row.name}
        </Typography>
      )
    },
    { 
      id: 'code', 
      label: 'Code',
      cellSx: { width: '8%' }
    },
    { 
      id: 'type', 
      label: 'Type',
      cellSx: { width: '8%' },
      renderCell: (row) => (
        <Chip 
          label={row.type || 'N/A'} 
          size="small" 
          color={row.type === 'ND' ? 'primary' : 'secondary'}
          variant="outlined"
        />
      )
    },
    { 
      id: 'department', 
      label: 'Department',
      cellSx: { width: '15%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.department?.name || 'N/A'}
        </Typography>
      )
    },
    { 
      id: 'durationInYears', 
      label: 'Duration',
      cellSx: { width: '10%' },
      renderCell: (row) => `${row.durationInYears || 0} Years`
    },
    { 
      id: 'totalCreditsRequired', 
      label: 'Credits',
      cellSx: { width: '10%' }
    },
    { 
      id: 'school', 
      label: 'School',
      cellSx: { width: '12%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.school || 'N/A'}
        </Typography>
      )
    },
    { 
      id: 'isActive', 
      label: 'Status',
      cellSx: { width: '8%' },
      renderCell: (row) => (
        <Chip 
          label={row.isActive ? 'Active' : 'Inactive'} 
          size="small" 
          color={row.isActive ? 'success' : 'default'}
          variant="outlined"
        />
      )
    },
    { 
      id: 'action', 
      label: 'Action', 
      align: 'right',
      cellSx: { width: '9%' },
      renderCell: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <IconButton 
            color="primary" 
            size="small"
            onClick={() => handleEdit(row._id)}
            title="Edit Program"
          >
            <Iconify icon="eva:edit-fill" />
          </IconButton>
          <IconButton 
            color="error" 
            size="small"
            onClick={() => handleDelete(row)}
            title="Delete Program"
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
              Programs
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage academic programs and requirements
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
              Add Program
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
              Error loading programs: {error?.message || 'An error occurred'}
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
              searchPlaceholder: 'Search programs...',
              toolbarTitle: 'Programs List',
            }}
          />
        </Card>
      </Box>

      <AddProgram open={openAdd} setOpen={setOpenAdd} />
      
      {selectedProgramId && (
        <EditProgram 
          open={openEdit} 
          setOpen={setOpenEdit}
          programId={selectedProgramId}
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
          Delete Program
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the program &quot;{programToDelete?.name}&quot;? 
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
