import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

// import Label from 'src/components/label';

// import AddStudent from './add-student';

// ----------------------------------------------------------------------

export default function ProgramTableRow({
  selected,
  id,
  name,
  code,
  department,
  duration,
  creditsRequired,
  // offerDate,
  object,
  handleClick,
}) {
  // const [openModal, setOpenModal] = useState(null);

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
      <TableCell>{code}</TableCell>
      <TableCell>{department}</TableCell>
      <TableCell>{duration}</TableCell>
      <TableCell>
          {creditsRequired}
      </TableCell>
      <TableCell>{new Date("2024-10-01").toLocaleDateString()}</TableCell>

      {/* Modal for editing admission */}
      <TableCell align="right">
        {/* <AddStudent open={openModal} setOpen={setOpenModal} object={object} /> */}
      </TableCell>
    </TableRow>
  );
}

ProgramTableRow.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  department: PropTypes.string.isRequired,
  duration: PropTypes.string.isRequired,
  creditsRequired: PropTypes.string.isRequired,
  object: PropTypes.object,
  handleClick: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};
