import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Alert,
  Stack,
  Button,
  Dialog,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { ResitApi } from 'src/api';

import { formatCurrency } from 'src/sections/fee/fee-format';

import { studentLabel } from './resit-format';

// ----------------------------------------------------------------------

const courseCodes = (registration) =>
  (registration?.courses || [])
    .map((entry) => entry.course?.code)
    .filter(Boolean)
    .join(', ');

/** The last registration shown, so a closing dialog doesn't go blank during its exit transition. */
const useLastRegistration = (registration) => {
  const [shown, setShown] = useState(registration);
  useEffect(() => {
    if (registration) setShown(registration);
  }, [registration]);
  return registration || shown;
};

/** Waiving or cancelling changes the student's bill and resit entitlement. */
const useInvalidateResits = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['resit'] });
    queryClient.invalidateQueries({ queryKey: ['student-fees'] });
    queryClient.invalidateQueries({ queryKey: ['fees'] });
  };
};

function RegistrationSummary({ registration }) {
  return (
    <Typography variant="body2">
      <strong>{studentLabel(registration?.student)}</strong>: {courseCodes(registration) || '—'} ·{' '}
      {formatCurrency(registration?.total)}
    </Typography>
  );
}

RegistrationSummary.propTypes = {
  registration: PropTypes.object,
};

// ----------------------------------------------------------------------

/** Waive an unpaid registration's fee: the student may resit without paying. */
export function WaiveResitDialog({ registration, onClose }) {
  const { enqueueSnackbar } = useSnackbar();
  const invalidate = useInvalidateResits();
  const shown = useLastRegistration(registration);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (registration) setReason('');
  }, [registration]);

  const { mutate, isPending } = useMutation({
    mutationFn: () => ResitApi.waive(shown._id, reason.trim()),
    onSuccess: () => {
      invalidate();
      enqueueSnackbar('Resit fee waived', { variant: 'success' });
      onClose();
    },
    onError: (error) =>
      enqueueSnackbar(error.message || 'Could not waive the resit fee', { variant: 'error' }),
  });

  return (
    <Dialog
      open={Boolean(registration)}
      onClose={isPending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>Waive resit fee</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <RegistrationSummary registration={shown} />
          <Typography variant="body2" color="text.secondary">
            The student keeps the registration and can resit these courses without paying. The fee
            is taken off their bill.
          </Typography>
          <TextField
            autoFocus
            required
            fullWidth
            multiline
            minRows={2}
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${reason.length}/500`}
            disabled={isPending}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          loading={isPending}
          disabled={!reason.trim()}
          onClick={() => mutate()}
        >
          Waive fee
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

WaiveResitDialog.propTypes = {
  registration: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

/** Cancel an unpaid registration: the courses can be registered again and the fee is retired. */
export function CancelResitDialog({ registration, onClose }) {
  const { enqueueSnackbar } = useSnackbar();
  const invalidate = useInvalidateResits();
  const shown = useLastRegistration(registration);

  const { mutate, isPending } = useMutation({
    mutationFn: () => ResitApi.cancel(shown._id),
    onSuccess: () => {
      invalidate();
      enqueueSnackbar('Resit registration cancelled', { variant: 'success' });
      onClose();
    },
    onError: (error) =>
      enqueueSnackbar(error.message || 'Could not cancel the registration', { variant: 'error' }),
  });

  return (
    <Dialog
      open={Boolean(registration)}
      onClose={isPending ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>Cancel resit registration?</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <RegistrationSummary registration={shown} />
          <Typography variant="body2" color="text.secondary">
            The fee is taken off the student&apos;s bill and the courses can be registered again.
          </Typography>
          {shown?.paymentStarted && (
            <Alert severity="warning">
              The student has started paying. If that payment completes, the registration counts as
              paid anyway.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={onClose} disabled={isPending}>
          Keep it
        </Button>
        <LoadingButton
          variant="contained"
          color="error"
          loading={isPending}
          onClick={() => mutate()}
        >
          Cancel registration
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

CancelResitDialog.propTypes = {
  registration: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};
