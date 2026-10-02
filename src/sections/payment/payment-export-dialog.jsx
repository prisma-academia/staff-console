import PropTypes from 'prop-types';

import {
  Chip,
  Stack,
  Button,
  Dialog,
  Select,
  MenuItem,
  useTheme,
  InputLabel,
  Typography,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  useMediaQuery,
} from '@mui/material';

// Server-side export of every payment matching the current filters (up to 20,000 rows).
export default function PaymentExportDialog({
  open,
  onClose,
  format,
  onFormatChange,
  onExport,
  isExporting,
  count,
  filterSummary = [],
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog open={open} onClose={isExporting ? undefined : onClose} fullWidth maxWidth="xs" fullScreen={fullScreen}>
      <DialogTitle>Export payments</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {typeof count === 'number'
            ? `${count.toLocaleString()} payment${count === 1 ? '' : 's'} match the current filters.`
            : 'Exports every payment matching the current filters.'}
        </Typography>
        {filterSummary.length > 0 && (
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ mb: 2 }}>
            {filterSummary.map((text) => (
              <Chip key={text} size="small" label={text} />
            ))}
          </Stack>
        )}
        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
          <InputLabel id="payment-export-format-label">Format</InputLabel>
          <Select
            labelId="payment-export-format-label"
            value={format}
            label="Format"
            onChange={(event) => onFormatChange(event.target.value)}
          >
            <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
            <MenuItem value="csv">CSV (.csv)</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isExporting} color="inherit">
          Cancel
        </Button>
        <Button variant="contained" onClick={onExport} disabled={isExporting || count === 0}>
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PaymentExportDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  format: PropTypes.string.isRequired,
  onFormatChange: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  isExporting: PropTypes.bool,
  count: PropTypes.number,
  filterSummary: PropTypes.arrayOf(PropTypes.string),
};
