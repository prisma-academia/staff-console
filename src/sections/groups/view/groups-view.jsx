import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { userGroupApi } from 'src/api';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

import AddGroup from '../add-group';
import EditGroup from '../edit-group';
import ViewGroupModal from '../view-group-modal';
import ManageMembersModal from '../manage-members-modal';

// ----------------------------------------------------------------------

const COLUMNS = [
  { id: 'name', label: 'Group Name', align: 'left' },
  { id: 'description', label: 'Description', align: 'left' },
  { id: 'type', label: 'Type', align: 'left', renderCell: (row) => {
    let chipColor = 'default';
    if (row.type === 'department') {
      chipColor = 'primary';
    } else if (row.type === 'union') {
      chipColor = 'info';
    }
    return (
      <Chip 
        label={row.type || 'custom'} 
        size="small" 
        color={chipColor} 
      />
    );
  }},
  { id: 'users', label: 'Members', align: 'center', renderCell: (row) => row.users?.length || 0 },
  { id: 'isActive', label: 'Status', align: 'left', renderCell: (row) => (
    <Chip 
      label={row.isActive ? 'Active' : 'Inactive'} 
      color={row.isActive ? 'success' : 'error'} 
      variant="soft"
      size="small"
    />
  )},
  { id: 'action', label: 'Actions', align: 'right' },
];

export default function GroupsView() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [openManage, setOpenManage] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['user-groups'],
    queryFn: () => userGroupApi.getGroups(),
  });

  const { mutate: deleteGroup } = useMutation({
    mutationFn: (id) => userGroupApi.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      enqueueSnackbar('Group deleted successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Delete failed', { variant: 'error' });
    },
  });

  const handleOpenAdd = () => setOpenAdd(true);
  const handleCloseAdd = () => setOpenAdd(false);

  const handleOpenEdit = (group) => {
    setSelectedGroup(group);
    setOpenEdit(true);
  };
  const handleCloseEdit = () => {
    setSelectedGroup(null);
    setOpenEdit(false);
  };

  const handleOpenView = (group) => {
    setSelectedGroup(group);
    setOpenView(true);
  };
  const handleCloseView = () => {
    setSelectedGroup(null);
    setOpenView(false);
  };

  const handleOpenManage = (group) => {
    setSelectedGroup(group);
    setOpenManage(true);
  };
  const handleCloseManage = () => {
    setSelectedGroup(null);
    setOpenManage(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      deleteGroup(id);
    }
  };

  const columnsWithActions = COLUMNS.map((column) => {
    if (column.id === 'action') {
      return {
        ...column,
        renderCell: (row) => (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            <Tooltip title="View Members">
              <IconButton color="info" onClick={() => handleOpenView(row)}>
                <Iconify icon="solar:eye-bold" />
              </IconButton>
            </Tooltip>
            
            <Can do="edit_user_group">
              <Tooltip title="Edit Group">
                <IconButton color="primary" onClick={() => handleOpenEdit(row)}>
                  <Iconify icon="solar:pen-bold" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Manage Members">
                <IconButton color="warning" onClick={() => handleOpenManage(row)}>
                  <Iconify icon="solar:users-group-rounded-bold" />
                </IconButton>
              </Tooltip>
            </Can>

            <Can do="delete_user_group">
              <Tooltip title="Delete Group">
                <IconButton color="error" onClick={() => handleDelete(row._id)}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            </Can>
          </Box>
        ),
      };
    }
    return column;
  });

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              User Groups
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage departments, unions, and custom user groups
            </Typography>
          </Box>
          
          <Can do="add_user_group">
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={handleOpenAdd}
            >
              New Group
            </Button>
          </Can>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <GenericTable
          data={data || []}
          isLoading={isLoading}
          columns={columnsWithActions}
          rowIdField="_id"
          withCheckbox={false}
          withToolbar
          withPagination
          toolbarProps={{
            searchPlaceholder: "Search groups...",
            toolbarTitle: "All Groups",
          }}
          onRowClick={handleOpenView}
        />
      </Box>

      {openAdd && (
        <AddGroup 
          open={openAdd} 
          onClose={handleCloseAdd} 
        />
      )}

      {openEdit && selectedGroup && (
        <EditGroup 
          open={openEdit} 
          onClose={handleCloseEdit} 
          group={selectedGroup} 
        />
      )}

      {openView && selectedGroup && (
        <ViewGroupModal 
          open={openView} 
          onClose={handleCloseView} 
          group={selectedGroup} 
        />
      )}

      {openManage && selectedGroup && (
        <ManageMembersModal 
          open={openManage} 
          onClose={handleCloseManage} 
          group={selectedGroup} 
        />
      )}
    </Container>
  );
}

