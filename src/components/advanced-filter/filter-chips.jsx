import PropTypes from 'prop-types';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

// "Label: value" for each active filter, using option labels for selects.
export const describeFilters = (fields, values, search) => {
  const parts = fields
    .filter(({ key }) => values[key])
    .map((field) => {
      const option = (field.options || []).find((o) => String(o.value) === String(values[field.key]));
      return { key: field.key, text: `${field.label}: ${option ? option.label : values[field.key]}` };
    });
  if (search) parts.unshift({ key: 'search', text: `Search: ${search}` });
  return parts;
};

export default function FilterChips({ fields, values, search, onRemove, onClearAll }) {
  const active = describeFilters(fields, values, search);
  if (!active.length) return null;

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center" sx={{ px: 2, pb: 2 }}>
      {active.map(({ key, text }) => (
        <Chip key={key} size="small" label={text} onDelete={() => onRemove(key)} />
      ))}
      <Button size="small" color="inherit" onClick={onClearAll}>
        Clear all
      </Button>
    </Stack>
  );
}

FilterChips.propTypes = {
  fields: PropTypes.array.isRequired,
  values: PropTypes.object.isRequired,
  search: PropTypes.string,
  onRemove: PropTypes.func.isRequired,
  onClearAll: PropTypes.func.isRequired,
};
