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
  Grid,
  Menu,
  Stack,
  Alert,
  Table,
  Button,
  Dialog,
  Switch,
  MenuItem,
  Skeleton,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Container,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  FormControlLabel,
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
});

const editAccountSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  description: Yup.string(),
  isActive: Yup.boolean(),
});

function CreateAccountDialog({ open, onClose, domains, onSaved }) {
  const formik = useFormik({
    initialValues: {
      name: '',
      localPart: '',
      domainId: '',
      description: '',
      isActive: true,
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add mail account</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formik.status && (
              <Typography color="error" variant="body2">
                {formik.status}
              </Typography>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
              </Grid>
              <Grid item xs={12}>
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
                    <MenuItem key={d._id} value={d._id}>
                      {d.value}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      name="isActive"
                      checked={formik.values.isActive}
                      onChange={formik.handleChange}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
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
  domains: PropTypes.arrayOf(PropTypes.shape({ _id: PropTypes.string, value: PropTypes.string }))
    .isRequired,
  onSaved: PropTypes.func.isRequired,
};

function EditAccountDialog({ open, onClose, account, onSaved }) {
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: account?.name || '',
      description: account?.description || '',
      isActive: account?.isActive !== false,
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
            {formik.status && (
              <Typography color="error" variant="body2">
                {formik.status}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Email: <strong>{account.email}</strong>
            </Typography>
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
              control={
                <Switch
                  name="isActive"
                  checked={formik.values.isActive}
                  onChange={formik.handleChange}
                />
              }
              label="Active"
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

function AccountRowMenu({ account, onEdit, onManage, onDelete, canEdit, canDelete }) {
  const [anchor, setAnchor] = useState(null);
  const open = Boolean(anchor);

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        PaperProps={{ sx: { minWidth: 160 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onManage(account);
          }}
        >
          <Iconify icon="solar:settings-bold-duotone" sx={{ mr: 1.5, color: 'text.secondary' }} />
          Manage
        </MenuItem>
        {canEdit && (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              onEdit(account);
            }}
          >
            <Iconify icon="solar:pen-bold-duotone" sx={{ mr: 1.5, color: 'text.secondary' }} />
            Quick edit
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              onDelete(account);
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold-duotone" sx={{ mr: 1.5 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

AccountRowMenu.propTypes = {
  account: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  onManage: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.bool,
};

const TABS = [
  { key: 'accounts', label: 'Accounts', icon: 'solar:mailbox-bold-duotone' },
  { key: 'domains', label: 'Domains', icon: 'solar:global-bold-duotone' },
];

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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Mail control
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage mail accounts and SMTP domain configuration.
          </Typography>
        </Box>
        {tab === 'accounts' && check(PERMISSIONS.ADD_MAIL_ACCOUNT) && (
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

      {/* Tab nav */}
      <Stack direction="row" spacing={0.5} sx={{ mb: 3 }}>
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? 'contained' : 'outlined'}
            startIcon={<Iconify icon={t.icon} />}
            onClick={() => setTab(t.key)}
            sx={{ borderRadius: 2 }}
          >
            {t.label}
          </Button>
        ))}
      </Stack>

      {/* Domains tab */}
      {tab === 'domains' && <DomainListView />}

      {/* Accounts tab */}
      {tab === 'accounts' && (
        <>
          {!domains.length && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Create at least one domain before adding mail accounts. Go to the{' '}
              <Button
                size="small"
                onClick={() => setTab('domains')}
                sx={{ p: 0, minWidth: 0, verticalAlign: 'baseline', textDecoration: 'underline' }}
              >
                Domains
              </Button>{' '}
              tab to get started.
            </Alert>
          )}

          <Card>
            <Scrollbar>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Domain</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Owner</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading &&
                      [0, 1, 2, 3].map((i) => (
                        <TableRow key={i}>
                          {[0, 1, 2, 3, 4, 5].map((c) => (
                            <TableCell key={c}>
                              <Skeleton />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}

                    {!isLoading && accounts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Box sx={{ py: 6, textAlign: 'center' }}>
                            <Iconify
                              icon="solar:mailbox-bold-duotone"
                              sx={{ width: 52, height: 52, color: 'text.disabled', mb: 1 }}
                            />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              No mail accounts
                            </Typography>
                            <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
                              Add an account to manage inbound and outbound mail.
                            </Typography>
                            {check(PERMISSIONS.ADD_MAIL_ACCOUNT) && domains.length > 0 && (
                              <Button
                                variant="contained"
                                startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
                                onClick={() => setCreateOpen(true)}
                              >
                                Add account
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}

                    {!isLoading &&
                      accounts.map((acc) => (
                        <TableRow key={acc._id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">{acc.name}</Typography>
                            {acc.description && (
                              <Typography variant="caption" color="text.secondary">
                                {acc.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{acc.email}</Typography>
                          </TableCell>
                          <TableCell>
                            {acc.domainId?.value ? (
                              <Chip
                                label={acc.domainId.value}
                                size="small"
                                variant="outlined"
                                icon={<Iconify icon="solar:global-bold-duotone" />}
                              />
                            ) : (
                              <Typography variant="body2" color="text.disabled">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {acc.owner}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={acc.isActive ? 'Active' : 'Inactive'}
                              color={acc.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <AccountRowMenu
                              account={acc}
                              onManage={(a) => navigate(`/mail-control/accounts/${a._id}`)}
                              onEdit={(a) => setEditAccount(a)}
                              onDelete={(a) => setDeleteTarget(a)}
                              canEdit={check(PERMISSIONS.EDIT_MAIL_ACCOUNT)}
                              canDelete={check(PERMISSIONS.DELETE_MAIL_ACCOUNT)}
                            />
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
                Delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})? This action
                cannot be undone.
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
    </Container>
  );
}
