import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Alert,
  Stack,
  Table,
  Button,
  Dialog,
  Switch,
  Checkbox,
  MenuItem,
  Skeleton,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import useActiveSession from 'src/hooks/use-active-session';

import { FeeApi } from 'src/api';

import Iconify from 'src/components/iconify';

import { formatDate, formatCurrency } from './fee-format';

// ----------------------------------------------------------------------

const asList = (data) => (Array.isArray(data) ? data : (data?.data ?? []));

const startTime = (session) => new Date(session?.startDate || 0).getTime();

const sessionOptionLabel = (session) =>
  `${session.name || session.code}${session.isCurrent ? ' (current)' : ''}`;

/** The session that started last before the target: the usual source of a copy. */
const previousSessionId = (sessions, targetId) => {
  const target = sessions.find((s) => s._id === targetId);
  if (!target) return '';
  const earlier = sessions
    .filter((s) => s._id !== targetId && startTime(s) < startTime(target))
    .sort((a, b) => startTime(b) - startTime(a));
  return earlier[0]?._id || '';
};

const feeCaption = (fee) => [fee.feeType, fee.semester].filter(Boolean).join(' · ');

/**
 * Copies fees from one session into another. A dry run shows what would be created and
 * skipped first; nothing is written until the plan is confirmed. Copies start as Pending.
 */
export default function CopyFeesDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { sessionId: activeSessionId, sessions } = useActiveSession();

  const [initialised, setInitialised] = useState(false);
  const [fromSession, setFromSession] = useState('');
  const [toSession, setToSession] = useState('');
  const [pickFees, setPickFees] = useState(false);
  const [feeIds, setFeeIds] = useState([]);
  const [shiftDays, setShiftDays] = useState('');
  // The dry-run result and the request it was made with (sent again on confirm)
  const [plan, setPlan] = useState(null);
  const [request, setRequest] = useState(null);

  // Defaults on every open: into the header's session (else the current one), from the one before it.
  useEffect(() => {
    if (!open) {
      setInitialised(false);
      return;
    }
    if (initialised || !sessions.length) return;
    const target = activeSessionId || sessions.find((s) => s.isCurrent)?._id || '';
    setToSession(target);
    setFromSession(previousSessionId(sessions, target));
    setPickFees(false);
    setFeeIds([]);
    setShiftDays('');
    setPlan(null);
    setRequest(null);
    setInitialised(true);
  }, [open, initialised, sessions, activeSessionId]);

  const { data: feesData, isLoading: feesLoading } = useQuery({
    queryKey: ['fees', 'options', fromSession],
    queryFn: () => FeeApi.getFees({ session: fromSession }),
    enabled: open && Boolean(fromSession),
  });
  const sourceFees = asList(feesData);

  const previewMutation = useMutation({
    mutationFn: (body) => FeeApi.copySession({ ...body, dryRun: true }),
    onSuccess: (data, body) => {
      setPlan(data);
      setRequest(body);
    },
    onError: (error) =>
      enqueueSnackbar(error.message || 'Could not prepare the copy', { variant: 'error' }),
  });

  const copyMutation = useMutation({
    mutationFn: () => FeeApi.copySession({ ...request, dryRun: false }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      enqueueSnackbar(
        `${data?.created ?? 0} fee(s) copied to ${data?.to?.name || 'the session'} as Pending`,
        { variant: 'success' }
      );
      onClose();
    },
    onError: (error) =>
      enqueueSnackbar(error.message || 'Could not copy the fees', { variant: 'error' }),
  });

  const busy = previewMutation.isPending || copyMutation.isPending;

  const handleClose = () => {
    if (!busy) onClose();
  };

  const changeFrom = (value) => {
    setFromSession(value);
    setFeeIds([]);
  };

  const changeTo = (value) => {
    setToSession(value);
    if (value === fromSession) changeFrom(previousSessionId(sessions, value));
  };

  const toggleFee = (id) =>
    setFeeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allPicked = sourceFees.length > 0 && feeIds.length === sourceFees.length;

  const shiftText = shiftDays.trim();
  const shiftValid = shiftText === '' || Number.isInteger(Number(shiftText));
  const canPreview =
    Boolean(fromSession && toSession) &&
    fromSession !== toSession &&
    shiftValid &&
    (!pickFees || feeIds.length > 0);

  const handlePreview = () => {
    const body = { fromSession, toSession };
    if (pickFees) body.feeIds = feeIds;
    if (shiftText !== '') body.dueDateShiftDays = Number(shiftText);
    previewMutation.mutate(body);
  };

  const toCreate = plan?.create || [];
  const skipped = plan?.skip || [];
  const shiftWord = Math.abs(plan?.shiftDays || 0) === 1 ? 'day' : 'days';
  let shiftSummary = 'Due dates stay the same.';
  if (plan?.shiftDays > 0) shiftSummary = `Due dates move ${plan.shiftDays} ${shiftWord} later.`;
  if (plan?.shiftDays < 0) shiftSummary = `Due dates move ${-plan.shiftDays} ${shiftWord} earlier.`;

  const renderSetup = () => (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          select
          fullWidth
          label="Copy from"
          value={fromSession}
          onChange={(e) => changeFrom(e.target.value)}
        >
          {sessions
            .filter((s) => s._id !== toSession)
            .map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {sessionOptionLabel(s)}
              </MenuItem>
            ))}
        </TextField>
        <TextField
          select
          fullWidth
          label="Copy into"
          value={toSession}
          onChange={(e) => changeTo(e.target.value)}
        >
          {sessions.map((s) => (
            <MenuItem key={s._id} value={s._id}>
              {sessionOptionLabel(s)}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <TextField
        label="Move due dates by (days)"
        type="number"
        value={shiftDays}
        onChange={(e) => setShiftDays(e.target.value)}
        error={!shiftValid}
        helperText={
          shiftValid
            ? "Leave blank to move them by the gap between the two sessions' start dates"
            : 'Enter a whole number of days'
        }
        inputProps={{ step: 1 }}
      />

      <Box>
        <FormControlLabel
          control={<Switch checked={pickFees} onChange={(e) => setPickFees(e.target.checked)} />}
          label="Copy only some fees"
        />
        {!pickFees && (
          <Typography variant="body2" color="text.secondary">
            {feesLoading && fromSession
              ? 'Counting the fees...'
              : `All ${sourceFees.length} fee(s) in the source session will be copied. Fees already in the target session are skipped.`}
          </Typography>
        )}
      </Box>

      {pickFees && (
        <TableContainer
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 320 }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allPicked}
                    indeterminate={feeIds.length > 0 && !allPicked}
                    disabled={!sourceFees.length}
                    onChange={() => setFeeIds(allPicked ? [] : sourceFees.map((f) => f._id))}
                    inputProps={{ 'aria-label': 'Select all fees' }}
                  />
                </TableCell>
                <TableCell>Fee</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Due</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feesLoading &&
                [0, 1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton height={28} />
                    </TableCell>
                  </TableRow>
                ))}
              {!feesLoading &&
                sourceFees.map((fee) => (
                  <TableRow
                    key={fee._id}
                    hover
                    selected={feeIds.includes(fee._id)}
                    onClick={() => toggleFee(fee._id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={feeIds.includes(fee._id)} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{fee.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {feeCaption(fee)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(fee.amount)}</TableCell>
                    <TableCell>{formatDate(fee.dueDate)}</TableCell>
                  </TableRow>
                ))}
              {!feesLoading && !sourceFees.length && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No fees in this session
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );

  const renderPlan = () => (
    <Stack spacing={2.5} sx={{ pt: 1 }}>
      <Alert severity="info" variant="outlined">
        From <strong>{plan.from?.name}</strong> into <strong>{plan.to?.name}</strong>.{' '}
        {shiftSummary} Copies start as <strong>Pending</strong>, so nobody is billed until you
        activate them.
      </Alert>

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          To create ({toCreate.length})
        </Typography>
        {toCreate.length === 0 ? (
          <Alert severity="warning">
            Nothing to copy: every selected fee already exists in {plan.to?.name}.
          </Alert>
        ) : (
          <TableContainer
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 300 }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Fee</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>New due date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {toCreate.map((fee) => (
                  <TableRow key={fee.sourceId}>
                    <TableCell>
                      <Typography variant="body2">{fee.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {feeCaption(fee)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(fee.amount)}</TableCell>
                    <TableCell>{formatDate(fee.dueDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {skipped.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Skipped ({skipped.length})
          </Typography>
          <Stack spacing={0.75}>
            {skipped.map((fee) => (
              <Stack key={fee.sourceId} direction="row" spacing={1} alignItems="center">
                <Iconify
                  icon="eva:minus-circle-outline"
                  width={16}
                  sx={{ color: 'text.disabled' }}
                />
                <Typography variant="body2">{fee.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {fee.reason}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Copy fees from another session</DialogTitle>
      <DialogContent>{plan ? renderPlan() : renderSetup()}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {plan ? (
          <>
            <Button color="inherit" onClick={() => setPlan(null)} disabled={busy}>
              Back
            </Button>
            <LoadingButton
              variant="contained"
              loading={copyMutation.isPending}
              disabled={!toCreate.length}
              onClick={() => copyMutation.mutate()}
            >
              Copy {toCreate.length} fee{toCreate.length === 1 ? '' : 's'}
            </LoadingButton>
          </>
        ) : (
          <>
            <Button color="inherit" onClick={handleClose} disabled={busy}>
              Cancel
            </Button>
            <LoadingButton
              variant="contained"
              loading={previewMutation.isPending}
              disabled={!canPreview}
              onClick={handlePreview}
            >
              Preview
            </LoadingButton>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

CopyFeesDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
