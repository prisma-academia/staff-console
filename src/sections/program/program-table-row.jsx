import PropTypes from 'prop-types';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ProgramTableRow({
  selected,
  id,
  name,
  code,
  type,
  department,
  durationInYears,
  totalCreditsRequired,
  school,
  isActive,
  object,
  handleClick,
  onEdit,
  onDelete,
}) {
  // Handle department - can be object or string
  const departmentName = typeof department === 'object' && department !== null 
    ? department.name 
    : department || 'N/A';

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
      <TableCell>
        <Chip 
          label={type || 'N/A'} 
          size="small" 
          color={(() => {
            if (type === 'ND') return 'primary';
            if (type === 'Basic') return 'secondary';
            return 'default';
          })()}
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {departmentName}
        </Typography>
      </TableCell>
      <TableCell>{durationInYears ? `${durationInYears} Years` : 'N/A'}</TableCell>
      <TableCell>{totalCreditsRequired || 'N/A'}</TableCell>
      <TableCell>
        <Typography variant="body2" noWrap>
          {school || 'N/A'}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip 
          label={isActive ? 'Active' : 'Inactive'} 
          size="small" 
          color={isActive ? 'success' : 'default'}
          variant="outlined"
        />
      </TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {onEdit && (
            <IconButton 
              color="primary" 
              size="small"
              onClick={() => onEdit(object)}
              title="Edit Program"
            >
              <Iconify icon="eva:edit-fill" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton 
              color="error" 
              size="small"
              onClick={() => onDelete(object)}
              title="Delete Program"
            >
              <Iconify icon="eva:trash-2-fill" />
            </IconButton>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

ProgramTableRow.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  code: PropTypes.string.isRequired,
  type: PropTypes.string,
  department: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  durationInYears: PropTypes.number,
  totalCreditsRequired: PropTypes.number,
  school: PropTypes.string,
  isActive: PropTypes.bool,
  object: PropTypes.object,
  handleClick: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};
