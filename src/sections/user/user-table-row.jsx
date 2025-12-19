import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { UserApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import EditUser from './edit-user';
import ResetPasswordModal from './reset-password-modal';

// ----------------------------------------------------------------------

export default function UserTableRow({
  selected,
  row,
  handleClick,
}) {
  const { _id: id, firstName, lastName, email, gender, lastLogin, role, status } = row;
  const fullName = `${firstName} ${lastName}`;
  const [open, setOpen] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openResetModal, setOpenResetModal] = useState(false);
  
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const { mutate: updateStatus } = useMutation({
    mutationFn: (newStatus) => UserApi.updateUser(id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User status updated', { variant: 'success' });
      handleCloseMenu();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Update failed', { variant: 'error' });
    }
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: () => UserApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
      handleCloseMenu();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Delete failed', { variant: 'error' });
    }
  });

  const handleEdit = () => {
    setOpenEditModal(true);
    handleCloseMenu();
  };

  const handleResetPassword = () => {
    setOpenResetModal(true);
    handleCloseMenu();
  };

  const handleStatusToggle = () => {
    const newStatus = status === 'active' ? 'disable' : 'active';
    updateStatus(newStatus);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser();
    }
  };

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={handleClick} />
        </TableCell>

        <TableCell component="th" scope="row" padding="none">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="subtitle2" noWrap>
              {fullName}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>{email}</TableCell>

        <TableCell>{gender}</TableCell>

        <TableCell sx={{ textTransform: 'capitalize' }}>{role}</TableCell>

        <TableCell>
          <Label
            color={
              (status === 'disable' && 'error') || 
              (status === 'pending' && 'warning') || 
              'success'
            }
          >
            {status}
          </Label>
        </TableCell>

        <TableCell align="left">
          {lastLogin ? new Date(lastLogin).toLocaleString() : 'Never'}
        </TableCell>

        <TableCell align="right">
          <IconButton onClick={handleOpenMenu}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { width: 160 },
        }}
      >
        <Can do="edit_user">
          <MenuItem onClick={handleEdit}>
            <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
            Edit
          </MenuItem>
        </Can>

        <Can do="reset_user_password">
          <MenuItem onClick={handleResetPassword}>
            <Iconify icon="eva:lock-fill" sx={{ mr: 2 }} />
            Reset Password
          </MenuItem>
        </Can>

        <Can do="edit_user">
          <MenuItem onClick={handleStatusToggle} sx={{ color: status === 'active' ? 'error.main' : 'success.main' }}>
            <Iconify icon={status === 'active' ? 'eva:slash-fill' : 'eva:checkmark-circle-2-fill'} sx={{ mr: 2 }} />
            {status === 'active' ? 'Suspend' : 'Activate'}
          </MenuItem>
        </Can>

        <Can do="delete_user">
          <Divider sx={{ borderStyle: 'dashed' }} />
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
            Delete
          </MenuItem>
        </Can>
      </Popover>

      <EditUser 
        open={openEditModal} 
        setOpen={setOpenEditModal} 
        user={row}
      />

      <ResetPasswordModal 
        open={openResetModal} 
        setOpen={setOpenResetModal} 
        userId={id} 
        userEmail={email} 
      />
    </>
  );
}

UserTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  handleClick: PropTypes.func,
  selected: PropTypes.any,
};

