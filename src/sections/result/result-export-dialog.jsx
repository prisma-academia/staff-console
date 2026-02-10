import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation } from '@tanstack/react-query';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { ResultApi, SessionApi, programApi, classLevelApi } from 'src/api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

function triggerBlobDownload(blob, defaultName) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export default function ResultExportDialog({ open, onClose }) {
  const { enqueueSnackbar } = useSnackbar();
  const [format, setFormat] = useState('xlsx');
  const [sessionId, setSessionId] = useState('');
  const [programId, setProgramId] = useState('');
  const [classLevelId, setClassLevelId] = useState('');
  const [semester, setSemester] = useState('');

  const { data: sessionOptions } = useQuery({
    queryKey: ['sessions'],
    queryFn: SessionApi.getSessions,
    enabled: open,
  });
  const { data: programOptions } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
    enabled: open,
  });
  const { data: classLevelOptions } = useQuery({
    queryKey: ['classLevels'],
    queryFn: classLevelApi.getClassLevels,
    enabled: open,
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const params = { format };
      if (sessionId) params.sessionId = sessionId;
      if (programId) params.programId = programId;
      if (classLevelId) params.classLevelId = classLevelId;
      if (semester) params.semester = semester;
      const blob = await ResultApi.exportResults(params);
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      triggerBlobDownload(blob, `results-export-${Date.now()}.${ext}`);
    },
    onSuccess: () => {
      enqueueSnackbar('Export downloaded successfully', { variant: 'success' });
      onClose();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Export failed', { variant: 'error' });
    },
  });

  const handleExport = () => {
    exportMutation.mutate();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export results</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Format</InputLabel>
            <Select
              value={format}
              label="Format"
              onChange={(e) => setFormat(e.target.value)}
            >
              <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Session (optional)</InputLabel>
            <Select
              value={sessionId}
              label="Session (optional)"
              onChange={(e) => setSessionId(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {(sessionOptions || []).map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.name || s.code || s._id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Program (optional)</InputLabel>
            <Select
              value={programId}
              label="Program (optional)"
              onChange={(e) => setProgramId(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {(programOptions || []).map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.name || p.code || p._id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Class level (optional)</InputLabel>
            <Select
              value={classLevelId}
              label="Class level (optional)"
              onChange={(e) => setClassLevelId(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {(classLevelOptions || []).map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.name || c._id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Semester (optional)</InputLabel>
            <Select
              value={semester}
              label="Semester (optional)"
              onChange={(e) => setSemester(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="First Semester">First Semester</MenuItem>
              <MenuItem value="Second Semester">Second Semester</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <LoadingButton
          variant="contained"
          onClick={handleExport}
          loading={exportMutation.isPending}
          startIcon={<Iconify icon="eva:download-fill" />}
        >
          Export
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

ResultExportDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
