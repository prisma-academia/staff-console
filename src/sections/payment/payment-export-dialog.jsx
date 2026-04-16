import PropTypes from 'prop-types';

import {
  Button,
  Dialog,
  Select,
  MenuItem,
  InputLabel,
  Typography,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
} from '@mui/material';

export default function PaymentExportDialog({
  open,
  onClose,
  format,
  onFormatChange,
  onExport,
  isExporting,
}) {
  return (
    <Dialog open={open} onClose={isExporting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Export payments</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Export the payments currently shown by your active filters.
        </Typography>
        <FormControl fullWidth size="small">
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
        <Button variant="contained" onClick={onExport} disabled={isExporting}>
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
};
