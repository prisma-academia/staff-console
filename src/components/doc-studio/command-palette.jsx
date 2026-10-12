import PropTypes from 'prop-types';
import { useMemo, useState, useEffect } from 'react';

import { alpha } from '@mui/material/styles';
import { Box, Chip, Stack, Dialog, InputBase, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * Ctrl+K: everything the Studio can do, one keystroke away — publish, open the
 * history, insert any variable or block, jump to another template.
 *
 * Commands: { id, group, label, hint, icon, keys, run }.
 */
export default function CommandPalette({ open, onClose, commands }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return commands
      .filter((command) => {
        const haystack = `${command.group} ${command.label} ${command.hint || ''}`.toLowerCase();
        return words.every((word) => haystack.includes(word));
      })
      .slice(0, 40);
  }, [commands, query]);

  useEffect(() => setSelected(0), [query]);

  const run = (command) => {
    onClose();
    setTimeout(() => command.run(), 0);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelected((current) => Math.min(results.length - 1, current + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelected((current) => Math.max(0, current - 1));
    } else if (event.key === 'Enter' && results[selected]) {
      event.preventDefault();
      run(results[selected]);
    }
  };

  let lastGroup = null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { position: 'fixed', top: '12vh', m: 0, borderRadius: 2, overflow: 'hidden' } }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Iconify icon="mdi:magnify" width={22} sx={{ color: 'text.disabled' }} />
        <InputBase autoFocus fullWidth placeholder="Type a command, a variable, a block or a template…" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onKeyDown} sx={{ fontSize: 16 }} />
        <Chip size="small" label="Esc" sx={{ fontFamily: 'monospace' }} />
      </Stack>
      <Box sx={{ maxHeight: '55vh', overflowY: 'auto', py: 1 }}>
        {!results.length && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, py: 3, textAlign: 'center' }}>
            Nothing matches “{query}”.
          </Typography>
        )}
        {results.map((command, index) => {
          const header = command.group !== lastGroup ? command.group : null;
          lastGroup = command.group;
          return (
            <Box key={command.id}>
              {header && (
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block', px: 2.5, pt: 1, pb: 0.5 }}>
                  {header}
                </Typography>
              )}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                onMouseEnter={() => setSelected(index)}
                onClick={() => run(command)}
                sx={{
                  mx: 1,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: index === selected ? (theme) => alpha(theme.palette.primary.main, 0.08) : 'transparent',
                }}
              >
                <Iconify icon={command.icon || 'mdi:chevron-right'} width={20} sx={{ color: index === selected ? 'primary.main' : 'text.secondary' }} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {command.label}
                  </Typography>
                  {command.hint && (
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {command.hint}
                    </Typography>
                  )}
                </Box>
                {command.keys && <Chip size="small" label={command.keys} sx={{ fontFamily: 'monospace', height: 22 }} />}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Dialog>
  );
}

CommandPalette.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  commands: PropTypes.array,
};
