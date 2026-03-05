import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Box } from '@mui/system';
import LoadingButton from '@mui/lab/LoadingButton';
import {
  Card,
  Grid,
  Stack,
  alpha,
  Button,
  Dialog,
  Tooltip,
  useTheme,
  MenuItem,
  Container,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { listProgrammes, createProgramme, updateProgramme, deleteProgramme } from 'src/api/adminApplicationApi';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

export default function AppProgrammeView() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [openAdd, setOpenAdd] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    code: '',
    price: '',
    acceptanceFee: '',
    duration: '',
    category: '',
    status: 'active',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-programmes'],
    queryFn: async () => {
      const result = await listProgrammes();
      if (!result.ok) throw new Error(result.message);
      return result.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (body) => createProgramme(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-programmes'] });
      enqueueSnackbar('Programme created successfully', { variant: 'success' });
      setOpenAdd(false);
      resetForm();
    },
    onError: (e) => enqueueSnackbar(e.message || 'Failed to create programme', { variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateProgramme(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-programmes'] });
      enqueueSnackbar('Programme updated successfully', { variant: 'success' });
      setEditingProgramme(null);
      resetForm();
    },
    onError: (e) => enqueueSnackbar(e.message || 'Failed to update programme', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProgramme(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-programmes'] });
      enqueueSnackbar('Programme deleted successfully', { variant: 'success' });
      setDeleteConfirm(null);
    },
    onError: (e) => enqueueSnackbar(e.message || 'Failed to delete programme', { variant: 'error' }),
  });

  const resetForm = () => {
    setFormValues({
      name: '',
      code: '',
      price: '',
      acceptanceFee: '',
      duration: '',
      category: '',
      status: 'active',
    });
  };

  const programmes = Array.isArray(data) ? data : [];

  const handleOpenEdit = (row) => {
    setEditingProgramme(row);
    setFormValues({
      name: row.name ?? '',
      code: row.code ?? '',
      price: row.price ?? '',
      acceptanceFee: row.acceptanceFee ?? '',
      duration: row.duration ?? '',
      category: row.category ?? '',
      status: row.status ?? 'active',
    });
  };

  const handleSubmitAdd = () => {
    const { name, code, price, acceptanceFee, duration, category } = formValues;
    if (!name || !code || price === '' || acceptanceFee === '' || !duration || !category) {
      enqueueSnackbar('Name, code, price, acceptance fee, duration and category are required', { variant: 'error' });
      return;
    }
    const numPrice = Number(price);
    const numAcceptanceFee = Number(acceptanceFee);
    if (Number.isNaN(numPrice) || Number.isNaN(numAcceptanceFee)) {
      enqueueSnackbar('Price and acceptance fee must be numbers', { variant: 'error' });
      return;
    }
    createMutation.mutate({
      name: formValues.name.trim(),
      code: formValues.code.trim(),
      price: numPrice,
      acceptanceFee: numAcceptanceFee,
      duration: formValues.duration,
      category: formValues.category.trim(),
      status: formValues.status,
    });
  };

  const handleSubmitEdit = () => {
    if (!editingProgramme?._id) return;
    const { name, code, price, acceptanceFee, duration, category } = formValues;
    if (!name || !code || price === '' || acceptanceFee === '' || !duration || !category) {
      enqueueSnackbar('Name, code, price, acceptance fee, duration and category are required', { variant: 'error' });
      return;
    }
    const numPrice = Number(price);
    const numAcceptanceFee = Number(acceptanceFee);
    if (Number.isNaN(numPrice) || Number.isNaN(numAcceptanceFee)) {
      enqueueSnackbar('Price and acceptance fee must be numbers', { variant: 'error' });
      return;
    }
    updateMutation.mutate({
      id: editingProgramme._id,
      body: {
        name: formValues.name.trim(),
        code: formValues.code.trim(),
        price: numPrice,
        acceptanceFee: numAcceptanceFee,
        duration: formValues.duration,
        category: formValues.category.trim(),
        status: formValues.status,
      },
    });
  };

  const columns = [
    { id: 'name', label: 'Name', cellSx: { width: '20%' }, renderCell: (row) => <Typography variant="subtitle2">{row.name}</Typography> },
    { id: 'code', label: 'Code', cellSx: { width: '12%' }, renderCell: (row) => <Typography variant="body2">{row.code}</Typography> },
    { id: 'price', label: 'Price', cellSx: { width: '12%' }, renderCell: (row) => <Typography variant="body2">{row.price != null ? Number(row.price) : '—'}</Typography> },
    { id: 'acceptanceFee', label: 'Acceptance Fee', cellSx: { width: '12%' }, renderCell: (row) => <Typography variant="body2">{row.acceptanceFee != null ? Number(row.acceptanceFee) : '—'}</Typography> },
    { id: 'duration', label: 'Duration', cellSx: { width: '12%' }, renderCell: (row) => <Typography variant="body2">{row.duration ?? '—'}</Typography> },
    { id: 'category', label: 'Category', cellSx: { width: '12%' }, renderCell: (row) => <Typography variant="body2">{row.category ?? '—'}</Typography> },
    { id: 'status', label: 'Status', cellSx: { width: '8%' }, renderCell: (row) => <Typography variant="body2">{row.status ?? '—'}</Typography> },
    {
      id: 'action',
      label: '',
      cellSx: { width: '12%' },
      renderCell: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Can do="edit_app_programme">
            <Tooltip title="Edit">
              <IconButton onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }} size="small">
                <Iconify icon="eva:edit-fill" />
              </IconButton>
            </Tooltip>
          </Can>
          <Can do="delete_app_programme">
            <Tooltip title="Delete">
              <IconButton onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row); }} size="small" color="error">
                <Iconify icon="eva:trash-2-fill" />
              </IconButton>
            </Tooltip>
          </Can>
        </Stack>
      ),
    },
  ];

  const renderForm = () => (
    <Grid container spacing={2.5} sx={{ pt: 0.5 }}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Name"
          value={formValues.name}
          onChange={(e) => setFormValues((p) => ({ ...p, name: e.target.value }))}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Code"
          value={formValues.code}
          onChange={(e) => setFormValues((p) => ({ ...p, code: e.target.value }))}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Price"
          type="number"
          value={formValues.price}
          onChange={(e) => setFormValues((p) => ({ ...p, price: e.target.value }))}
          inputProps={{ min: 0 }}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Acceptance Fee"
          type="number"
          value={formValues.acceptanceFee}
          onChange={(e) => setFormValues((p) => ({ ...p, acceptanceFee: e.target.value }))}
          inputProps={{ min: 0 }}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Duration"
          value={formValues.duration}
          onChange={(e) => setFormValues((p) => ({ ...p, duration: e.target.value }))}
          placeholder="e.g. 2 years"
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Category"
          value={formValues.category}
          onChange={(e) => setFormValues((p) => ({ ...p, category: e.target.value }))}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          select
          fullWidth
          label="Status"
          value={formValues.status}
          onChange={(e) => setFormValues((p) => ({ ...p, status: e.target.value }))}
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Application Programmes
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage application/admission programmes (application-api)
            </Typography>
          </Box>
          <Can do="add_app_programme">
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => { resetForm(); setOpenAdd(true); }}
              sx={{ px: 3, boxShadow: theme.customShadows?.primary, '&:hover': { boxShadow: 'none' } }}
            >
              Add Programme
            </Button>
          </Can>
        </Box>

        <Card
          sx={{
            boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
            borderRadius: 2,
          }}
        >
          <GenericTable
            data={programmes}
            columns={columns}
            rowIdField="_id"
            withToolbar
            withPagination
            isLoading={isLoading}
            emptyRowsHeight={53}
            toolbarProps={{ searchPlaceholder: 'Search programmes...', toolbarTitle: 'Programmes' }}
          />
        </Card>
      </Box>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Programme</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>{renderForm()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <LoadingButton loading={createMutation.isPending} variant="contained" onClick={handleSubmitAdd}>
            Create
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editingProgramme)} onClose={() => setEditingProgramme(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Programme</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>{renderForm()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingProgramme(null)}>Cancel</Button>
          <LoadingButton loading={updateMutation.isPending} variant="contained" onClick={handleSubmitEdit}>
            Save
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Programme</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <LoadingButton loading={deleteMutation.isPending} color="error" variant="contained" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm._id)}>
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
