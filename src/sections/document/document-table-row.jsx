import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

export default function DocumentTableRow({
  selected,
  id,
  title,
  tags,
  programs,
  classlevels,
  size,
  // offerDate,
  handleClick,
}) {
  // const [openModal, setOpenModal] = useState(null);
  console.log({ programs, classlevels });
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
      <TableCell>{tags}</TableCell>
      <TableCell>{programs}</TableCell>
      <TableCell>{classlevels}</TableCell>
      <TableCell>{size}</TableCell>
      <TableCell>{new Date('2024-10-01').toLocaleDateString()}</TableCell>

      {/* Modal for editing admission */}
      <TableCell align="right">
        {/* <AddStudent open={openModal} setOpen={setOpenModal} object={object} /> */}
      </TableCell>
    </TableRow>
  );
}

DocumentTableRow.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  tags: PropTypes.string.isRequired,
  programs: PropTypes.string.isRequired,
  classlevels: PropTypes.string.isRequired,
  size: PropTypes.string.isRequired,
  handleClick: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};
