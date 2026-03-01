import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// ----------------------------------------------------------------------

export default function Loader({ sx, ...other }) {
  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        width: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch',
        ...sx,
      }}
      {...other}
    >
      <CircularProgress size={48} />
    </Box>
  );
}

Loader.propTypes = {
  sx: PropTypes.object,
};
