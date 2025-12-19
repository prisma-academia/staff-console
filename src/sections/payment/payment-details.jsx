import * as React from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Grid from '@mui/material/Grid';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import Backdrop from '@mui/material/Backdrop';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Stack, Divider, TextField, Typography } from '@mui/material';

import { paymentApi } from 'src/api';

import CustomSelect from 'src/components/old-select/select';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  maxWidth: '90vw',
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  overflow: 'auto',
};

const statusOptions = [
  { name: 'Pending', value: 'Pending' },
  { name: 'Completed', value: 'Completed' },
  { name: 'Failed', value: 'Failed' },
  { name: 'Overdue', value: 'Overdue' },
];

export default function PaymentDetails({ open, setOpen, payment }) {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [gateway, setGateway] = useState('');

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // Initialize form values when payment changes
  useEffect(() => {
    if (payment) {
      setAmount(payment.amount?.toString() || '');
      setStatus(payment.status || '');
      setDescription(payment.description || '');
      setReference(payment.reference || '');
      setGateway(payment.gateway || '');
    }
  }, [payment]);

  // Update payment mutation
  const updatePayment = async (updateData) => paymentApi.updatePayment(payment._id, updateData);

  const { mutate: mutateUpdate, isPending: isUpdating } = useMutation({
    mutationFn: updatePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      enqueueSnackbar({ message: 'Payment updated successfully', variant: 'success' });
      handleClose();
    },
    onError: (error) => {
      enqueueSnackbar({ message: error.message || 'Failed to update payment', variant: 'error' });
    },
  });

  // Verify payment mutation
  const verifyPayment = async () => {
    const paymentId = payment?._id;
    const paymentReference = payment?.reference;
    
    if (!paymentId && !paymentReference) {
      throw new Error('Payment ID or reference is required');
    }
    
    return paymentApi.verifyPayment(paymentId, paymentReference);
  };

  const { mutate: mutateVerify, isPending: isVerifying } = useMutation({
    mutationFn: verifyPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      enqueueSnackbar({ message: 'Payment verified and updated successfully', variant: 'success' });
      handleClose();
    },
    onError: (error) => {
      enqueueSnackbar({ message: error.message || 'Failed to verify payment', variant: 'error' });
    },
  });

  const handleClose = () => {
    setOpen(false);
    // Reset form values
    if (payment) {
      setAmount(payment.amount?.toString() || '');
      setStatus(payment.status || '');
      setDescription(payment.description || '');
      setReference(payment.reference || '');
      setGateway(payment.gateway || '');
    }
  };

  const handleUpdate = () => {
    const updateData = {
      amount: parseFloat(amount) || 0,
      status,
      description,
      reference,
      gateway,
    };

    // Remove undefined or empty fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === '' || updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    mutateUpdate(updateData);
  };

  const handleVerify = () => {
    mutateVerify();
  };

  // Extract user name from nested object structure
  const getUserName = () => {
    if (!payment?.user) return 'Unknown';
    if (typeof payment.user === 'string') return payment.user;
    const fullName = `${payment.user?.personalInfo?.firstName || ''} ${payment.user?.personalInfo?.lastName || ''}`.trim();
    return fullName || payment.user?.email || 'Unknown';
  };
  const userName = getUserName();

  // Extract fee name from nested object structure
  const getFeeName = () => {
    if (!payment?.fee) return 'Unknown';
    if (typeof payment.fee === 'string') return payment.fee;
    return payment.fee?.name || 'Unknown';
  };
  const feeName = getFeeName();

  if (!payment) return null;

  return (
    <Modal
      aria-labelledby="payment-details-modal-title"
      aria-describedby="payment-details-modal-description"
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
    >
      <Fade in={open}>
        <Box sx={style}>
          <Typography id="payment-details-modal-title" variant="h5" align="center" gutterBottom>
            Payment Details
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={3}>
            {/* Read-only User and Fee Information */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="User"
                  value={userName}
                  size="small"
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fee"
                  value={feeName}
                  size="small"
                  InputProps={{
                    readOnly: true,
                  }}
                  variant="outlined"
                />
              </Grid>
            </Grid>

            {/* Editable Payment Fields */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₦</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <CustomSelect
                  list={statusOptions}
                  value={status}
                  setValue={setStatus}
                  label="Status"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  size="small"
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Gateway"
                  value={gateway}
                  onChange={(e) => setGateway(e.target.value)}
                  size="small"
                  placeholder="e.g., paystack"
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={handleClose}>
                Cancel
              </Button>
              <LoadingButton
                variant="contained"
                color="info"
                loading={isVerifying}
                onClick={handleVerify}
              >
                Verify Payment
              </LoadingButton>
              <LoadingButton
                variant="contained"
                color="inherit"
                loading={isUpdating}
                onClick={handleUpdate}
              >
                Update Payment
              </LoadingButton>
            </Stack>
          </Stack>
        </Box>
      </Fade>
    </Modal>
  );
}

PaymentDetails.propTypes = {
  open: PropTypes.bool,
  setOpen: PropTypes.func,
  payment: PropTypes.object,
};
