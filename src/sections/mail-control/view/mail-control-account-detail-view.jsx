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
  Table,
  Avatar,
  Button,
  Divider,
  Skeleton,
  TableRow,
  Checkbox,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  TableContainer,
  InputAdornment,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';

import { UserApi, MailAccountApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

export default function MailControlAccountDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { check } = usePermissions();

  const [assignedIds, setAssignedIds] = useState(new Set());
  const [userSearch, setUserSearch] = useState('');

  const { data: account, isLoading } = useQuery({
    queryKey: ['mail-account', id],
    queryFn: () => MailAccountApi.getAccountById(id),
    enabled: Boolean(id),
  });

  const { data: usersRaw, isLoading: loadingUsers } = useQuery({
    queryKey: ['users', 'mail-assign'],
    queryFn: () => UserApi.getUsers('status=active'),
  });
  const users = useMemo(() => (Array.isArray(usersRaw) ? usersRaw : []), [usersRaw]);

  useEffect(() => {
    if (account?.assignedUsers) {
      setAssignedIds(new Set(account.assignedUsers.map((u) => String(u._id || u))));
    } else {
      setAssignedIds(new Set());
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

  const filtered = useMemo(
    () =>
      users.filter((u) =>
        `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''}`
          .toLowerCase()
          .includes(userSearch.toLowerCase())
      ),
    [users, userSearch]
  );

  const canAssign = check(PERMISSIONS.ASSIGN_MAIL_ACCOUNT);

  const toggle = (uid) => {
    if (!canAssign) return;
    setAssignedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const selectAll = () => {
    if (!canAssign) return;
    setAssignedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((u) => next.add(String(u._id)));
      return next;
    });
  };

  const clearAll = () => {
    if (!canAssign) return;
    setAssignedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((u) => next.delete(String(u._id)));
      return next;
    });
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((u) => assignedIds.has(String(u._id)));

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

  if (isLoading || !account) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>{isLoading ? 'Loading…' : 'Account not found'}</Typography>
        {!isLoading && (
          <Button sx={{ mt: 2 }} onClick={() => navigate('/mail-control')}>
            Back
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Button
          startIcon={<Iconify icon="solar:arrow-left-bold-duotone" />}
          onClick={() => navigate('/mail-control')}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {account.name}
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        {/* Account info */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
              <Iconify icon="solar:mailbox-bold-duotone" width={20} sx={{ color: 'primary.main' }} />
              <Typography variant="h6">Account</Typography>
            </Stack>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                  Email
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {account.email}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                  Owner
                </Typography>
                <Typography variant="body2">{account.owner}</Typography>
              </Stack>
              {account.description && (
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                    Description
                  </Typography>
                  <Typography variant="body2">{account.description}</Typography>
                </Stack>
              )}
              <Box sx={{ pt: 0.5 }}>
                <Chip
                  label={account.isActive ? 'Active' : 'Inactive'}
                  color={account.isActive ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Domain info */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
              <Iconify icon="solar:server-bold-duotone" width={20} sx={{ color: 'primary.main' }} />
              <Typography variant="h6">Linked domain</Typography>
            </Stack>
            {domain && typeof domain === 'object' ? (
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                    Domain
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {domain.value}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                    SMTP host
                  </Typography>
                  <Typography variant="body2">{domain.smtpHost || '—'}</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                    SMTP port
                  </Typography>
                  <Typography variant="body2">{domain.smtpPort ?? '—'}</Typography>
                </Stack>
                <Box sx={{ pt: 0.5 }}>
                  <Chip
                    label={smtpComplete ? 'SMTP ready' : 'SMTP incomplete'}
                    color={smtpComplete ? 'success' : 'warning'}
                    size="small"
                    icon={
                      <Iconify
                        icon={
                          smtpComplete
                            ? 'solar:check-circle-bold-duotone'
                            : 'solar:danger-bold-duotone'
                        }
                      />
                    }
                  />
                </Box>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No domain linked. Mail accounts must be linked to a domain to send mail.
              </Typography>
            )}
          </Card>
        </Grid>

        {/* User assignment table */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                  <Iconify
                    icon="solar:users-group-two-rounded-bold-duotone"
                    width={20}
                    sx={{ color: 'primary.main' }}
                  />
                  <Typography variant="h6">Assigned users</Typography>
                  {assignedIds.size > 0 && (
                    <Chip
                      label={`${assignedIds.size} selected`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Only the account owner and users listed here may open this mailbox and send as
                  this address.
                </Typography>
              </Box>
              {canAssign && (
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0, ml: 2 }}>
                  <Button
                    size="small"
                    onClick={selectAll}
                    disabled={allFilteredSelected || filtered.length === 0}
                  >
                    Select all
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={clearAll}
                    disabled={assignedIds.size === 0}
                  >
                    Clear all
                  </Button>
                </Stack>
              )}
            </Stack>

            <TextField
              fullWidth
              size="small"
              placeholder="Search users…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Scrollbar sx={{ maxHeight: 420 }}>
              <TableContainer>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell align="center" sx={{ width: 90, fontWeight: 600 }}>
                        Assigned
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingUsers &&
                      [0, 1, 2, 3].map((i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Skeleton variant="circular" width={32} height={32} />
                              <Skeleton width={120} />
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Skeleton width={180} />
                          </TableCell>
                          <TableCell align="center">
                            <Skeleton
                              variant="circular"
                              width={20}
                              height={20}
                              sx={{ mx: 'auto' }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    {!loadingUsers && filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            {userSearch ? 'No users match your search' : 'No active users found'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {!loadingUsers &&
                      filtered.map((u) => {
                        const uid = String(u._id);
                        const isChecked = assignedIds.has(uid);
                        const fullName =
                          `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
                        const initial = fullName.charAt(0).toUpperCase();

                        return (
                          <TableRow
                            key={uid}
                            hover
                            onClick={() => toggle(uid)}
                            sx={{ cursor: canAssign ? 'pointer' : 'default' }}
                          >
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <Avatar
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    fontSize: 13,
                                    bgcolor: 'primary.lighter',
                                    color: 'primary.dark',
                                  }}
                                >
                                  {initial}
                                </Avatar>
                                <Typography
                                  variant="body2"
                                  fontWeight={isChecked ? 600 : 400}
                                >
                                  {fullName}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {u.email}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Checkbox
                                checked={isChecked}
                                disabled={!canAssign}
                                onChange={() => toggle(uid)}
                                onClick={(e) => e.stopPropagation()}
                                size="small"
                                color="primary"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>

            <Divider sx={{ my: 2 }} />

            {canAssign ? (
              <LoadingButton
                variant="contained"
                loading={assignMutation.isPending}
                onClick={() => assignMutation.mutate([...assignedIds])}
                startIcon={<Iconify icon="solar:diskette-bold-duotone" />}
              >
                Save assignments
              </LoadingButton>
            ) : (
              <Typography variant="caption" color="text.secondary">
                You do not have permission to change assignments.
              </Typography>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
