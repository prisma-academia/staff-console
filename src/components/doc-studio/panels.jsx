import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import { alpha } from '@mui/material/styles';
import {
  Box,
  Chip,
  Stack,
  Alert,
  Button,
  Tooltip,
  Divider,
  MenuItem,
  TextField,
  Typography,
  ToggleButton,
  InputAdornment,
  ToggleButtonGroup,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import { countUses, collectKeys, countBlocks } from './hooks';

// ----------------------------------------------------------------------

const searchable = (...parts) => parts.join(' ').toLowerCase();

function SearchBox({ value, onChange, placeholder }) {
  return (
    <TextField
      size="small"
      fullWidth
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Iconify icon="mdi:magnify" width={18} sx={{ color: 'text.disabled' }} />
          </InputAdornment>
        ),
      }}
    />
  );
}

SearchBox.propTypes = { value: PropTypes.string, onChange: PropTypes.func, placeholder: PropTypes.string };

// ----------------------------------------------------------------------

/**
 * Every variable the document knows, with a realistic sample value. Click to
 * insert at the cursor, or drag straight onto the page — the drag carries the
 * chip's own HTML, which the editor parses as a chip.
 */
export function VariablesPanel({ variables, html, disabled, onInsert, onRemoveUnknown }) {
  const [query, setQuery] = useState('');
  const known = useMemo(() => new Set(variables.map((variable) => variable.key)), [variables]);
  const unknown = useMemo(() => collectKeys(html).filter((key) => !known.has(key)), [html, known]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return variables
      .filter((variable) => !needle || searchable(variable.key, variable.label, variable.group, variable.description).includes(needle))
      .reduce((acc, variable) => {
        (acc[variable.group || 'Other'] = acc[variable.group || 'Other'] || []).push(variable);
        return acc;
      }, {});
  }, [variables, query]);

  return (
    <Stack spacing={1.5} sx={{ p: 1.5 }}>
      <SearchBox value={query} onChange={setQuery} placeholder="Find a variable" />

      {unknown.length > 0 && (
        <Alert severity="error" icon={<Iconify icon="mdi:alert-circle-outline" />}>
          <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
            Not available here — these print as nothing:
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.5}>
            {unknown.map((key) => (
              <Chip key={key} size="small" color="error" variant="outlined" label={`{{${key}}}`} onDelete={disabled ? undefined : () => onRemoveUnknown(key)} />
            ))}
          </Stack>
        </Alert>
      )}

      {Object.entries(groups).map(([group, items]) => (
        <Box key={group}>
          <Typography variant="overline" color="text.secondary" sx={{ px: 0.5 }}>
            {group}
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 0.25 }}>
            {items.map((variable) => {
              const uses = countUses(html, variable.key);
              return (
                <Box
                  key={variable.key}
                  draggable={!disabled}
                  onDragStart={(event) => {
                    event.dataTransfer.setData('text/html', `<span data-var="${variable.key}">{{${variable.key}}}</span>`);
                    event.dataTransfer.setData('text/plain', `{{${variable.key}}}`);
                  }}
                  onClick={() => !disabled && onInsert(variable.key)}
                  sx={{
                    px: 1.25,
                    py: 0.75,
                    borderRadius: 1,
                    cursor: disabled ? 'default' : 'grab',
                    border: '1px solid',
                    borderColor: 'transparent',
                    transition: 'all .15s',
                    '&:hover': disabled ? {} : { borderColor: 'primary.light', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04) },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={600} noWrap sx={{ flexGrow: 1 }}>
                      {variable.label}
                    </Typography>
                    {variable.sensitive && (
                      <Tooltip title="Secret — masked in previews and never sent in test emails">
                        <Iconify icon="mdi:lock-outline" width={14} sx={{ color: 'warning.main' }} />
                      </Tooltip>
                    )}
                    {uses > 0 && <Chip size="small" label={`×${uses}`} sx={{ height: 18, fontSize: 11 }} color="primary" variant="outlined" />}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontFamily: 'monospace' }}>
                    {variable.sample || '—'}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
      ))}

      {!Object.keys(groups).length && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
          No variable matches “{query}”.
        </Typography>
      )}
    </Stack>
  );
}

VariablesPanel.propTypes = {
  variables: PropTypes.array,
  html: PropTypes.string,
  disabled: PropTypes.bool,
  onInsert: PropTypes.func,
  onRemoveUnknown: PropTypes.func,
};

// ----------------------------------------------------------------------

/** The palette of dynamic blocks: click or drag onto the page. */
export function BlocksPanel({ blocks, required, html, disabled, onInsert }) {
  const [query, setQuery] = useState('');
  const requiredNames = new Set((required || []).map((rule) => rule.name));
  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return blocks
      .filter((block) => !needle || searchable(block.name, block.label, block.description, block.group).includes(needle))
      .reduce((acc, block) => {
        (acc[block.group || 'Blocks'] = acc[block.group || 'Blocks'] || []).push(block);
        return acc;
      }, {});
  }, [blocks, query]);

  return (
    <Stack spacing={1.5} sx={{ p: 1.5 }}>
      <SearchBox value={query} onChange={setQuery} placeholder="Find a block" />
      <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
        Blocks fill themselves in for each record — tables, signatures, QR codes. Tip: type <strong>/</strong> on an empty line.
      </Typography>
      {Object.entries(groups).map(([group, items]) => (
        <Box key={group}>
          <Typography variant="overline" color="text.secondary" sx={{ px: 0.5 }}>
            {group}
          </Typography>
          <Stack spacing={0.75} sx={{ mt: 0.25 }}>
            {items.map((block) => {
              const uses = countBlocks(html, block.name);
              const isRequired = requiredNames.has(block.name);
              return (
                <Box
                  key={block.name}
                  draggable={!disabled}
                  onDragStart={(event) => event.dataTransfer.setData('text/html', `<div data-block="${block.name}"></div>`)}
                  onClick={() => !disabled && onInsert(block.name)}
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    cursor: disabled ? 'default' : 'grab',
                    border: '1px solid',
                    borderColor: isRequired && !uses ? 'warning.main' : 'divider',
                    bgcolor: 'background.paper',
                    transition: 'all .15s',
                    '&:hover': disabled ? {} : { borderColor: 'primary.main', boxShadow: (theme) => theme.customShadows?.z8, transform: 'translateY(-1px)' },
                  }}
                >
                  <Stack direction="row" spacing={1.25} alignItems="flex-start">
                    <Box sx={{ width: 32, height: 32, borderRadius: 1, flexShrink: 0, display: 'grid', placeItems: 'center', color: 'primary.main', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08) }}>
                      <Iconify icon={block.icon} width={18} />
                    </Box>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="subtitle2" noWrap>
                          {block.label}
                        </Typography>
                        {isRequired && <Chip size="small" label="Needed" color={uses ? 'success' : 'warning'} sx={{ height: 18, fontSize: 10 }} />}
                        {uses > 0 && !isRequired && <Chip size="small" label="In use" sx={{ height: 18, fontSize: 10 }} />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {block.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

BlocksPanel.propTypes = { blocks: PropTypes.array, required: PropTypes.array, html: PropTypes.string, disabled: PropTypes.bool, onInsert: PropTypes.func };

// ----------------------------------------------------------------------

const LAYOUT_CHOICES = {
  header: [
    { value: 'inherit', label: 'Brand Kit default', icon: 'mdi:palette-outline' },
    { value: 'identity', label: 'Logo & name', icon: 'mdi:card-account-details-outline' },
    { value: 'letterhead', label: 'Letterhead image', icon: 'mdi:image-area' },
    { value: 'none', label: 'No header', icon: 'mdi:border-none-variant' },
  ],
  watermark: [
    { value: 'inherit', label: 'Brand Kit default' },
    { value: 'on', label: 'On' },
    { value: 'off', label: 'Off' },
  ],
  footer: [
    { value: 'inherit', label: 'Brand Kit default' },
    { value: 'on', label: 'Contact footer' },
    { value: 'off', label: 'No footer' },
  ],
};

/** Page chrome for this template; "Brand Kit default" follows the kit. */
export function LayoutPanel({ channel, layout, fileName, defaultFileName, disabled, onLayout, onFileName, brandLayout }) {
  const value = (key) => (layout && layout[key]) || 'inherit';
  const isPrint = channel === 'print';
  return (
    <Stack spacing={2.5} sx={{ p: 1.5 }}>
      {isPrint && (
        <>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Header
            </Typography>
            <Stack spacing={0.75} sx={{ mt: 0.5 }}>
              {LAYOUT_CHOICES.header.map((choice) => (
                <Box
                  key={choice.value}
                  onClick={() => !disabled && onLayout({ header: choice.value })}
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    cursor: disabled ? 'default' : 'pointer',
                    border: '1.5px solid',
                    borderColor: value('header') === choice.value ? 'primary.main' : 'divider',
                    bgcolor: value('header') === choice.value ? (theme) => alpha(theme.palette.primary.main, 0.06) : 'transparent',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Iconify icon={choice.icon} width={18} sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2" fontWeight={600}>
                      {choice.label}
                    </Typography>
                    {choice.value === 'inherit' && brandLayout?.header && (
                      <Typography variant="caption" color="text.secondary">
                        ({brandLayout.header})
                      </Typography>
                    )}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>

          {['watermark', 'footer'].map((key) => (
            <Box key={key}>
              <Typography variant="overline" color="text.secondary">
                {key === 'watermark' ? 'Watermark' : 'Footer'}
              </Typography>
              <ToggleButtonGroup fullWidth size="small" exclusive value={value(key)} disabled={disabled} onChange={(_event, next) => next && onLayout({ [key]: next })} sx={{ mt: 0.5 }}>
                {LAYOUT_CHOICES[key].map((choice) => (
                  <ToggleButton key={choice.value} value={choice.value} sx={{ fontSize: 12, textTransform: 'none' }}>
                    {choice.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          ))}

          <Stack direction="row" spacing={1}>
            <TextField select size="small" fullWidth label="Margins" value={(layout && layout.margins) || 'normal'} disabled={disabled} onChange={(event) => onLayout({ margins: event.target.value })}>
              <MenuItem value="narrow">Narrow</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="wide">Wide</MenuItem>
            </TextField>
            <TextField select size="small" fullWidth label="Orientation" value={(layout && layout.orientation) || 'portrait'} disabled={disabled} onChange={(event) => onLayout({ orientation: event.target.value })}>
              <MenuItem value="portrait">Portrait</MenuItem>
              <MenuItem value="landscape">Landscape</MenuItem>
            </TextField>
          </Stack>
          <Divider />
          <TextField
            size="small"
            label="Download file name"
            value={fileName || ''}
            placeholder={defaultFileName}
            disabled={disabled}
            onChange={(event) => onFileName(event.target.value)}
            helperText="Use {{variables}} — each value is made file-safe, e.g. transcript-{{regNumber}}.pdf"
          />
        </>
      )}
      {!isPrint && (
        <Typography variant="body2" color="text.secondary">
          {channel === 'email' && 'Emails use the Brand Kit header (logo and name) and footer automatically.'}
          {channel === 'web' && 'Public pages use the Brand Kit header and contact footer automatically.'}
          {channel === 'sms' && 'Text messages have no layout — only words.'}
        </Typography>
      )}
    </Stack>
  );
}

LayoutPanel.propTypes = {
  channel: PropTypes.string,
  layout: PropTypes.object,
  fileName: PropTypes.string,
  defaultFileName: PropTypes.string,
  disabled: PropTypes.bool,
  onLayout: PropTypes.func,
  onFileName: PropTypes.func,
  brandLayout: PropTypes.object,
};

// ----------------------------------------------------------------------

const SEVERITY = {
  error: { color: 'error', icon: 'mdi:close-circle', label: 'Must fix before publishing' },
  warning: { color: 'warning', icon: 'mdi:alert', label: 'Worth a look' },
  info: { color: 'info', icon: 'mdi:information', label: 'Tip' },
};

const FIX_LABEL = {
  insertBlock: 'Add block',
  removeBlock: 'Remove',
  removeVariable: 'Remove',
  replaceText: 'Replace',
};

/** Health checks with one-click fixes. */
export function HealthPanel({ issues, disabled, onFix }) {
  if (!issues.length) {
    return (
      <Stack alignItems="center" spacing={1.5} sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ width: 64, height: 64, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: 'success.lighter', color: 'success.main' }}>
          <Iconify icon="mdi:heart-pulse" width={34} />
        </Box>
        <Typography variant="subtitle1">All healthy</Typography>
        <Typography variant="body2" color="text.secondary">
          Every variable resolves and every required block is in place.
        </Typography>
      </Stack>
    );
  }
  return (
    <Stack spacing={1} sx={{ p: 1.5 }}>
      {issues.map((issue, index) => {
        const meta = SEVERITY[issue.severity] || SEVERITY.info;
        return (
          <Alert
            key={`${issue.code}-${index}`}
            severity={meta.color}
            icon={<Iconify icon={meta.icon} />}
            action={
              issue.fix && !disabled ? (
                <Button color="inherit" size="small" onClick={() => onFix(issue.fix)}>
                  {FIX_LABEL[issue.fix.kind] || 'Fix'}
                </Button>
              ) : null
            }
          >
            <Typography variant="caption" fontWeight={700} display="block">
              {meta.label}
            </Typography>
            <Typography variant="body2">{issue.message}</Typography>
          </Alert>
        );
      })}
    </Stack>
  );
}

HealthPanel.propTypes = { issues: PropTypes.array, disabled: PropTypes.bool, onFix: PropTypes.func };
