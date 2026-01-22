import Lottie from 'lottie-react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import animationData from '../../assets/animation.json';

// ----------------------------------------------------------------------

export default function Loader({ sx, ...other }) {
  return (
    <Box
      sx={{
        width: 1,
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
      {...other}
    >
      <Lottie
        animationData={animationData}
        style={{ width: 200, height: 200 }}
      />
    </Box>
  );
}

Loader.propTypes = {
  sx: PropTypes.object,
};

