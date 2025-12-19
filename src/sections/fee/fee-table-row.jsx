import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

// import AddStudent from './add-student';

// ----------------------------------------------------------------------

export default function FeeTableRow({
  selected,
  id,
  name,
  amount,
  status,
  studentCount,
  paymentExpected,
  paymentMade,
  paymentProgress,
  createdAt,
  handleClick,
  onEdit,
  onDelete,
  onView,
  hasCompletedPayments,
}) {
  const statusValue = (status || '').toLowerCase();
  const labelColor =
    (statusValue === 'pending' && 'error') ||
    (statusValue === 'overdue' && 'warning') ||
    'success';

  const formatCurrency = (value) => {
    if (!value && value !== 0) return '₦0';
    return `₦${Number(value).toLocaleString()}`;
  };

  const formatAmount = (value) => {
    if (!value && value !== 0) return '₦0';
    return typeof value === 'number' ? formatCurrency(value) : value;
  };

  const getProgressColor = (progress) => {
    if (progress === 100) return 'success';
    if (progress > 50) return 'info';
    return 'warning';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox disableRipple checked={selected} onChange={handleClick} />
      </TableCell>
      <TableCell component="th" scope="row" padding="none">
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="subtitle2" noWrap>
            {name}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>{formatAmount(amount)}</TableCell>
      <TableCell>
        <Label color={labelColor}>{status}</Label>
      </TableCell>
      <TableCell>{studentCount || 0}</TableCell>
      <TableCell>{formatCurrency(paymentExpected)}</TableCell>
      <TableCell>{formatCurrency(paymentMade)}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress
              variant="determinate"
              value={paymentProgress}
              color={getProgressColor(paymentProgress)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 35 }}>
            {paymentProgress}%
          </Typography>
        </Box>
      </TableCell>
      <TableCell>{formatDate(createdAt)}</TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onView && (
            <Tooltip title="View Details">
              <IconButton onClick={onView} size="small">
                <Iconify icon="eva:eye-fill" />
              </IconButton>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip
              title={hasCompletedPayments ? 'Cannot edit fee with completed payments' : 'Edit Fee'}
            >
              <span>
                <IconButton onClick={onEdit} size="small" disabled={hasCompletedPayments}>
                  <Iconify icon="eva:edit-fill" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip
              title={
                hasCompletedPayments ? 'Cannot delete fee with completed payments' : 'Delete Fee'
              }
            >
              <span>
                <IconButton
                  onClick={onDelete}
                  size="small"
                  disabled={hasCompletedPayments}
                  color="error"
                >
                  <Iconify icon="eva:trash-2-fill" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

FeeTableRow.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  status: PropTypes.string.isRequired,
  studentCount: PropTypes.number,
  paymentExpected: PropTypes.number,
  paymentMade: PropTypes.number,
  paymentProgress: PropTypes.number,
  createdAt: PropTypes.string,
  handleClick: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onView: PropTypes.func,
  hasCompletedPayments: PropTypes.bool,
};
