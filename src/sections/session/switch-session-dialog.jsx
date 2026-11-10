import { useState } from 'react';
import PropTypes from 'prop-types';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Alert,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

// ----------------------------------------------------------------------

/**
 * Asks before the current academic session changes. `onConfirm` may return a
 * promise; the dialog stays open (and busy) until it settles, and closes only
 * when it succeeds. The caller reports errors.
 */
export default function SwitchSessionDialog({ open, target, current, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // Shown by the caller's error handler; keep the dialog open to retry or cancel.
    } finally {
      setBusy(false);
    }
  };

  const targetName = target?.name || 'This session';

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Switch current session?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>{targetName}</strong> becomes the current session
          {current ? (
            <>
              , replacing <strong>{current.name}</strong>
            </>
          ) : null}
          .
        </Typography>
        <Alert severity="info">
          This applies to everyone straight away: anything that follows the current session moves to{' '}
          {targetName}. Students without an enrollment record for{' '}
          {current ? 'either session' : 'it'} get one from their present programme and class level.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <LoadingButton variant="contained" loading={busy} onClick={handleConfirm}>
          Switch session
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

SwitchSessionDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  target: PropTypes.object,
  current: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};
