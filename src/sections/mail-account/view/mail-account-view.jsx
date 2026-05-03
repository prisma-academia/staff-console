import * as Yup from 'yup';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
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

import { useAuthStore } from 'src/store';
import { MailAccountApi } from 'src/api';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

const accountSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  description: Yup.string(),
  isActive: Yup.boolean(),
});

function AccountDialog({ open, onClose, account, onSaved }) {
  const { user } = useAuthStore();
  const isEdit = Boolean(account);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: account?.name || '',
      email: account?.email || '',
      description: account?.description || '',
      isActive: account?.isActive !== undefined ? account.isActive : true,
    },
    validationSchema: accountSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        if (isEdit) {
          await MailAccountApi.updateAccount(account._id, values);
        } else {
          await MailAccountApi.createAccount({ ...values, owner: user?.email });
        }
        resetForm();
        onSaved();
        onClose();
      } catch (err) {
        formik.setStatus(err.message || 'Failed to save account');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Mail Account' : 'Add Mail Account'}</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formik.status && (
              <Typography variant="body2" color="error">{formik.status}</Typography>
            )}
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
              label="Email Address"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              disabled={isEdit}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
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
            {isEdit ? 'Save Changes' : 'Create Account'}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

AccountDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  account: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    description: PropTypes.string,
    isActive: PropTypes.bool,
  }),
  onSaved: PropTypes.func.isRequired,
};

export default function MailAccountView() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['mail-accounts'],
    queryFn: MailAccountApi.getAccounts,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => MailAccountApi.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-accounts'] });
      enqueueSnackbar('Account deleted', { variant: 'success' });
      setDeleteTarget(null);
    },
    onError: (err) => enqueueSnackbar(err.message, { variant: 'error' }),
  });

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ['mail-accounts'] });
    enqueueSnackbar(editAccount ? 'Account updated' : 'Account created', { variant: 'success' });
  };

  const openAdd = () => { setEditAccount(null); setDialogOpen(true); };
  const openEdit = (acc) => { setEditAccount(acc); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditAccount(null); };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4">Mail Accounts</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
          onClick={openAdd}
        >
          Add Account
        </Button>
      </Stack>

      <Card>
        <Scrollbar>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
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
                      <Typography variant="body2" color="text.secondary">
                        No mail accounts yet. Click &quot;Add Account&quot; to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && accounts.map((acc) => (
                  <TableRow key={acc._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{acc.name}</Typography>
                      {acc.description && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{acc.description}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{acc.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{acc.owner}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={acc.isActive ? 'Active' : 'Inactive'}
                        color={acc.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {new Date(acc.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(acc)}>
                            <Iconify icon="solar:pen-bold-duotone" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteTarget(acc)}>
                            <Iconify icon="solar:trash-bin-trash-bold-duotone" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Card>

      <AccountDialog
        open={dialogOpen}
        onClose={closeDialog}
        account={editAccount}
        onSaved={handleSaved}
      />

      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} maxWidth="xs">
        <DialogTitle>Delete Mail Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <LoadingButton
            variant="contained"
            color="error"
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
