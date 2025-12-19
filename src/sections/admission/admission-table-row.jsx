import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import { IconButton } from '@mui/material';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function AdmissionTableRow({
  selected,
  id,
  fullName,
  number,
  programme,
  status,
  offerDate,
  object,
  handleClick,
  handleOpen,
}) {
  return (
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
      <TableCell>{number}</TableCell>
      <TableCell>{programme}</TableCell>
      <TableCell>
        <Label
          color={
            (status === 'suspended' && 'error') || (status === 'offered' && 'warning') || 'success'
          }
        >
          {status}
        </Label>
      </TableCell>
      <TableCell>{new Date(offerDate).toLocaleDateString()}</TableCell>

      {/* Modal for editing admission */}
      <TableCell align="right">
        {status === 'accepted'?  <IconButton onClick={() => handleOpen(object)}>
          <Iconify icon="carbon:add-alt" />
        </IconButton>:""}
      
      </TableCell>
    </TableRow>
  );
}

AdmissionTableRow.propTypes = {
  id: PropTypes.string.isRequired,
  fullName: PropTypes.string.isRequired,
  number: PropTypes.string.isRequired,
  programme: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  offerDate: PropTypes.string.isRequired,
  object: PropTypes.object,
  handleClick: PropTypes.func.isRequired,
  handleOpen: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};
