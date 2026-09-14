import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LoadingButton from '@mui/lab/LoadingButton';

import { exportTable, EXPORT_FORMATS } from 'src/utils/export-table';

import Iconify from 'src/components/iconify';

/**
 * Export button that downloads every record matching the current filters.
 * `fetchRows` must resolve to { columns: [{ key, label }], rows: [...] }.
 */
export default function ExportMenu({ fetchRows, title, fileBase, filterSummary, count, disabled }) {
  const { enqueueSnackbar } = useSnackbar();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExport = async (format) => {
    setAnchorEl(null);
    setLoading(true);
    try {
      const { columns, rows } = await fetchRows();
      if (!rows?.length) {
        enqueueSnackbar('No records match the current filters', { variant: 'info' });
        return;
      }
      await exportTable({ format, columns, rows, title, fileBase, filterSummary });
      enqueueSnackbar(`Exported ${rows.length} records`, { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error?.message || 'Export failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingButton
        variant="outlined"
        loading={loading}
        disabled={disabled}
        startIcon={<Iconify icon="eva:download-fill" />}
        endIcon={<Iconify icon="eva:chevron-down-fill" />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ px: 3 }}
      >
        Export
      </LoadingButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {typeof count === 'number' && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 1, display: 'block' }}>
            {count} matching record{count === 1 ? '' : 's'}
          </Typography>
        )}
        {EXPORT_FORMATS.map((format) => (
          <MenuItem key={format.value} onClick={() => handleExport(format.value)} disabled={count === 0}>
            <ListItemIcon>
              <Iconify icon={format.icon} />
            </ListItemIcon>
            <ListItemText>{format.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

ExportMenu.propTypes = {
  fetchRows: PropTypes.func.isRequired,
  title: PropTypes.string,
  fileBase: PropTypes.string,
  filterSummary: PropTypes.arrayOf(PropTypes.string),
  count: PropTypes.number,
  disabled: PropTypes.bool,
};
