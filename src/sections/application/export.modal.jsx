import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { 
  Info, 
  Close, 
  School, 
  Download, 
  DateRange, 
  CalendarMonth 
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

import config from 'src/config';
import { useAuthStore } from 'src/store';

import { programApi } from '../../api';

export default function ExportModal({ open, onClose }) {
  const theme = useTheme();
  const token = useAuthStore((state) => state.token);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  // Get programs using the API
  const { data: programmeOptions, isLoading: programsLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
    enabled: open, // Only fetch when modal is open
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setStartDate('');
      setEndDate('');
      setSelectedProgramme('');
      setIsExporting(false);
      setError('');
    }
  }, [open]);

  const handleExport = async () => {
    // Validate form
    if (!startDate) {
      setError('Please select a start date');
      return;
    }
    
    if (!endDate) {
      setError('Please select an end date');
      return;
    }
    
    if (!selectedProgramme) {
      setError('Please select a programme');
      return;
    }
    
    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date');
      return;
    }

    setError('');
    
    try {
      setIsExporting(true);
      
      // Create export URL with query parameters
      const apiVersion = config.apiVersion.startsWith('/') ? config.apiVersion : `/${config.apiVersion}`;
      const exportUrl = `${config.applicationBaseUrl}${apiVersion}/application/export-csv?startDate=${startDate}&endDate=${endDate}&programme=${encodeURIComponent(selectedProgramme)}`;
      
      // Fetch the export data
      const response = await fetch(exportUrl, {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Get the filename from the content-disposition header or use a default
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `applications_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
        
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      onClose();
    } catch (err) {
      console.error('Export error:', err.message);
      setError('Failed to export data. Please try again.');
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
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 2.5, 
        bgcolor: theme.palette.primary.main,
        color: 'white'
      }}>
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
              mb: 3
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Info color="primary" sx={{ mt: 0.2 }} />
              <Typography variant="body2" color="text.secondary">
                Export applications data by selecting a date range and programme. Only records matching your criteria will be included in the export file.
              </Typography>
            </Stack>
          </Paper>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          
          <Stack spacing={3.5}>
            <Box>
              <Typography 
                variant="subtitle2" 
                color="text.primary" 
                sx={{ 
                  mb: 1.5, 
                  display: 'flex', 
                  alignItems: 'center',
                  '& svg': { mr: 1 }
                }}
              >
                <CalendarMonth fontSize="small" /> Date Range
              </Typography>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2}
                sx={{
                  '& .MuiTextField-root': {
                    transition: 'all 0.2s',
                    '&:hover': {
                      '& .MuiOutlinedInput-root': {
                        borderColor: theme.palette.primary.main,
                      }
                    }
                  }
                }}
              >
                <Tooltip title="Select start date" arrow placement="top">
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                  />
                </Tooltip>
                <Tooltip title="Select end date" arrow placement="top">
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      sx: { borderRadius: 1.5 }
                    }}
                  />
                </Tooltip>
              </Stack>
            </Box>
            
            <Divider sx={{ opacity: 0.5 }} />
            
            <Box>
              <Typography 
                variant="subtitle2" 
                color="text.primary" 
                sx={{ 
                  mb: 1.5,
                  display: 'flex', 
                  alignItems: 'center',
                  '& svg': { mr: 1 }
                }}
              >
                <School fontSize="small" /> Programme Selection
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="programme-select-label">Programme</InputLabel>
                <Select
                  labelId="programme-select-label"
                  value={selectedProgramme}
                  onChange={(e) => setSelectedProgramme(e.target.value)}
                  label="Programme"
                  disabled={programsLoading}
                  sx={{ 
                    borderRadius: 1.5,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                    }
                  }}
                >
                  {programsLoading ? (
                    <MenuItem value="">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={20} />
                        <Typography>Loading programmes...</Typography>
                      </Stack>
                    </MenuItem>
                  ) : [
                    // Show "No programmes available" message when array is empty
                    ...(programmeOptions?.length === 0 ? [
                      <MenuItem key="no-programs" value="" disabled>
                        No programmes available
                      </MenuItem>
                    ] : []),
                    
                    // Map program options to MenuItems
                    ...(programmeOptions || []).map((program) => (
                      <MenuItem key={program.id} value={program.name}>
                        {program.name}
                      </MenuItem>
                    ))
                  ]}
                </Select>
              </FormControl>
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
              '&:hover': {
                borderColor: theme.palette.text.secondary,
                bgcolor: 'rgba(0,0,0,0.02)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleExport}
            disabled={!startDate || !endDate || !selectedProgramme || isExporting}
            startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <Download />}
            sx={{ 
              borderRadius: 1.5,
              px: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                transform: 'translateY(-1px)'
              }
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