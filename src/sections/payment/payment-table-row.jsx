import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function PaymentTableRow({
  selected,
  payment,
  handleClick,
}) {
  const navigate = useNavigate();

  const student = payment?.student;
  const getStudentName = () => {
    if (!student) return 'Unknown';
    if (typeof student === 'string') return student;
    const fullName = `${student?.personalInfo?.firstName || ''} ${student?.personalInfo?.lastName || ''}`.trim();
    return fullName || student?.email || 'Unknown';
  };
  const studentName = getStudentName();

  // Extract fee name from nested object structure
  const getFeeName = () => {
    if (!payment?.fee) return 'Unknown';
    if (typeof payment.fee === 'string') return payment.fee;
    return payment.fee?.name || 'Unknown';
  };
  const feeName = getFeeName();

  // Format date from createdAt or updatedAt
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const dateDisplay = formatDate(payment?.createdAt || payment?.updatedAt);

  // Status color mapping
  const getStatusColor = (status) => {
    if (status === 'Failed') return 'error';
    if (status === 'Pending') return 'warning';
    if (status === 'Completed') return 'success';
    if (status === 'Overdue') return 'error';
    return 'default';
  };

  return (
    <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox disableRipple checked={selected} onChange={handleClick} />
      </TableCell>
      <TableCell component="th" scope="row" padding="none">
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="subtitle2" noWrap>
            {studentName}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>{feeName}</TableCell>
      <TableCell>
        {typeof payment?.amount === 'number' ? `₦${payment.amount.toLocaleString()}` : payment?.amount || 'N/A'}
      </TableCell>
      <TableCell>
        <Label color={getStatusColor(payment?.status)}>
          {payment?.status || 'N/A'}
        </Label>
      </TableCell>
      <TableCell>{payment?.reference || '—'}</TableCell>
      <TableCell>{dateDisplay}</TableCell>
      <TableCell align="right">
        <IconButton onClick={() => navigate(`/payment/${payment._id}`)} aria-label="View payment details">
          <Iconify icon="eva:eye-fill" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

PaymentTableRow.propTypes = {
  payment: PropTypes.object.isRequired,
  handleClick: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};
