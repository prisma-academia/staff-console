import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Alert,
  Stack,
  Button,
  Dialog,
  Checkbox,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  FormControlLabel,
} from '@mui/material';

import { AssessmentApi } from 'src/api';
import { SPLIT_PRESETS } from 'src/utils/grading';

import SplitEditor, { checkRows, toPayloadRows, toEditableRows } from './split-editor';

/** Sets up many courses at once with the same split. */
export default function ApplySplitDialog({ open, courses, onClose, onDone }) {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [overwrite, setOverwrite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [outcome, setOutcome] = useState(null);

  useEffect(() => {
    if (open) {
      setRows(toEditableRows(SPLIT_PRESETS[0].rows));
      setOverwrite(false);
      setOutcome(null);
    }
  }, [open]);

  const alreadySetUp = courses.filter((c) => c.assessments?.length).length;
  const check = checkRows(rows);

  const apply = async () => {
    setSaving(true);
    try {
      const data = await AssessmentApi.applyTemplate({
        courseIds: courses.map((c) => c._id),
        assessments: toPayloadRows(rows),
        overwrite,
      });
      enqueueSnackbar(`${data?.updated ?? 0} course(s) set up`, { variant: 'success' });
      onDone?.();
      if (data?.skipped?.length) setOutcome(data);
      else onClose();
    } catch (err) {
      enqueueSnackbar(err?.data?.errors?.[0] || err?.data?.message || err?.message || 'Could not apply the split', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Set up {courses.length} course{courses.length === 1 ? '' : 's'}</DialogTitle>
      <DialogContent>
        {outcome ? (
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Alert severity="success">{outcome.updated} course(s) were set up.</Alert>
            <Typography variant="subtitle2">Not changed</Typography>
            {outcome.skipped.map((s) => (
              <Typography key={s.code} variant="body2">
                <b>{s.code}</b>: {s.reason}
              </Typography>
            ))}
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <SplitEditor rows={rows} onChange={setRows} />
            {alreadySetUp > 0 && (
              <FormControlLabel
                control={<Checkbox checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />}
                label={
                  <Typography variant="body2">
                    Also replace the split of the {alreadySetUp} course(s) already set up (courses that already have
                    scores are left alone)
                  </Typography>
                }
              />
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving} color="inherit">
          {outcome ? 'Close' : 'Cancel'}
        </Button>
        {!outcome && (
          <LoadingButton variant="contained" loading={saving} disabled={!check.ok} onClick={apply}>
            Apply
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

ApplySplitDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  courses: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onDone: PropTypes.func,
};
