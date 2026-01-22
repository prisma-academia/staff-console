import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Popover, Divider, MenuItem, IconButton } from '@mui/material';

import { RolePermissionApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

import AddRolePermission from '../add-role-permission';
import EditRolePermission from '../edit-role-permission';

// ----------------------------------------------------------------------

const RolePermissionActions = ({ row }) => {
  const { _id: id, isActive } = row;
  const [open, setOpen] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

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

  return (
    <>
      <IconButton onClick={(e) => {
          e.stopPropagation();
          setOpen(e.currentTarget);
      }}>
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton>

      <Popover
        open={!!open}
        anchorEl={open}
        onClose={(e) => {
            e.stopPropagation();
            setOpen(null);
        }}
        onClick={(e) => e.stopPropagation()}
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
};

RolePermissionActions.propTypes = {
  row: PropTypes.object,
};

const columns = [
  { 
    id: 'role', 
    label: 'Role', 
    align: 'left', 
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Typography variant="subtitle2" noWrap sx={{ textTransform: 'capitalize' }}>
        {row.role}
      </Typography>
    )
  },
  { 
    id: 'permissions', 
    label: 'Permissions',
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Typography variant="body2">{row.permissions?.length || 0} permissions</Typography>
    )
  },
  { 
    id: 'isActive', 
    label: 'Status',
    cellSx: { width: '15%' },
    renderCell: (row) => (
      <Label color={row.isActive ? 'success' : 'error'}>
        {row.isActive ? 'Active' : 'Inactive'}
      </Label>
    )
  },
  { 
    id: 'createdBy', 
    label: 'Created By',
    cellSx: { width: '20%' },
    renderCell: (row) => {
      const creatorName = row.createdBy?.firstName && row.createdBy?.lastName 
        ? `${row.createdBy.firstName} ${row.createdBy.lastName}`
        : row.createdBy?.email || 'N/A';
      return <Typography variant="body2">{creatorName}</Typography>;
    }
  },
  { 
    id: 'createdAt', 
    label: 'Created At',
    cellSx: { width: '15%' },
    renderCell: (row) => (
      row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'
    )
  },
  { 
    id: 'action', 
    label: '', 
    cellSx: { width: '5%' },
    renderCell: (row) => <RolePermissionActions row={row} />
  },
];

export default function RolePermissionView() {
  const theme = useTheme();
  const [openAddModal, setOpenAddModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: () => RolePermissionApi.getRolePermissions(),
  });

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Role Permission Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage role permissions and access controls
            </Typography>
          </Box>
          <Can do="add_role_permission">
            <AddRolePermission open={openAddModal} setOpen={setOpenAddModal} />
          </Can>
        </Box>

        <Card sx={{ 
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
        }}>
          <GenericTable
            data={data}
            columns={columns}
            rowIdField="_id"
            withCheckbox
            withToolbar
            withPagination
            selectable
            isLoading={isLoading}
            emptyRowsHeight={53}
            toolbarProps={{
              searchPlaceholder: 'Search roles...',
              toolbarTitle: 'Roles List',
            }}
          />
        </Card>
      </Box>
    </Container>
  );
}
