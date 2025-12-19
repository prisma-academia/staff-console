import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import CircularProgress from '@mui/material/CircularProgress';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';

import { UserApi, userGroupApi } from 'src/api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ManageMembersModal({ open, onClose, group }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Fetch all users for the search dropdown
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => UserApi.getUsers(),
    enabled: open,
  });

  // Filter out users who are already in the group
  const availableUsers = useMemo(() => {
    if (!allUsers || !group?.users) return [];
    const memberIds = new Set(group.users.map(u => u._id));
    return allUsers.filter(u => !memberIds.has(u._id));
  }, [allUsers, group]);

  const { mutate: addMembers, isPending: adding } = useMutation({
    mutationFn: (userIds) => userGroupApi.addMembers(group._id, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      enqueueSnackbar('Members added successfully', { variant: 'success' });
      setSelectedUsers([]);
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to add members', { variant: 'error' });
    },
  });

  const { mutate: removeMembers, isPending: removing } = useMutation({
    mutationFn: (userIds) => userGroupApi.removeMembers(group._id, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      enqueueSnackbar('Member removed successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to remove member', { variant: 'error' });
    },
  });

  const handleAddMembers = () => {
    if (selectedUsers.length === 0) return;
    const userIds = selectedUsers.map(u => u._id);
    addMembers(userIds);
  };

  const handleRemoveMember = (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      removeMembers([userId]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Manage Members: {group?.name}</Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Add New Members
          </Typography>
          <Stack direction="row" spacing={1}>
            <Autocomplete
              multiple
              fullWidth
              size="small"
              options={availableUsers}
              getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.email})`}
              value={selectedUsers}
              onChange={(event, newValue) => setSelectedUsers(newValue)}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  placeholder="Search users to add..." 
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {usersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              sx={{ flexGrow: 1 }}
            />
            <Button 
              variant="contained" 
              onClick={handleAddMembers}
              disabled={selectedUsers.length === 0 || adding}
            >
              Add
            </Button>
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Current Members ({group?.users?.length || 0})
          </Typography>
          
          <Card sx={{ maxHeight: 350, overflow: 'auto' }}>
            {group?.users && group.users.length > 0 ? (
              <List disablePadding>
                {group.users.map((user, index) => (
                  <Box key={user._id || index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                          {user.firstName?.charAt(0) || user.email?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${user.firstName || ''} ${user.lastName || ''}`}
                        secondary={user.email}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Remove from group">
                          <IconButton 
                            edge="end" 
                            color="error" 
                            onClick={() => handleRemoveMember(user._id)}
                            disabled={removing}
                          >
                            <Iconify icon="solar:user-minus-bold" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < group.users.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No members in this group
                </Typography>
              </Box>
            )}
          </Card>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ManageMembersModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  group: PropTypes.object,
};

