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

import { RolePermissionApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import EditRolePermission from './edit-role-permission';

// ----------------------------------------------------------------------

export default function RolePermissionTableRow({
  selected,
  row,
  handleClick,
}) {
  const { _id: id, role, permissions, isActive, createdBy, createdAt } = row;
  const [open, setOpen] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const { mutate: toggleStatus } = useMutation({
    mutationFn: (newStatus) => RolePermissionApi.updateRolePermission(id, { ...row, isActive: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      enqueueSnackbar('Role permission status updated', { variant: 'success' });
      handleCloseMenu();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Update failed', { variant: 'error' });
    }
  });

  const { mutate: deleteRolePermission } = useMutation({
    mutationFn: () => RolePermissionApi.deleteRolePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      enqueueSnackbar('Role permission deleted successfully', { variant: 'success' });
      handleCloseMenu();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Delete failed', { variant: 'error' });
    }
  });

  const handleEdit = () => {
    setEditModalOpen(true);
    handleCloseMenu();
  };

  const handleToggleStatus = () => {
    toggleStatus(!isActive);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this role permission?')) {
      deleteRolePermission();
    }
  };

  const creatorName = createdBy?.firstName && createdBy?.lastName 
    ? `${createdBy.firstName} ${createdBy.lastName}`
    : createdBy?.email || 'N/A';

  return (
    <>
      <TableRow
        hover
        tabIndex={-1}
        role="checkbox"
        selected={selected}
        sx={{ cursor: 'pointer' }}
      >
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={handleClick} />
        </TableCell>

        <TableCell component="th" scope="row" padding="none">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="subtitle2" noWrap sx={{ textTransform: 'capitalize' }}>
              {role}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{permissions?.length || 0} permissions</Typography>
        </TableCell>

        <TableCell>
          <Label
            color={isActive ? 'success' : 'error'}
          >
            {isActive ? 'Active' : 'Inactive'}
          </Label>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{creatorName}</Typography>
        </TableCell>

        <TableCell align="left">
          {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
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
        <Can do="view_role_permission">
          <MenuItem onClick={handleEdit}>
            <Iconify icon="eva:eye-fill" sx={{ mr: 2 }} />
            View Details
          </MenuItem>
        </Can>

        <Can do="edit_role_permission">
          <MenuItem onClick={handleEdit}>
            <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
            Edit
          </MenuItem>
        </Can>

        <Can do="edit_role_permission">
          <MenuItem onClick={handleToggleStatus} sx={{ color: isActive ? 'error.main' : 'success.main' }}>
            <Iconify icon={isActive ? 'eva:slash-fill' : 'eva:checkmark-circle-2-fill'} sx={{ mr: 2 }} />
            {isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
        </Can>

        <Can do="delete_role_permission">
          <Divider sx={{ borderStyle: 'dashed' }} />
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
            Delete
          </MenuItem>
        </Can>
      </Popover>

      <EditRolePermission 
        open={editModalOpen} 
        setOpen={setEditModalOpen} 
        rolePermission={row} 
      />
    </>
  );
}

RolePermissionTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  handleClick: PropTypes.func,
  selected: PropTypes.any,
};

