import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
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

import { TemplateApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

// ----------------------------------------------------------------------

export default function TemplateTableRow({
  selected,
  row,
  handleClick,
}) {
  const navigate = useNavigate();
  const { _id: id, name, type, category, subject, variables, isActive, createdAt } = row;
  const [open, setOpen] = useState(null);
  
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenMenu = (event) => {
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

  const handleRowClick = (event) => {
    // Don't navigate if clicking on checkbox or action button
    if (event.target.closest('input[type="checkbox"]') || event.target.closest('button')) {
      return;
    }
    navigate(`/template/${id}`);
  };

  return (
    <>
      <TableRow
        hover
        tabIndex={-1}
        role="checkbox"
        selected={selected}
        onClick={handleRowClick}
        sx={{ cursor: 'pointer' }}
      >
        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
          <Checkbox disableRipple checked={selected} onChange={handleClick} />
        </TableCell>

        <TableCell component="th" scope="row" padding="none">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="subtitle2" noWrap>
              {name}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>
          <Label color={type === 'email' ? 'info' : 'secondary'}>
            {type.toUpperCase()}
          </Label>
        </TableCell>

        <TableCell sx={{ textTransform: 'capitalize' }}>{category}</TableCell>

        <TableCell>
          {type === 'email' ? (
            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
              {subject || '-'}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">-</Typography>
          )}
        </TableCell>

        <TableCell align="center">
          <Typography variant="body2">{variables?.length || 0}</Typography>
        </TableCell>

        <TableCell>
          <Label color={isActive ? 'success' : 'error'}>
            {isActive ? 'Active' : 'Inactive'}
          </Label>
        </TableCell>

        <TableCell align="left">
          {createdAt ? new Date(createdAt).toLocaleDateString() : '-'}
        </TableCell>

        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
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
}

TemplateTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  handleClick: PropTypes.func,
  selected: PropTypes.any,
};

