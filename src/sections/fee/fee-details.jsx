import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Modal from '@mui/material/Modal';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Backdrop from '@mui/material/Backdrop';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import { useTheme, useMediaQuery } from '@mui/material';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

import { FeeApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';

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
      setFeeDetails(data);
    } else if (fee) {
      setFeeDetails(fee);
    }
  }, [data, fee]);

  const handleClose = () => {
    setOpen(false);
    setFeeDetails(null);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₦0';
    return `₦${Number(amount).toLocaleString()}`;
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

  const getStatusColor = (status) => {
    const statusValue = (status || '').toLowerCase();
    if (statusValue === 'pending') return 'error';
    if (statusValue === 'overdue') return 'warning';
    return 'success';
  };

  const getPaymentStatusColor = (status) => {
    const statusValue = (status || '').toLowerCase();
    if (statusValue === 'completed') return 'success';
    if (statusValue === 'pending') return 'warning';
    if (statusValue === 'failed') return 'error';
    return 'default';
  };

  const calculatePaymentProgress = () => {
    const expected = feeDetails?.payment?.expected || 0;
    const made = feeDetails?.payment?.made || 0;
    if (expected === 0) return 0;
    return Math.round((made / expected) * 100);
  };

  const getProgressColor = (progress) => {
    if (progress === 100) return 'success';
    if (progress > 50) return 'info';
    return 'warning';
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

  const completedPayments = feeDetails?.payment?.completedPayments || [];
  const paymentProgress = calculatePaymentProgress();

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

          {isLoading ? (
            <Typography>Loading...</Typography>
          ) : (
            <Stack spacing={3}>
              {/* Basic Information */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Fee Name
                      </Typography>
                      <Typography variant="body1">{feeDetails?.name || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Fee Type
                      </Typography>
                      <Typography variant="body1">{feeDetails?.feeType || 'N/A'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Amount
                      </Typography>
                      <Typography variant="body1">{formatCurrency(feeDetails?.amount)}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Due Date
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(feeDetails?.dueDate)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Status
                      </Typography>
                      <Label color={getStatusColor(feeDetails?.status)}>
                        {feeDetails?.status || 'N/A'}
                      </Label>
                    </Grid>
                    {feeDetails?.semester && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Semester
                        </Typography>
                        <Typography variant="body1">{feeDetails.semester}</Typography>
                      </Grid>
                    )}
                    {feeDetails?.gateway && (feeDetails.gateway.length > 0 || (Array.isArray(feeDetails.gateway) ? false : feeDetails.gateway)) && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Payment Gateway(s)
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                          {(Array.isArray(feeDetails.gateway) ? feeDetails.gateway : [feeDetails.gateway])
                            .filter(Boolean)
                            .map((gateway, index) => (
                              <Chip key={index} label={gateway} size="small" variant="outlined" />
                            ))}
                        </Stack>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created At
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(feeDetails?.createdAt)}
                      </Typography>
                    </Grid>
                    {feeDetails?.description && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body1">{feeDetails.description}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* Payment Statistics */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Students Assigned
                      </Typography>
                      <Typography variant="h5">{feeDetails?.studentCount || 0}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Expected Payment
                      </Typography>
                      <Typography variant="h5">
                        {formatCurrency(feeDetails?.payment?.expected || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Payment Made
                      </Typography>
                      <Typography variant="h5" color="success.main">
                        {formatCurrency(feeDetails?.payment?.made || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Payment Progress
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress
                            variant="determinate"
                            value={paymentProgress}
                            color={getProgressColor(paymentProgress)}
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Box>
                        <Typography variant="h6" sx={{ minWidth: 50 }}>
                          {paymentProgress}%
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Assignment Details */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Assignment Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Programs
                      </Typography>
                      <Typography variant="body1">
                        {(feeDetails?.programs || [])
                          .map((prog) => prog?.name || prog?.code || prog)
                          .filter(Boolean)
                          .join(', ') || 'None'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Class Levels
                      </Typography>
                      <Typography variant="body1">
                        {(feeDetails?.classLevels || [])
                          .map((level) => level?.name || level)
                          .filter(Boolean)
                          .join(', ') || 'None'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Completed Payments */}
              {completedPayments.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Completed Payments ({completedPayments.length})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell>Registration Number</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell>Reference</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Date</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {completedPayments.map((payment) => (
                            <TableRow key={payment._id}>
                              <TableCell>
                                {payment?.user?.personalInfo
                                  ? `${payment.user.personalInfo.firstName || ''} ${payment.user.personalInfo.lastName || ''}`.trim() ||
                                    payment.user.email ||
                                    'N/A'
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {payment?.user?.regNumber || 'N/A'}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(payment?.amount)}
                              </TableCell>
                              <TableCell>{payment?.reference || 'N/A'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={payment?.status || 'N/A'}
                                  color={getPaymentStatusColor(payment?.status)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{formatDate(payment?.createdAt)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Items */}
              {feeDetails?.items && feeDetails.items.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Fee Items
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Item Name</TableCell>
                            <TableCell align="center">Quantity</TableCell>
                            <TableCell align="right">Price</TableCell>
                            <TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {feeDetails.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell align="center">{item.quantity}</TableCell>
                              <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                              <TableCell align="right">
                                {formatCurrency(item.quantity * item.price)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Stack>
          )}
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
