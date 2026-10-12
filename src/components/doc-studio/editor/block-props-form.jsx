import { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Chip,
  Stack,
  Switch,
  Slider,
  Button,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  Autocomplete,
  FormControlLabel,
} from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

/** An editable list of strings (documents to bring, notes, signers…). */
function StringListField({ label, value, onChange, disabled, maxItems }) {
  const [draft, setDraft] = useState('');
  const items = Array.isArray(value) ? value : [];

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    onChange([...items, text]);
    setDraft('');
  };

  const move = (index, delta) => {
    const next = [...items];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Stack spacing={0.75} sx={{ mt: 0.75 }}>
        {items.map((item, index) => (
          <Stack key={`${index}-${item.slice(0, 12)}`} direction="row" spacing={0.5} alignItems="flex-start">
            <TextField
              size="small"
              fullWidth
              multiline
              maxRows={4}
              value={item}
              disabled={disabled}
              onChange={(event) => onChange(items.map((entry, i) => (i === index ? event.target.value : entry)))}
            />
            <Stack direction="row" sx={{ pt: 0.25 }}>
              <IconButton size="small" disabled={disabled || index === 0} onClick={() => move(index, -1)}>
                <Iconify icon="mdi:arrow-up" width={16} />
              </IconButton>
              <IconButton size="small" disabled={disabled || index === items.length - 1} onClick={() => move(index, 1)}>
                <Iconify icon="mdi:arrow-down" width={16} />
              </IconButton>
              <IconButton size="small" color="error" disabled={disabled} onClick={() => onChange(items.filter((_, i) => i !== index))}>
                <Iconify icon="mdi:close" width={16} />
              </IconButton>
            </Stack>
          </Stack>
        ))}
        {(!maxItems || items.length < maxItems) && (
          <Stack direction="row" spacing={0.75}>
            <TextField
              size="small"
              fullWidth
              placeholder="Add an item — {{variables}} work here"
              value={draft}
              disabled={disabled}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  add();
                }
              }}
            />
            <Button size="small" variant="outlined" onClick={add} disabled={disabled || !draft.trim()}>
              Add
            </Button>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

StringListField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.array,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  maxItems: PropTypes.number,
};

// ----------------------------------------------------------------------

/**
 * Renders a block's props schema (as served by the API) as a form. The server
 * re-validates every value on save and at render; this only makes the valid
 * choices easy.
 */
export default function BlockPropsForm({ schema, value, onChange, variables, signatories, disabled }) {
  const props = value || {};
  const set = (key, next) => onChange({ ...props, [key]: next });
  const entries = Object.entries(schema || {});

  if (!entries.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        This block has no settings — it adapts to each record automatically.
      </Typography>
    );
  }

  const variableOptions = variables || [];
  const labelOf = (key) => variableOptions.find((variable) => variable.key === key)?.label || key;

  return (
    <Stack spacing={2}>
      {entries.map(([key, field]) => {
        const current = props[key] === undefined ? field.default : props[key];

        if (field.type === 'bool') {
          return (
            <FormControlLabel
              key={key}
              control={<Switch size="small" checked={!!current} disabled={disabled} onChange={(event) => set(key, event.target.checked)} />}
              label={<Typography variant="body2">{field.label}</Typography>}
            />
          );
        }

        if (field.type === 'enum') {
          return (
            <TextField key={key} select size="small" label={field.label} value={current ?? ''} disabled={disabled} onChange={(event) => set(key, event.target.value)}>
              {(field.options || []).map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label || option.value}
                </MenuItem>
              ))}
            </TextField>
          );
        }

        if (field.type === 'int') {
          return (
            <Box key={key}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {field.label}
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  {current}
                </Typography>
              </Stack>
              <Slider size="small" min={field.min ?? 0} max={field.max ?? 100} value={Number(current) || 0} disabled={disabled} onChange={(_event, next) => set(key, next)} />
            </Box>
          );
        }

        if (field.type === 'variable') {
          return (
            <TextField key={key} select size="small" label={field.label} value={current || ''} disabled={disabled} onChange={(event) => set(key, event.target.value)}>
              {variableOptions.map((variable) => (
                <MenuItem key={variable.key} value={variable.key}>
                  {variable.label}
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {`{{${variable.key}}}`}
                  </Typography>
                </MenuItem>
              ))}
            </TextField>
          );
        }

        if (field.type === 'stringList' && field.itemType === 'variable') {
          return (
            <Autocomplete
              key={key}
              multiple
              size="small"
              disabled={disabled}
              options={variableOptions.map((variable) => variable.key)}
              value={Array.isArray(current) ? current : []}
              getOptionLabel={labelOf}
              groupBy={(option) => variableOptions.find((variable) => variable.key === option)?.group || ''}
              onChange={(_event, next) => set(key, next)}
              renderTags={(tags, getTagProps) =>
                tags.map((option, index) => <Chip size="small" label={labelOf(option)} {...getTagProps({ index })} key={option} />)
              }
              renderInput={(params) => <TextField {...params} label={field.label} placeholder="Add a variable" />}
            />
          );
        }

        if (field.type === 'stringList') {
          return <StringListField key={key} label={field.label} value={current} onChange={(next) => set(key, next)} disabled={disabled} maxItems={field.maxItems} />;
        }

        if (field.type === 'labels') {
          const labels = current && typeof current === 'object' ? current : {};
          return (
            <Box key={key}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {field.label}
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {(field.keys || []).map((entry) => (
                  <TextField
                    key={entry.key}
                    size="small"
                    label={entry.label}
                    placeholder={entry.default}
                    value={labels[entry.key] || ''}
                    disabled={disabled}
                    onChange={(event) => set(key, { ...labels, [entry.key]: event.target.value })}
                  />
                ))}
              </Stack>
            </Box>
          );
        }

        if (field.control === 'signatory') {
          return (
            <TextField key={key} select size="small" label={field.label} value={current || ''} disabled={disabled} onChange={(event) => set(key, event.target.value)}
              helperText={signatories?.length ? 'Signatories are managed in the Brand Kit.' : 'Add signatories in the Brand Kit.'}
            >
              <MenuItem value="">
                <em>First signatory</em>
              </MenuItem>
              {(signatories || []).map((signatory) => (
                <MenuItem key={signatory.key} value={signatory.key}>
                  {signatory.name || signatory.key}
                  {signatory.title && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {signatory.title}
                    </Typography>
                  )}
                </MenuItem>
              ))}
            </TextField>
          );
        }

        return (
          <TextField
            key={key}
            size="small"
            label={field.label}
            value={current ?? ''}
            multiline={field.type === 'text'}
            minRows={field.type === 'text' ? 2 : undefined}
            disabled={disabled}
            onChange={(event) => set(key, event.target.value)}
            helperText={field.type === 'string' ? 'Variables like {{institutionName}} work here.' : undefined}
          />
        );
      })}
    </Stack>
  );
}

BlockPropsForm.propTypes = {
  schema: PropTypes.object,
  value: PropTypes.object,
  onChange: PropTypes.func,
  variables: PropTypes.array,
  signatories: PropTypes.array,
  disabled: PropTypes.bool,
};

/** One-line summary shown on the block card. */
export function summarizeProps(schema, props) {
  const parts = [];
  Object.entries(schema || {}).forEach(([key, field]) => {
    const value = props?.[key];
    if (value === undefined || value === null) return;
    if (field.type === 'stringList' && Array.isArray(value) && value.length) parts.push(`${value.length} ${value.length === 1 ? 'item' : 'items'}`);
    if (field.control === 'signatory' && value) parts.push(`Signed by ${value}`);
    if (field.type === 'bool' && value !== field.default) parts.push(`${field.label}: ${value ? 'on' : 'off'}`);
    if (field.type === 'enum' && value !== field.default) parts.push(`${field.label}: ${value}`);
    if (field.type === 'labels' && value && Object.keys(value).length) parts.push('Custom captions');
  });
  return parts.slice(0, 3).join(' · ');
}
