import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Modal from '@mui/material/Modal';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Backdrop from '@mui/material/Backdrop';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import { useTheme, useMediaQuery } from '@mui/material';

import { SessionApi } from 'src/api';
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

const SessionDetails = ({ open, setOpen, session }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [details, setDetails] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['session', session?._id],
    queryFn: () => SessionApi.getSessionById(session?._id),
    enabled: !!session?._id && open,
  });

  useEffect(() => {
    if (data) setDetails(data);
    else if (session) setDetails(session);
  }, [data, session]);

  const handleClose = () => {
    setOpen(false);
    setDetails(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCreatedBy = () => {
    const createdBy = details?.createdBy;
    if (!createdBy) return '—';
    if (typeof createdBy === 'object') {
      const name = [createdBy.firstName, createdBy.lastName].filter(Boolean).join(' ');
      return name || createdBy.email || '—';
    }
    return '—';
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '95%' : 560,
    maxWidth: '100%',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    maxHeight: '90vh',
    overflow: 'auto',
  };

  if (!details && !isLoading) return null;

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
            <Typography variant="h5">Session Details</Typography>
            <Button onClick={handleClose} startIcon={<Iconify icon="eva:close-fill" />}>
              Close
            </Button>
          </Stack>

          {isLoading ? (
            <Typography>Loading...</Typography>
          ) : (
            <Card variant="outlined" sx={{ overflow: 'hidden' }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="body1">{details?.name || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Code
                    </Typography>
                    <Typography variant="body1">{details?.code || '—'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Current semester
                    </Typography>
                    <Typography variant="body1">
                      {details?.currentSemester || 'First Semester'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Current session
                    </Typography>
                    {details?.isCurrent ? (
                      <Label color="success">Yes</Label>
                    ) : (
                      <Typography variant="body1">No</Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Start date
                    </Typography>
                    <Typography variant="body1">{formatDate(details?.startDate)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      End date
                    </Typography>
                    <Typography variant="body1">{formatDate(details?.endDate)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Created by
                    </Typography>
                    <Typography variant="body1">{formatCreatedBy()}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Created at
                    </Typography>
                    <Typography variant="body1">{formatDate(details?.createdAt)}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

SessionDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  session: PropTypes.object,
};

export default SessionDetails;
