import PropTypes from 'prop-types';

import { Box, Stack, Button, Tooltip, TextField, IconButton, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * Add/remove/reorder editor for the document and note lists.
 *
 * These stay plain text rather than rich text: they are rendered by the
 * `documents` and `notes` blocks, whose list markup the letter template owns.
 */
export default function ListEditor({ label, helper, items, onChange, disabled }) {
  const update = (index, value) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };
  const remove = (index) => onChange(items.filter((_, i) => i !== index));
  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{label}</Typography>
      {helper && (
        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      )}
      {items.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No entries yet.
        </Typography>
      )}
      {items.map((item, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
          <TextField
            fullWidth
            multiline
            size="small"
            value={item}
            disabled={disabled}
            onChange={(e) => update(index, e.target.value)}
          />
          <Tooltip title="Move up">
            <span>
              <IconButton size="small" disabled={disabled || index === 0} onClick={() => move(index, -1)}>
                <Iconify icon="eva:arrow-up-fill" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Move down">
            <span>
              <IconButton
                size="small"
                disabled={disabled || index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <Iconify icon="eva:arrow-down-fill" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Remove">
            <span>
              <IconButton size="small" color="error" disabled={disabled} onClick={() => remove(index)}>
                <Iconify icon="eva:trash-2-outline" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ))}
      <Box>
        <Button
          size="small"
          disabled={disabled}
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={() => onChange([...items, ''])}
        >
          Add
        </Button>
      </Box>
    </Stack>
  );
}

ListEditor.propTypes = {
  label: PropTypes.string,
  helper: PropTypes.string,
  items: PropTypes.array,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};
