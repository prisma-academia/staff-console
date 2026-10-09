import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Alert,
  Stack,
  Button,
  Dialog,
  Drawer,
  Divider,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { AssessmentApi } from 'src/api';

import Iconify from 'src/components/iconify';

import SplitEditor, { checkRows, toPayloadRows, toEditableRows } from './split-editor';

/**
 * Side panel to set up how one course is assessed. Saving replaces the course's
 * whole split; removing an assessment that already has scores asks first.
 */
export default function AssessmentSetupDrawer({ course, open, onClose, onSaved, readOnly = false }) {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [confirm, setConfirm] = useState(null); // [{ type, scores }]

  useEffect(() => {
    if (open && course) {
      setRows(toEditableRows(course.assessments));
      setErrors([]);
      setConfirm(null);
    }
  }, [open, course]);

  const check = checkRows(rows);
  const lockedResults = (course?.results?.approved || 0) + (course?.results?.published || 0);

  const save = async (confirmDeleteScores = false) => {
    setSaving(true);
    setErrors([]);
    try {
      await AssessmentApi.saveCourseSetup(course._id, { assessments: toPayloadRows(rows), confirmDeleteScores });
      enqueueSnackbar(`Assessments for ${course.code} saved`, { variant: 'success' });
      setConfirm(null);
      onSaved?.();
      onClose();
    } catch (err) {
      const needs = err?.data?.data?.needsConfirmation;
      if (err?.status === 409 && Array.isArray(needs)) {
        setConfirm(needs);
      } else {
        setErrors(Array.isArray(err?.data?.errors) && err.data.errors.length ? err.data.errors : [err?.data?.message || err?.message || 'Could not save']);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={() => !saving && onClose()} PaperProps={{ sx: { width: { xs: '100%', sm: 560 } } }}>
        <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ p: 2.5, pb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              Assessment setup
            </Typography>
            <Typography variant="h6" noWrap>
              {course?.code} · {course?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {[course?.classLevel?.name, course?.semester, course?.credit != null ? `${course.credit} units` : null].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          <IconButton onClick={onClose} disabled={saving} aria-label="Close">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>
        <Divider />

        <Box sx={{ p: 2.5, flex: 1, overflowY: 'auto' }}>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              List the assessments of this course and what each is marked out of. Lecturers enter raw marks
              on the score sheet; the course total out of 100 is worked out from this split. The setup is
              shared by every programme that offers the course.
            </Typography>
            {lockedResults > 0 && (
              <Alert severity="info">
                {lockedResults} result(s) of this course are approved or published. Assessments with scores behind
                them can&apos;t be changed until those results are reopened.
              </Alert>
            )}
            <SplitEditor rows={rows} onChange={setRows} disabled={readOnly} />
            {errors.map((error) => (
              <Alert key={error} severity="error">
                {error}
              </Alert>
            ))}
          </Stack>
        </Box>

        <Divider />
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <LoadingButton variant="contained" loading={saving} disabled={!check.ok} onClick={() => save(false)}>
              Save setup
            </LoadingButton>
          )}
        </Stack>
      </Drawer>

      <Dialog open={Boolean(confirm)} onClose={() => !saving && setConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete recorded scores?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            You removed assessments that already have scores. Saving deletes these scores for good:
          </Typography>
          {(confirm || []).map((c) => (
            <Typography key={c.type} variant="body2" sx={{ fontWeight: 600 }}>
              • {c.type}: {c.scores} score{c.scores === 1 ? '' : 's'}
            </Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)} disabled={saving} color="inherit">
            Keep editing
          </Button>
          <LoadingButton color="error" variant="contained" loading={saving} onClick={() => save(true)}>
            Delete scores and save
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

AssessmentSetupDrawer.propTypes = {
  course: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func,
  readOnly: PropTypes.bool,
};
