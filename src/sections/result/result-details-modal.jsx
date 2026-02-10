import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { ResultApi } from 'src/api';

import Iconify from 'src/components/iconify';

function getStudentId(result) {
  const s = result.student;
  return typeof s === 'object' ? s?._id : s;
}

function getClassLevelId(result) {
  const c = result.classLevel;
  return typeof c === 'object' ? c?._id : c;
}

function getSessionId(result) {
  const s = result.session;
  return typeof s === 'object' ? s?._id : s;
}

function triggerBlobDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export default function ResultDetailsModal({ open, onClose, result }) {
  const { enqueueSnackbar } = useSnackbar();
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [gpaData, setGpaData] = useState(null);

  const studentId = result ? getStudentId(result) : null;
  const classLevelId = result ? getClassLevelId(result) : null;
  const sessionId = result ? getSessionId(result) : null;
  const semester = result?.semester;
  const canDownloadPdf = Boolean(studentId && classLevelId && semester);

  const handleDownloadPdf = async () => {
    if (!canDownloadPdf) return;
    setLoadingPdf(true);
    try {
      const blob = await ResultApi.downloadStudentResultPdf(studentId, classLevelId, semester);
      triggerBlobDownload(
        blob,
        `result-${studentId}-${classLevelId}-${(semester || '').replace(/\s/g, '-')}.pdf`
      );
      enqueueSnackbar('PDF downloaded', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to download PDF', { variant: 'error' });
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleLoadGpa = async () => {
    if (!studentId) return;
    try {
      const data = await ResultApi.getStudentGpa(studentId, {
        sessionId: sessionId || undefined,
        semester: semester || undefined,
      });
      setGpaData(data);
    } catch {
      setGpaData(null);
    }
  };

  if (!result) return null;

  const studentName =
    typeof result.student === 'object' && result.student?.personalInfo
      ? [result.student.personalInfo.firstName, result.student.personalInfo.lastName]
          .filter(Boolean)
          .join(' ') || 'N/A'
      : 'N/A';
  const programName = result.program?.name ?? (result.program || 'N/A');
  const classLevelName = result.classLevel?.name ?? (result.classLevel || 'N/A');
  const courseName = result.course
    ? `${result.course.code || ''} ${result.course.name || ''}`.trim() || 'N/A'
    : 'N/A';
  const sessionName =
    result.session?.name ?? result.session?.code ?? (result.session || 'N/A');
  const createdDate = result.createdAt
    ? new Date(result.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Result details</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Registration number</Typography>
              <Typography variant="body2">{result.regNumber || '—'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Student</Typography>
              <Typography variant="body2">{studentName}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Program</Typography>
              <Typography variant="body2">{programName}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Class level</Typography>
              <Typography variant="body2">{classLevelName}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Course</Typography>
              <Typography variant="body2">{courseName}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Score / Grade</Typography>
              <Typography variant="body2">{result.score ?? '—'} / {result.grade || '—'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Semester</Typography>
              <Typography variant="body2">{result.semester || '—'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Year</Typography>
              <Typography variant="body2">{result.year ?? '—'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Session</Typography>
              <Typography variant="body2">{sessionName}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Remark</Typography>
              <Typography variant="body2">{result.remark || '—'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Created</Typography>
              <Typography variant="body2">{createdDate}</Typography>
            </Grid>
            {gpaData && (
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">GPA / CGPA</Typography>
                <Typography variant="body2">
                  {gpaData.gpa != null ? gpaData.gpa : gpaData.cgpa ?? '—'}
                </Typography>
              </Grid>
            )}
          </Grid>
          {studentId && !gpaData && (
            <Button size="small" onClick={handleLoadGpa}>
              Load GPA / CGPA
            </Button>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {canDownloadPdf && (
          <LoadingButton
            variant="contained"
            onClick={handleDownloadPdf}
            loading={loadingPdf}
            startIcon={<Iconify icon="eva:download-fill" />}
          >
            Download result PDF
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

ResultDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  result: PropTypes.object,
};
