import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

// import Label from 'src/components/label';

// import AddStudent from './add-student';

// ----------------------------------------------------------------------

export default function CalenderTableRow({
  selected,
  id,
  title,
  start,
  end,
  category,
  classlevels,
  programs,
  createdBy,
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
            {title}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>{start}</TableCell>
      <TableCell>{end}</TableCell>
      <TableCell>{category}</TableCell>
      <TableCell>{classlevels}</TableCell>
      <TableCell>{programs}</TableCell>
      <TableCell>
          {createdBy}
      </TableCell>
      <TableCell>{new Date("2024-10-01").toLocaleDateString()}</TableCell>

      {/* Modal for editing admission */}
      <TableCell align="right">
        {/* <AddStudent open={openModal} setOpen={setOpenModal} object={object} /> */}
      </TableCell>
    </TableRow>
  );
}

CalenderTableRow.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  start: PropTypes.string.isRequired,
  end: PropTypes.string.isRequired,
  category: PropTypes.string.isRequired,
  classlevels: PropTypes.string.isRequired,
  programs: PropTypes.string.isRequired,
  createdBy: PropTypes.string.isRequired,
  object: PropTypes.object,
  handleClick: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};

