import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ListItemAvatar from '@mui/material/ListItemAvatar';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ViewGroupModal({ open, onClose, group }) {
  if (!group) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Group Details</Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Basic Information
          </Typography>
          <Card sx={{ p: 3, bgcolor: 'background.neutral' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Group Name
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {group.name}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {group.type || 'custom'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body2">
                    {group.description || 'No description provided'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography 
                    variant="body2" 
                    fontWeight="bold"
                    color={group.isActive ? 'success.main' : 'error.main'}
                  >
                    {group.isActive ? 'Active' : 'Inactive'}
                  </Typography>
                </Stack>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Member Count
                  </Typography>
                  <Typography variant="body2">
                    {group.users?.length || 0} members
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Card>
        </Box>

        <Box>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Members ({group.users?.length || 0})
          </Typography>
          
          <Card sx={{ maxHeight: 300, overflow: 'auto' }}>
            {group.users && group.users.length > 0 ? (
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
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {user.email} • {user.role}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < group.users.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No members in this group
                </Typography>
              </Box>
            )}
          </Card>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ViewGroupModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  group: PropTypes.object,
};

