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

import { listSessions, createSession, updateSession, deleteSession } from 'src/api/adminApplicationApi';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

export default function AppSessionView() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [openAdd, setOpenAdd] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    startDate: '',
    endDate: '',
    closingDate: '',
    announcement: '',
    status: 'active',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const result = await listSessions();
      if (!result.ok) throw new Error(result.message);
      return result.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (body) => createSession(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      enqueueSnackbar('Session created successfully', { variant: 'success' });
      setOpenAdd(false);
      resetForm();
    },
    onError: (e) => enqueueSnackbar(e.message || 'Failed to create session', { variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => updateSession(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      enqueueSnackbar('Session updated successfully', { variant: 'success' });
      setEditingSession(null);
      resetForm();
    },
    onError: (e) => enqueueSnackbar(e.message || 'Failed to update session', { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      enqueueSnackbar('Session deleted successfully', { variant: 'success' });
      setDeleteConfirm(null);
    },
    onError: (e) => enqueueSnackbar(e.message || 'Failed to delete session', { variant: 'error' }),
  });

  const resetForm = () => {
    setFormValues({
      name: '',
      startDate: '',
      endDate: '',
      closingDate: '',
      announcement: '',
      status: 'active',
    });
  };

  const sessions = Array.isArray(data) ? data : [];

  const handleOpenEdit = (row) => {
    setEditingSession(row);
    setFormValues({
      name: row.name ?? '',
      startDate: row.startDate ? new Date(row.startDate).toISOString().slice(0, 16) : '',
      endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0, 16) : '',
      closingDate: row.closingDate ? new Date(row.closingDate).toISOString().slice(0, 16) : '',
      announcement: row.announcement ?? '',
      status: row.status ?? 'active',
    });
  };

  const handleSubmitAdd = () => {
    if (!formValues.name || !formValues.startDate || !formValues.endDate || !formValues.closingDate || !formValues.announcement) {
      enqueueSnackbar('Name, start date, end date, closing date and announcement are required', { variant: 'error' });
      return;
    }
    createMutation.mutate({
      name: formValues.name,
      startDate: new Date(formValues.startDate).toISOString(),
      endDate: new Date(formValues.endDate).toISOString(),
      closingDate: new Date(formValues.closingDate).toISOString(),
      announcement: formValues.announcement,
      status: formValues.status,
    });
  };

  const handleSubmitEdit = () => {
    if (!editingSession?._id) return;
    if (!formValues.name || !formValues.startDate || !formValues.endDate || !formValues.closingDate || !formValues.announcement) {
      enqueueSnackbar('Name, start date, end date, closing date and announcement are required', { variant: 'error' });
      return;
    }
    updateMutation.mutate({
      id: editingSession._id,
      body: {
        name: formValues.name,
        startDate: new Date(formValues.startDate).toISOString(),
        endDate: new Date(formValues.endDate).toISOString(),
        closingDate: new Date(formValues.closingDate).toISOString(),
        announcement: formValues.announcement,
        status: formValues.status,
      },
    });
  };

  const columns = [
    { id: 'name', label: 'Name', cellSx: { width: '18%' }, renderCell: (row) => <Typography variant="subtitle2">{row.name}</Typography> },
    { id: 'startDate', label: 'Start Date', cellSx: { width: '14%' }, renderCell: (row) => formatDate(row.startDate) },
    { id: 'endDate', label: 'End Date', cellSx: { width: '14%' }, renderCell: (row) => formatDate(row.endDate) },
    { id: 'closingDate', label: 'Closing Date', cellSx: { width: '14%' }, renderCell: (row) => formatDate(row.closingDate) },
    { id: 'status', label: 'Status', cellSx: { width: '10%' }, renderCell: (row) => <Typography variant="body2">{row.status ?? '—'}</Typography> },
    {
      id: 'action',
      label: '',
      cellSx: { width: '14%' },
      renderCell: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Can do="edit_app_session">
            <Tooltip title="Edit">
              <IconButton onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }} size="small">
                <Iconify icon="eva:edit-fill" />
              </IconButton>
            </Tooltip>
          </Can>
          <Can do="delete_app_session">
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
      <Grid item xs={12}>
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
          label="Start Date"
          type="datetime-local"
          value={formValues.startDate}
          onChange={(e) => setFormValues((p) => ({ ...p, startDate: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="End Date"
          type="datetime-local"
          value={formValues.endDate}
          onChange={(e) => setFormValues((p) => ({ ...p, endDate: e.target.value }))}
          InputLabelProps={{ shrink: true }}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Closing Date"
          type="datetime-local"
          value={formValues.closingDate}
          onChange={(e) => setFormValues((p) => ({ ...p, closingDate: e.target.value }))}
          InputLabelProps={{ shrink: true }}
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
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Announcement"
          value={formValues.announcement}
          onChange={(e) => setFormValues((p) => ({ ...p, announcement: e.target.value }))}
          multiline
          rows={3}
          required
        />
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Application Sessions
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage application/admission sessions (application-api)
            </Typography>
          </Box>
          <Can do="add_app_session">
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => { resetForm(); setOpenAdd(true); }}
              sx={{ px: 3, boxShadow: theme.customShadows?.primary, '&:hover': { boxShadow: 'none' } }}
            >
              Add Session
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
            data={sessions}
            columns={columns}
            rowIdField="_id"
            withToolbar
            withPagination
            isLoading={isLoading}
            emptyRowsHeight={53}
            toolbarProps={{ searchPlaceholder: 'Search sessions...', toolbarTitle: 'Sessions' }}
          />
        </Card>
      </Box>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Session</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>{renderForm()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <LoadingButton loading={createMutation.isPending} variant="contained" onClick={handleSubmitAdd}>
            Create
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editingSession)} onClose={() => setEditingSession(null)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Session</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>{renderForm()}</DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingSession(null)}>Cancel</Button>
          <LoadingButton loading={updateMutation.isPending} variant="contained" onClick={handleSubmitEdit}>
            Save
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Session</DialogTitle>
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
