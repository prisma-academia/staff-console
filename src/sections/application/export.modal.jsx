import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  Info,
  Close,
  Download,
  DateRange,
  CalendarMonth,
} from '@mui/icons-material';
import {
  Box,
  Fade,
  Stack,
  Alert,
  Paper,
  Dialog,
  Button,
  Select,
  Tooltip,
  Divider,
  MenuItem,
  useTheme,
  TextField,
  Typography,
  IconButton,
  InputLabel,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { listSessions, listProgrammes, exportApplicationsCsv } from 'src/api/adminApplicationApi';

const EXPORT_STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'not paid', label: 'Not paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
];

export default function ExportModal({ open, onClose }) {
  const theme = useTheme();
  const [sessionId, setSessionId] = useState('');
  const [status, setStatus] = useState('');
  const [programme, setProgramme] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const { data: sessionsResult } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: () => listSessions(),
    enabled: open,
  });
  const { data: programmesResult } = useQuery({
    queryKey: ['admin-programmes'],
    queryFn: () => listProgrammes(),
    enabled: open,
  });

  const sessions = sessionsResult?.data ?? [];
  const programmes = programmesResult?.data ?? [];

  useEffect(() => {
    if (open) {
      setSessionId('');
      setStatus('');
      setProgramme('');
      setStartDate('');
      setEndDate('');
      setIsExporting(false);
      setError('');
    }
  }, [open]);

  const handleExport = async () => {
    if (!sessionId) {
      setError('Please select a session');
      return;
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date');
      return;
    }

    setError('');
    try {
      setIsExporting(true);
      const params = { sessionId };
      if (status) params.status = status;
      if (programme) params.programme = programme;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const { blob, filename } = await exportApplicationsCsv(params);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename || `applications_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onClose();
    } catch (err) {
      console.error('Export error:', err);
      setError(err.message || 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      TransitionComponent={Fade}
      transitionDuration={300}
      PaperProps={{
        elevation: 6,
        sx: { borderRadius: 2, overflow: 'hidden' },
      }}
    >
      <DialogTitle
        sx={{
          p: 2.5,
          bgcolor: theme.palette.primary.main,
          color: 'white',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <DateRange />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Export Applications
            </Typography>
          </Stack>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close" sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ pt: 1, pb: 2 }}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: theme.palette.grey[50],
              p: 2,
              borderRadius: 1.5,
              border: `1px solid ${theme.palette.divider}`,
              mb: 3,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Info color="primary" sx={{ mt: 0.2 }} />
              <Typography variant="body2" color="text.secondary">
                Export applications as CSV by selecting a session. Optionally filter by status, programme, and date range (created date).
              </Typography>
            </Stack>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Stack spacing={3.5}>
            <Box>
              <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1.5 }}>
                Session (required)
              </Typography>
              <FormControl fullWidth required>
                <InputLabel id="session-select-label">Session</InputLabel>
                <Select
                  labelId="session-select-label"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  label="Session"
                  // disabled={sessionsLoading}
                  MenuProps={{
                    PaperProps: {
                      sx: { zIndex: theme.zIndex.modal + 1 },
                    },
                  }}
                  sx={{ borderRadius: 1.5 }}
                >
                  {(sessions || []).map((session) => (
                    <MenuItem key={session._id || session.id} value={session._id || session.id}>
                      {session.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ opacity: 0.5 }} />

            <Box>
              <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1.5 }}>
                Status (optional)
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="export-status-label">Status</InputLabel>
                <Select
                  labelId="export-status-label"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  label="Status"
                  MenuProps={{
                    PaperProps: {
                      sx: { zIndex: theme.zIndex.modal + 1 },
                    },
                  }}
                  sx={{ borderRadius: 1.5 }}
                >
                  {EXPORT_STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.primary" sx={{ mb: 1.5 }}>
                Programme (optional)
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="export-programme-label">Programme</InputLabel>
                <Select
                  labelId="export-programme-label"
                  value={programme}
                  onChange={(e) => setProgramme(e.target.value)}
                  label="Programme"
                  MenuProps={{
                    PaperProps: {
                      sx: { zIndex: theme.zIndex.modal + 1 },
                    },
                  }}
                  sx={{ borderRadius: 1.5 }}
                >
                  <MenuItem value="">
                    <em>All</em>
                  </MenuItem>
                  {(programmes || []).map((p) => (
                    <MenuItem key={p._id || p.id} value={p._id || p.id}>
                      {p.name || p._id || p.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ opacity: 0.5 }} />

            <Box>
              <Typography
                variant="subtitle2"
                color="text.primary"
                sx={{ mb: 1.5, display: 'flex', alignItems: 'center', '& svg': { mr: 1 } }}
              >
                <CalendarMonth fontSize="small" /> Date range (optional)
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{
                  '& .MuiTextField-root': {
                    transition: 'all 0.2s',
                    '&:hover': { '& .MuiOutlinedInput-root': { borderColor: theme.palette.primary.main } },
                  },
                }}
              >
                <Tooltip title="Filter by start date" arrow placement="top">
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: { borderRadius: 1.5 } }}
                  />
                </Tooltip>
                <Tooltip title="Filter by end date" arrow placement="top">
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{ sx: { borderRadius: 1.5 } }}
                  />
                </Tooltip>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: theme.palette.grey[50] }}>
        <Stack direction="row" spacing={1.5} width="100%" justifyContent="flex-end">
          <Button
            onClick={onClose}
            color="inherit"
            variant="outlined"
            disabled={isExporting}
            sx={{
              borderRadius: 1.5,
              px: 3,
              borderColor: theme.palette.divider,
              '&:hover': { borderColor: theme.palette.text.secondary, bgcolor: 'rgba(0,0,0,0.02)' },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={!sessionId || isExporting}
            startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <Download />}
            sx={{
              borderRadius: 1.5,
              px: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transition: 'all 0.2s',
              '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.12)', transform: 'translateY(-1px)' },
            }}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

ExportModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
