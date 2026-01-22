import { useState } from 'react';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Chip from '@mui/material/Chip';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { AuditApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import { formatActor, formatEntityId, isFailedOperation } from './utils';

// ----------------------------------------------------------------------

export default function AuditTableRow({
  selected,
  row,
  handleClick,
}) {
  const navigate = useNavigate();
  const {
    _id: id,
    entityType,
    entityId,
    actionType,
    actor,
    status,
    timestamp,
  } = row;
  
  const [open, setOpen] = useState(null);
  
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const { mutate: deleteAuditLog } = useMutation({
    mutationFn: () => AuditApi.deleteAuditLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      enqueueSnackbar('Audit log deleted successfully', { variant: 'success' });
      handleCloseMenu();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Delete failed', { variant: 'error' });
    }
  });

  const handleViewDetails = () => {
    navigate(`/audit/${id}`);
    handleCloseMenu();
  };

  const handleViewActorHistory = () => {
    const actorId = typeof actor === 'object' ? actor._id : actor;
    navigate(`/audit?actor=${actorId}`);
    handleCloseMenu();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this audit log?')) {
      deleteAuditLog();
    }
  };

  const handleRowClick = (event) => {
    // Don't navigate if clicking on checkbox or action button
    if (event.target.closest('input[type="checkbox"]') || event.target.closest('button')) {
      return;
    }
    navigate(`/audit/${id}`);
  };

  const getActionTypeColor = (type) => {
    switch (type) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      case 'view':
        return 'default';
      default:
        return 'default';
    }
  };

  const formattedDate = timestamp ? format(new Date(timestamp), 'PPpp') : 'N/A';

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
          <Typography variant="body2" sx={{ minWidth: 160 }}>
            {formattedDate}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2">{entityType}</Typography>
        </TableCell>

        <TableCell>
          {isFailedOperation(entityId) ? (
            <Chip
              label="Failed Operation"
              color="warning"
              size="small"
              sx={{ fontFamily: 'monospace' }}
            />
          ) : (
            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
              {entityId ? `${formatEntityId(entityId).substring(0, 8)  }...` : 'N/A'}
            </Typography>
          )}
        </TableCell>

        <TableCell>
          <Chip
            label={actionType}
            color={getActionTypeColor(actionType)}
            size="small"
            sx={{ textTransform: 'capitalize' }}
          />
        </TableCell>

        <TableCell>
          <Typography variant="body2">{formatActor(actor)}</Typography>
          {typeof actor === 'object' && actor?.email && (
            <Typography variant="caption" color="text.secondary" display="block">
              {actor.email}
            </Typography>
          )}
        </TableCell>

        <TableCell>
          <Label
            color={status === 'success' ? 'success' : 'error'}
          >
            {status}
          </Label>
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
          sx: { width: 200 },
        }}
      >
        <MenuItem onClick={handleViewDetails}>
          <Iconify icon="eva:eye-fill" sx={{ mr: 2 }} />
          View Details
        </MenuItem>

        <MenuItem onClick={handleViewActorHistory}>
          <Iconify icon="eva:person-fill" sx={{ mr: 2 }} />
          View Actor History
        </MenuItem>

        <Can do="delete_audit">
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

AuditTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  handleClick: PropTypes.func,
  selected: PropTypes.any,
};
