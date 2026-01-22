import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Button, Popover, Divider, MenuItem, IconButton } from '@mui/material';

import { TemplateApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

// ----------------------------------------------------------------------

const TemplateActions = ({ row }) => {
  const navigate = useNavigate();
  const { _id: id } = row;
  const [open, setOpen] = useState(null);
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenMenu = (event) => {
    event.stopPropagation();
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const { mutate: deleteTemplate } = useMutation({
    mutationFn: () => TemplateApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      enqueueSnackbar('Template deleted successfully', { variant: 'success' });
      handleCloseMenu();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Delete failed', { variant: 'error' });
    }
  });

  const handleViewDetails = () => {
    navigate(`/template/${id}`);
    handleCloseMenu();
  };

  const handleEdit = () => {
    navigate(`/template/${id}/edit`);
    handleCloseMenu();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplate();
    }
  };

  return (
    <>
      <IconButton onClick={handleOpenMenu}>
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton>

      <Popover
        open={!!open}
        anchorEl={open}
        onClose={(e) => {
            e.stopPropagation();
            handleCloseMenu();
        }}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: { width: 160 },
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <Iconify icon="eva:eye-fill" sx={{ mr: 2 }} />
          View Details
        </MenuItem>

        <Can do="edit_template">
          <MenuItem onClick={handleEdit}>
            <Iconify icon="eva:edit-fill" sx={{ mr: 2 }} />
            Edit
          </MenuItem>
        </Can>

        <Can do="delete_template">
          <Divider sx={{ borderStyle: 'dashed' }} />
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Iconify icon="eva:trash-2-outline" sx={{ mr: 2 }} />
            Delete
          </MenuItem>
        </Can>
      </Popover>
    </>
  );
};

TemplateActions.propTypes = {
  row: PropTypes.object,
};

const columns = [
  { 
    id: 'name', 
    label: 'Name', 
    align: 'left', 
    cellSx: { width: '20%' },
    renderCell: (row) => (
      <Typography variant="subtitle2" noWrap>
        {row.name}
      </Typography>
    )
  },
  { 
    id: 'type', 
    label: 'Type',
    cellSx: { width: '10%' },
    renderCell: (row) => (
      <Label color={row.type === 'email' ? 'info' : 'secondary'}>
        {row.type ? row.type.toUpperCase() : 'N/A'}
      </Label>
    )
  },
  { 
    id: 'category', 
    label: 'Category',
    cellSx: { width: '15%', textTransform: 'capitalize' }
  },
  { 
    id: 'subject', 
    label: 'Subject',
    cellSx: { width: '20%' },
    renderCell: (row) => (
      row.type === 'email' ? (
        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
          {row.subject || '-'}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">-</Typography>
      )
    )
  },
  { 
    id: 'variables', 
    label: 'Variables',
    align: 'center',
    cellSx: { width: '10%' },
    renderCell: (row) => (
      <Typography variant="body2">{row.variables?.length || 0}</Typography>
    )
  },
  { 
    id: 'isActive', 
    label: 'Status',
    cellSx: { width: '10%' },
    renderCell: (row) => (
      <Label color={row.isActive ? 'success' : 'error'}>
        {row.isActive ? 'Active' : 'Inactive'}
      </Label>
    )
  },
  { 
    id: 'createdAt', 
    label: 'Created At',
    cellSx: { width: '10%' },
    renderCell: (row) => (
      row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'
    )
  },
  { 
    id: 'action', 
    label: '', 
    cellSx: { width: '5%' },
    renderCell: (row) => <TemplateActions row={row} />
  },
];

export default function TemplateView() {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Note: Sorting/Filtering state is handled internally by GenericTable 
  // or via API if we implement server-side later. 
  // For now, client-side handling in GenericTable is sufficient as per legacy behavior.

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => TemplateApi.getTemplates(),
  });

  const handleRowClick = (row) => {
    navigate(`/template/${row._id}`);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Templates
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage email and document templates
            </Typography>
          </Box>
          <Can do="add_template">
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => navigate('/template/new')}
              sx={{ 
                px: 3,
                boxShadow: theme.customShadows.primary,
                '&:hover': {
                  boxShadow: 'none',
                }
              }}
            >
              New Template
            </Button>
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
            onRowClick={handleRowClick}
            toolbarProps={{
              searchPlaceholder: 'Search templates...',
              toolbarTitle: 'Templates List',
            }}
          />
        </Card>
      </Box>
    </Container>
  );
}
