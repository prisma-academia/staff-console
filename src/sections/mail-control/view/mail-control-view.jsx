import * as Yup from 'yup';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Stack,
  Table,
  Button,
  Dialog,
  Switch,
  Tooltip,
  TableRow,
  MenuItem,
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

import { MailDomainApi, MailAccountApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

import DomainListView from './domain-list-view';

const createAccountSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  localPart: Yup.string().required('Local part is required').matches(/^[^@\s]+$/, 'Invalid local part'),
  domainId: Yup.string().required('Domain is required'),
  description: Yup.string(),
  isActive: Yup.boolean(),
  isPublic: Yup.boolean(),
});

const editAccountSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  description: Yup.string(),
  isActive: Yup.boolean(),
  isPublic: Yup.boolean(),
});

function CreateAccountDialog({ open, onClose, domains, onSaved }) {
  const formik = useFormik({
    initialValues: {
      name: '',
      localPart: '',
      domainId: '',
      description: '',
      isActive: true,
      isPublic: false,
    },
    validationSchema: createAccountSchema,
    onSubmit: async (values, { setSubmitting, resetForm, setStatus }) => {
      try {
        await MailAccountApi.createAccount({
          name: values.name,
          localPart: values.localPart,
          domainId: values.domainId,
          description: values.description,
          isActive: values.isActive,
          isPublic: values.isPublic,
        });
        resetForm();
        onSaved();
        onClose();
      } catch (err) {
        setStatus(err.message || 'Failed to create account');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add mail account</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formik.status && <Typography color="error" variant="body2">{formik.status}</Typography>}
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              fullWidth
              select
              label="Domain"
              name="domainId"
              value={formik.values.domainId}
              onChange={formik.handleChange}
              error={formik.touched.domainId && Boolean(formik.errors.domainId)}
              helperText={formik.touched.domainId && formik.errors.domainId}
            >
              <MenuItem value="">Select domain</MenuItem>
              {domains.map((d) => (
                <MenuItem key={d._id} value={d._id}>{d.value}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Local part (before @)"
              name="localPart"
              value={formik.values.localPart}
              onChange={formik.handleChange}
              placeholder="admissions"
              error={formik.touched.localPart && Boolean(formik.errors.localPart)}
              helperText={formik.touched.localPart && formik.errors.localPart}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              multiline
              rows={2}
            />
            <FormControlLabel
              control={<Switch name="isActive" checked={formik.values.isActive} onChange={formik.handleChange} />}
              label="Active"
            />
            <FormControlLabel
              control={<Switch name="isPublic" checked={formik.values.isPublic} onChange={formik.handleChange} />}
              label="Public (all staff)"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <LoadingButton type="submit" variant="contained" loading={formik.isSubmitting}>
            Create
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

CreateAccountDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  domains: PropTypes.arrayOf(PropTypes.shape({ _id: PropTypes.string, value: PropTypes.string })).isRequired,
  onSaved: PropTypes.func.isRequired,
};

function EditAccountDialog({ open, onClose, account, onSaved }) {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: account?.name || '',
      description: account?.description || '',
      isActive: account?.isActive !== false,
      isPublic: Boolean(account?.isPublic),
    },
    validationSchema: editAccountSchema,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      try {
        await MailAccountApi.updateAccount(account._id, values);
        onSaved();
        onClose();
      } catch (err) {
        setStatus(err.message || 'Failed to save');
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (!account) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit mail account</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formik.status && <Typography color="error" variant="body2">{formik.status}</Typography>}
            <Typography variant="body2" color="text.secondary">Email: {account.email}</Typography>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              multiline
              rows={2}
            />
            <FormControlLabel
              control={<Switch name="isActive" checked={formik.values.isActive} onChange={formik.handleChange} />}
              label="Active"
            />
            <FormControlLabel
              control={<Switch name="isPublic" checked={formik.values.isPublic} onChange={formik.handleChange} />}
              label="Public"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <LoadingButton type="submit" variant="contained" loading={formik.isSubmitting}>
            Save
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

EditAccountDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  account: PropTypes.object,
  onSaved: PropTypes.func.isRequired,
};

export default function MailControlView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { check } = usePermissions();

  const [tab, setTab] = useState('accounts');
  const [createOpen, setCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['mail-accounts'],
    queryFn: MailAccountApi.getAccounts,
  });

  const { data: domains = [] } = useQuery({
    queryKey: ['mail-domains'],
    queryFn: MailDomainApi.getDomains,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => MailAccountApi.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['mail-accounts-mailbox'] });
      enqueueSnackbar('Account deleted', { variant: 'success' });
      setDeleteTarget(null);
    },
    onError: (err) => enqueueSnackbar(err.message, { variant: 'error' }),
  });

  const invalidateMailAccounts = () => {
    queryClient.invalidateQueries({ queryKey: ['mail-accounts'] });
    queryClient.invalidateQueries({ queryKey: ['mail-accounts-mailbox'] });
  };

  const notifyAccountSaved = (isEdit) => {
    invalidateMailAccounts();
    enqueueSnackbar(isEdit ? 'Account updated' : 'Account created', { variant: 'success' });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Mail control</Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Button
          variant={tab === 'accounts' ? 'contained' : 'outlined'}
          onClick={() => setTab('accounts')}
          startIcon={<Iconify icon="solar:mailbox-bold-duotone" />}
        >
          Accounts
        </Button>
        <Button
          variant={tab === 'domains' ? 'contained' : 'outlined'}
          onClick={() => setTab('domains')}
          startIcon={<Iconify icon="solar:global-bold-duotone" />}
        >
          Domains
        </Button>
      </Stack>

      {tab === 'domains' && <DomainListView />}

      {tab === 'accounts' && (
        <>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6">Mail accounts</Typography>
            {check(PERMISSIONS.ADD_MAIL_ACCOUNT) && (
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
                onClick={() => setCreateOpen(true)}
                disabled={!domains.length}
              >
                Add account
              </Button>
            )}
          </Stack>
          {!domains.length && (
            <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
              Create at least one domain before adding mail accounts.
            </Typography>
          )}

          <Card>
            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Domain</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <CircularProgress size={28} />
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading && accounts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                          <Typography variant="body2" color="text.secondary">No mail accounts.</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading && accounts.map((acc) => (
                      <TableRow key={acc._id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{acc.name}</Typography>
                          {acc.description && (
                            <Typography variant="caption" color="text.secondary">{acc.description}</Typography>
                          )}
                        </TableCell>
                        <TableCell><Typography variant="body2">{acc.email}</Typography></TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {acc.domainId?.value || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell><Typography variant="body2">{acc.owner}</Typography></TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            <Chip label={acc.isActive ? 'Active' : 'Inactive'} color={acc.isActive ? 'success' : 'default'} size="small" />
                            <Chip label={acc.isPublic ? 'Public' : 'Private'} size="small" variant="outlined" />
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Manage">
                              <IconButton size="small" onClick={() => navigate(`/mail-control/accounts/${acc._id}`)}>
                                <Iconify icon="solar:settings-bold-duotone" />
                              </IconButton>
                            </Tooltip>
                            {check(PERMISSIONS.EDIT_MAIL_ACCOUNT) && (
                              <Tooltip title="Quick edit">
                                <IconButton size="small" onClick={() => setEditAccount(acc)}>
                                  <Iconify icon="solar:pen-bold-duotone" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {check(PERMISSIONS.DELETE_MAIL_ACCOUNT) && (
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => setDeleteTarget(acc)}>
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

          <CreateAccountDialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            domains={domains}
            onSaved={() => notifyAccountSaved(false)}
          />

          <EditAccountDialog
            open={Boolean(editAccount)}
            onClose={() => setEditAccount(null)}
            account={editAccount}
            onSaved={() => notifyAccountSaved(true)}
          />

          <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs">
            <DialogTitle>Delete mail account</DialogTitle>
            <DialogContent>
              <Typography>
                Delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?
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
        </>
      )}
    </Box>
  );
}
