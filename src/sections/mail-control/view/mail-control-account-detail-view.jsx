import { useSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Grid,
  Stack,
  Button,
  Divider,
  TextField,
  Typography,
  Autocomplete,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';

import { UserApi, MailAccountApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';

export default function MailControlAccountDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { check } = usePermissions();

  const [selectedUsers, setSelectedUsers] = useState([]);

  const { data: account, isLoading } = useQuery({
    queryKey: ['mail-account', id],
    queryFn: () => MailAccountApi.getAccountById(id),
    enabled: Boolean(id),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users', 'mail-assign'],
    queryFn: () => UserApi.getUsers('?status=active'),
  });

  useEffect(() => {
    if (account?.assignedUsers?.length) {
      setSelectedUsers(account.assignedUsers);
    } else {
      setSelectedUsers([]);
    }
  }, [account]);

  const domain = account?.domainId;

  const smtpComplete = useMemo(() => {
    if (!domain || typeof domain !== 'object') return false;
    return Boolean(
      domain.smtpHost
      && domain.smtpPort != null
      && String(domain.smtpUser || '').length
      && String(domain.smtpPassword || '').length
    );
  }, [domain]);

  const assignMutation = useMutation({
    mutationFn: (userIds) => MailAccountApi.setAssignments(id, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-account', id] });
      queryClient.invalidateQueries({ queryKey: ['mail-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['mail-accounts-mailbox'] });
      enqueueSnackbar('Assignments saved', { variant: 'success' });
    },
    onError: (err) => enqueueSnackbar(err.message, { variant: 'error' }),
  });

  const handleSaveAssignments = () => {
    const userIds = selectedUsers.map((u) => u._id);
    assignMutation.mutate(userIds);
  };

  if (isLoading || !account) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>{isLoading ? 'Loading…' : 'Account not found'}</Typography>
        {!isLoading && (
          <Button sx={{ mt: 2 }} onClick={() => navigate('/mail-control')}>Back</Button>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Button startIcon={<Iconify icon="solar:arrow-left-bold-duotone" />} onClick={() => navigate('/mail-control')}>
          Back
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>{account.name}</Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Account</Typography>
            <Stack spacing={1}>
              <Typography variant="body2"><strong>Email:</strong> {account.email}</Typography>
              <Typography variant="body2"><strong>Owner:</strong> {account.owner}</Typography>
              <Typography variant="body2"><strong>Description:</strong> {account.description || '—'}</Typography>
              <Box sx={{ pt: 1 }}>
                <Chip label={account.isActive ? 'Active' : 'Inactive'} color={account.isActive ? 'success' : 'default'} size="small" />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Linked domain</Typography>
            {domain && typeof domain === 'object' ? (
              <Stack spacing={1}>
                <Typography variant="body2"><strong>Domain:</strong> {domain.value}</Typography>
                <Typography variant="body2"><strong>SMTP host:</strong> {domain.smtpHost || '—'}</Typography>
                <Typography variant="body2"><strong>SMTP port:</strong> {domain.smtpPort ?? '—'}</Typography>
                <Typography variant="body2"><strong>Domain active:</strong> {domain.isActive ? 'Yes' : 'No'}</Typography>
                <Chip
                  label={smtpComplete ? 'SMTP configuration complete' : 'SMTP incomplete'}
                  color={smtpComplete ? 'success' : 'warning'}
                  size="small"
                  sx={{ alignSelf: 'flex-start', mt: 1 }}
                />
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No domain linked. Mail accounts must be linked to a domain to be used for mail.
              </Typography>
            )}
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Assigned users</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Only the account owner and users listed here may open this mailbox and send as this address.
          </Typography>
          <Autocomplete
            multiple
            options={users}
            value={selectedUsers}
            onChange={(_, v) => setSelectedUsers(v)}
            getOptionLabel={(u) => `${u.firstName || ''} ${u.lastName || ''} (${u.email})`.trim()}
            isOptionEqualToValue={(a, b) => a._id === b._id}
            renderInput={(params) => <TextField {...params} label="Users" placeholder="Search staff" />}
            disabled={!check(PERMISSIONS.ASSIGN_MAIL_ACCOUNT)}
          />
          <Divider sx={{ my: 2 }} />
          {check(PERMISSIONS.ASSIGN_MAIL_ACCOUNT) ? (
            <LoadingButton variant="contained" loading={assignMutation.isPending} onClick={handleSaveAssignments}>
              Save assignments
            </LoadingButton>
          ) : (
            <Typography variant="caption" color="text.secondary">You do not have permission to change assignments.</Typography>
          )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
