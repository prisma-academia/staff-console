import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Backdrop from '@mui/material/Backdrop';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';

import { FeeApi } from 'src/api';

import Iconify from 'src/components/iconify';

import FeeDetailsContent from './fee-details-content';

const FeeDetails = ({ open, setOpen, fee }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [feeDetails, setFeeDetails] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['fee', fee?._id],
    queryFn: () => FeeApi.getFeeById(fee?._id),
    enabled: !!fee?._id && open,
  });

  useEffect(() => {
    if (data) {
      setFeeDetails(data?.data ?? data);
    } else if (fee) {
      setFeeDetails(fee);
    }
  }, [data, fee]);

  const handleClose = () => {
    setOpen(false);
    setFeeDetails(null);
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '95%' : '90%',
    maxWidth: '1000px',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflow: 'auto',
  };

  if (!feeDetails && !isLoading) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      keepMounted={false}
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
    >
      <Fade in={open}>
        <Box sx={modalStyle}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">Fee Details</Typography>
            <Button onClick={handleClose} startIcon={<Iconify icon="eva:close-fill" />}>
              Close
            </Button>
          </Stack>
          <FeeDetailsContent feeDetails={feeDetails} isLoading={isLoading} />
        </Box>
      </Fade>
    </Modal>
  );
};

FeeDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  fee: PropTypes.object,
};

export default FeeDetails;
