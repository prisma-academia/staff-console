import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

// import Label from 'src/components/label';

// import AddStudent from './add-student';

// ----------------------------------------------------------------------

export default function CourseTableRow({
  selected,
  id,
  title,
  code,
  program,
  classlevel,
  semester,
  credits,
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
            {title}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>{code}</TableCell>
      <TableCell>{program}</TableCell>
      <TableCell>{classlevel}</TableCell>
      <TableCell>{semester}</TableCell>
      <TableCell>
          {credits}
      </TableCell>
      {/* <TableCell>{new Date("2024-10-01").toLocaleDateString()}</TableCell> */}

      {/* Modal for editing admission */}
      <TableCell align="right">
        {/* <AddStudent open={openModal} setOpen={setOpenModal} object={object} /> */}
      </TableCell>
    </TableRow>
  );
}

CourseTableRow.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  program: PropTypes.string.isRequired,
  classlevel: PropTypes.string.isRequired,
  semester:PropTypes.string.isRequired,
  credits: PropTypes.string.isRequired,
  object: PropTypes.object,
  handleClick: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};

