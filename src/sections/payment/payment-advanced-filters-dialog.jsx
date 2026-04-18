import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

export const ADVANCED_FILTER_INITIAL = {
  reference: '',
  gateway: '',
  sessionId: '',
  feeType: '',
  semester: '',
  feeStatus: '',
  programId: '',
  classLevelId: '',
  startDate: '',
  endDate: '',
  amountMin: '',
  amountMax: '',
};

const GATEWAY_OPTIONS = [
  { value: '', label: 'All gateways' },
  { value: 'Paystack', label: 'Paystack' },
  { value: 'Flutterwave', label: 'Flutterwave' },
  { value: 'Paypal', label: 'Paypal' },
  { value: 'Stripe', label: 'Stripe' },
];

const FEE_TYPE_OPTIONS = [
  { value: '', label: 'All fee types' },
  { value: 'Tuition', label: 'Tuition' },
  { value: 'Hostel', label: 'Hostel' },
  { value: 'Laboratory', label: 'Laboratory' },
  { value: 'Others', label: 'Others' },
];

const FEE_STATUS_OPTIONS = [
  { value: '', label: 'All fee statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Active', label: 'Active' },
  { value: 'Overdue', label: 'Overdue' },
];

const SEMESTER_OPTIONS = [
  { value: '', label: 'All semesters' },
  { value: 'First Semester', label: 'First Semester' },
  { value: 'Second Semester', label: 'Second Semester' },
];

export function pickAdvancedFilters(filters = {}) {
  return {
    reference: filters.reference ?? '',
    gateway: filters.gateway ?? '',
    sessionId: filters.sessionId ?? '',
    feeType: filters.feeType ?? '',
    semester: filters.semester ?? '',
    feeStatus: filters.feeStatus ?? '',
    programId: filters.programId ?? '',
    classLevelId: filters.classLevelId ?? '',
    startDate: filters.startDate ?? '',
    endDate: filters.endDate ?? '',
    amountMin: filters.amountMin ?? '',
    amountMax: filters.amountMax ?? '',
  };
}

export function countActiveAdvancedFilters(filters = {}) {
  const a = pickAdvancedFilters(filters);
  return Object.values(a).filter((v) => v !== '' && v != null).length;
}

export default function PaymentAdvancedFiltersDialog({
  open,
  onClose,
  appliedFilters,
  onApply,
  onClearAdvanced,
  sessionList,
  programList,
  classLevelList,
}) {
  const [draft, setDraft] = useState(() => pickAdvancedFilters(appliedFilters));

  useEffect(() => {
    if (open) {
      setDraft(pickAdvancedFilters(appliedFilters));
    }
    // Only re-seed when the modal opens so in-modal edits are not overwritten by parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: sync draft once on open
  }, [open]);

  const setDraftField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleClear = () => {
    setDraft({ ...ADVANCED_FILTER_INITIAL });
    onClearAdvanced();
  };

  const handleCancel = () => {
    setDraft(pickAdvancedFilters(appliedFilters));
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>Advanced filters</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Narrow payments by gateway, session, fee metadata, programme, class, dates, amounts, or
          exact reference. Basic filters on the page still apply.
        </Typography>
        <Stack spacing={2}>
          <TextField
            size="small"
            fullWidth
            label="Reference"
            value={draft.reference}
            onChange={(e) => setDraftField('reference', e.target.value)}
          />
          <FormControl size="small" fullWidth>
            <InputLabel id="adv-gateway-label">Gateway</InputLabel>
            <Select
              labelId="adv-gateway-label"
              label="Gateway"
              value={draft.gateway}
              onChange={(e) => setDraftField('gateway', e.target.value)}
            >
              {GATEWAY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="adv-session-label">Session</InputLabel>
            <Select
              labelId="adv-session-label"
              label="Session"
              value={draft.sessionId}
              onChange={(e) => setDraftField('sessionId', e.target.value)}
            >
              <MenuItem value="">All sessions</MenuItem>
              {(sessionList || []).map((session) => (
                <MenuItem key={session._id} value={session._id}>
                  {session.name || session.code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="adv-fee-type-label">Fee type</InputLabel>
            <Select
              labelId="adv-fee-type-label"
              label="Fee type"
              value={draft.feeType}
              onChange={(e) => setDraftField('feeType', e.target.value)}
            >
              {FEE_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="adv-semester-label">Semester</InputLabel>
            <Select
              labelId="adv-semester-label"
              label="Semester"
              value={draft.semester}
              onChange={(e) => setDraftField('semester', e.target.value)}
            >
              {SEMESTER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="adv-fee-status-label">Fee status</InputLabel>
            <Select
              labelId="adv-fee-status-label"
              label="Fee status"
              value={draft.feeStatus}
              onChange={(e) => setDraftField('feeStatus', e.target.value)}
            >
              {FEE_STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="adv-program-label">Program</InputLabel>
            <Select
              labelId="adv-program-label"
              label="Program"
              value={draft.programId}
              onChange={(e) => setDraftField('programId', e.target.value)}
            >
              <MenuItem value="">All programs</MenuItem>
              {(programList || []).map((program) => (
                <MenuItem key={program._id} value={program._id}>
                  {program.name || program.code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="adv-class-label">Class level</InputLabel>
            <Select
              labelId="adv-class-label"
              label="Class level"
              value={draft.classLevelId}
              onChange={(e) => setDraftField('classLevelId', e.target.value)}
            >
              <MenuItem value="">All class levels</MenuItem>
              {(classLevelList || []).map((classLevel) => (
                <MenuItem key={classLevel._id} value={classLevel._id}>
                  {classLevel.name || classLevel.code}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <TextField
              size="small"
              label="Start date"
              type="date"
              value={draft.startDate}
              onChange={(e) => setDraftField('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              size="small"
              label="End date"
              type="date"
              value={draft.endDate}
              onChange={(e) => setDraftField('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <TextField
              size="small"
              label="Min amount"
              type="number"
              value={draft.amountMin}
              onChange={(e) => setDraftField('amountMin', e.target.value)}
            />
            <TextField
              size="small"
              label="Max amount"
              type="number"
              value={draft.amountMax}
              onChange={(e) => setDraftField('amountMax', e.target.value)}
            />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={handleCancel}>
          Cancel
        </Button>
        <Button color="secondary" onClick={handleClear}>
          Clear advanced
        </Button>
        <Button variant="contained" onClick={handleApply}>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PaymentAdvancedFiltersDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  appliedFilters: PropTypes.object.isRequired,
  onApply: PropTypes.func.isRequired,
  onClearAdvanced: PropTypes.func.isRequired,
  sessionList: PropTypes.array,
  programList: PropTypes.array,
  classLevelList: PropTypes.array,
};
