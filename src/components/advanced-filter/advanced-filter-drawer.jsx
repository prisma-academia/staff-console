import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';

import Iconify from 'src/components/iconify';

/**
 * Config-driven filter panel. `fields` entries:
 *   { key, label, type: 'select' | 'text' | 'date', options?: [{ value, label }] }
 * Edits are kept as a draft and only sent to `onApply` when the user clicks Apply.
 */
export default function AdvancedFilterDrawer({ open, onClose, fields, values, onApply }) {
  const [draft, setDraft] = useState(values);

  useEffect(() => {
    if (open) setDraft(values);
    // Only reset the draft when the drawer opens, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setValue = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const handleApply = () => {
    onApply(Object.fromEntries(fields.map(({ key }) => [key, draft[key] || ''])));
    onClose();
  };

  const handleReset = () => {
    setDraft(Object.fromEntries(fields.map(({ key }) => [key, ''])));
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: 1, sm: 360 } } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </Stack>
      <Divider />

      <Stack spacing={2.5} sx={{ p: 2.5, flexGrow: 1, overflowY: 'auto' }}>
        {fields.map((field) => {
          const value = draft[field.key] || '';
          if (field.type === 'select') {
            return (
              <FormControl key={field.key} size="small" fullWidth>
                <InputLabel>{field.label}</InputLabel>
                <Select value={value} label={field.label} onChange={(e) => setValue(field.key, e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  {(field.options || []).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }
          return (
            <TextField
              key={field.key}
              size="small"
              fullWidth
              label={field.label}
              type={field.type === 'date' ? 'date' : 'text'}
              value={value}
              onChange={(e) => setValue(field.key, e.target.value)}
              InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
            />
          );
        })}
      </Stack>

      <Divider />
      <Box sx={{ p: 2.5, display: 'flex', gap: 1.5 }}>
        <Button fullWidth variant="outlined" color="inherit" onClick={handleReset}>
          Reset
        </Button>
        <Button fullWidth variant="contained" onClick={handleApply}>
          Apply
        </Button>
      </Box>
    </Drawer>
  );
}

AdvancedFilterDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  fields: PropTypes.array.isRequired,
  values: PropTypes.object.isRequired,
  onApply: PropTypes.func.isRequired,
};
