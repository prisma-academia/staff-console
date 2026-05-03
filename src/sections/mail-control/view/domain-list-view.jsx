import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Table,
  Button,
  Dialog,
  Switch,
  Tooltip,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';

import { MailDomainApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

const emptyForm = {
  value: '',
  smtpHost: '',
  smtpPort: '587',
  smtpSecure: false,
  smtpUser: '',
  smtpPassword: '',
  smtpFromName: '',
  isActive: true,
};

export default function DomainListView() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { check } = usePermissions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDomain, setEditDomain] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['mail-domains'],
    queryFn: MailDomainApi.getDomains,
  });

  const createMutation = useMutation({
    mutationFn: (body) => MailDomainApi.createDomain(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-domains'] });
      enqueueSnackbar('Domain created', { variant: 'success' });
      closeDialog();
    },
    onError: (err) => enqueueSnackbar(err.message, { variant: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => MailDomainApi.updateDomain(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-domains'] });
      enqueueSnackbar('Domain updated', { variant: 'success' });
      closeDialog();
    },
    onError: (err) => enqueueSnackbar(err.message, { variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => MailDomainApi.deleteDomain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-domains'] });
      enqueueSnackbar('Domain deleted', { variant: 'success' });
      setDeleteTarget(null);
    },
    onError: (err) => enqueueSnackbar(err.message, { variant: 'error' }),
  });

  const openAdd = () => {
    setEditDomain(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (d) => {
    setEditDomain(d);
    setForm({
      value: d.value || '',
      smtpHost: d.smtpHost || '',
      smtpPort: d.smtpPort != null ? String(d.smtpPort) : '',
      smtpSecure: Boolean(d.smtpSecure),
      smtpUser: d.smtpUser || '',
      smtpPassword: d.smtpPassword || '',
      smtpFromName: d.smtpFromName || '',
      isActive: d.isActive !== false,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditDomain(null);
    setForm(emptyForm);
  };

  const toPayload = () => ({
    value: form.value.trim().toLowerCase(),
    smtpHost: form.smtpHost.trim(),
    smtpPort: form.smtpPort === '' ? null : Number(form.smtpPort),
    smtpSecure: form.smtpSecure,
    smtpUser: form.smtpUser.trim(),
    smtpPassword: form.smtpPassword,
    smtpFromName: form.smtpFromName.trim(),
    isActive: form.isActive,
  });

  const handleSubmit = () => {
    const body = toPayload();
    if (!body.value) {
      enqueueSnackbar('Domain value is required', { variant: 'warning' });
      return;
    }
    if (editDomain) {
      updateMutation.mutate({ id: editDomain._id, body });
    } else {
      createMutation.mutate(body);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Domains</Typography>
        {check(PERMISSIONS.ADD_MAIL_ACCOUNT) && (
          <Button variant="contained" startIcon={<Iconify icon="solar:add-circle-bold-duotone" />} onClick={openAdd}>
            Add Domain
          </Button>
        )}
      </Stack>

      <Card>
        <Scrollbar>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Domain</TableCell>
                  <TableCell>SMTP host</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>SMTP ready</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && domains.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">No domains yet.</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && domains.map((d) => (
                  <TableRow key={d._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{d.value}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{d.smtpHost || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={d.isActive ? 'Active' : 'Inactive'}
                        color={d.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={d.smtpComplete ? 'Complete' : 'Incomplete'}
                        color={d.smtpComplete ? 'info' : 'warning'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {check(PERMISSIONS.EDIT_MAIL_ACCOUNT) && (
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(d)}>
                              <Iconify icon="solar:pen-bold-duotone" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {check(PERMISSIONS.DELETE_MAIL_ACCOUNT) && (
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(d)}>
                              <Iconify icon="solar:trash-bin-trash-bold-duotone" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editDomain ? 'Edit Domain' : 'Add Domain'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Domain (e.g. mail.example.edu)"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              disabled={Boolean(editDomain)}
              helperText={editDomain ? 'Domain value cannot be changed' : ''}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="SMTP host"
                  value={form.smtpHost}
                  onChange={(e) => setForm((f) => ({ ...f, smtpHost: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="SMTP port"
                  value={form.smtpPort}
                  onChange={(e) => setForm((f) => ({ ...f, smtpPort: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.smtpSecure}
                      onChange={(e) => setForm((f) => ({ ...f, smtpSecure: e.target.checked }))}
                    />
                  }
                  label="SMTP secure (TLS/SSL)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP user"
                  value={form.smtpUser}
                  onChange={(e) => setForm((f) => ({ ...f, smtpUser: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SMTP password"
                  type="password"
                  value={form.smtpPassword}
                  onChange={(e) => setForm((f) => ({ ...f, smtpPassword: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Default From name (optional)"
                  value={form.smtpFromName}
                  onChange={(e) => setForm((f) => ({ ...f, smtpFromName: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog}>Cancel</Button>
          <LoadingButton
            variant="contained"
            loading={createMutation.isPending || updateMutation.isPending}
            onClick={handleSubmit}
          >
            {editDomain ? 'Save' : 'Create'}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle>Delete domain</DialogTitle>
        <DialogContent>
          <Typography>
            Delete domain <strong>{deleteTarget?.value}</strong>? Accounts using it must be removed or reassigned first.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <LoadingButton
            color="error"
            variant="contained"
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deleteTarget._id)}
          >
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
