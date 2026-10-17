import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import {
  Box,
  Chip,
  Grid,
  Stack,
  Button,
  Checkbox,
  TextField,
  Typography,
  InputAdornment,
  FormControlLabel,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import { PERMISSION_CATEGORIES } from './permissions-config';

/**
 * The permission picker used by the role and user forms: grouped checkboxes
 * with a search, per-group "select all", and each permission's description.
 */
export default function PermissionChecklist({ value, onChange, maxHeight = 420 }) {
  const [query, setQuery] = useState('');
  const selected = useMemo(() => new Set(value || []), [value]);

  const categories = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return PERMISSION_CATEGORIES;
    return PERMISSION_CATEGORIES.map((category) => ({
      ...category,
      permissions: category.label.toLowerCase().includes(term)
        ? category.permissions
        : category.permissions.filter((perm) =>
            `${perm.label} ${perm.id} ${perm.description || ''}`.toLowerCase().includes(term)
          ),
    })).filter((category) => category.permissions.length > 0);
  }, [query]);

  const toggle = (id) => onChange(selected.has(id) ? value.filter((p) => p !== id) : [...(value || []), id]);
  const toggleCategory = (category, allOn) => {
    const ids = category.permissions.map((p) => p.id);
    onChange(allOn ? value.filter((p) => !ids.includes(p)) : [...new Set([...(value || []), ...ids])]);
  };

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search permissions"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" />
              </InputAdornment>
            ),
          }}
        />
        <Chip label={`${selected.size} selected`} size="small" color="primary" variant="outlined" />
      </Stack>

      <Box sx={{ maxHeight, overflow: 'auto', p: 2 }}>
        {categories.map((category) => {
          const count = category.permissions.filter((p) => selected.has(p.id)).length;
          const allOn = count === category.permissions.length;
          return (
            <Box key={category.label} sx={{ mb: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: category.description ? 0.25 : 0.75 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {category.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {count}/{category.permissions.length}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" onClick={() => toggleCategory(category, allOn)}>
                  {allOn ? 'Clear' : 'Select all'}
                </Button>
              </Stack>
              {category.description && (
                <Typography variant="caption" color="text.secondary" component="p" sx={{ mb: 0.75 }}>
                  {category.description}
                </Typography>
              )}
              <Grid container spacing={0.5}>
                {category.permissions.map((perm) => (
                  <Grid item xs={12} sm={6} md={4} key={perm.id}>
                    <FormControlLabel
                      sx={{ alignItems: 'flex-start', m: 0, width: '100%' }}
                      control={
                        <Checkbox size="small" checked={selected.has(perm.id)} onChange={() => toggle(perm.id)} sx={{ py: 0.5 }} />
                      }
                      label={
                        <Box sx={{ pt: 0.5 }}>
                          <Typography variant="body2">{perm.label}</Typography>
                          {perm.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.35 }}>
                              {perm.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
        {categories.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No permissions match &quot;{query}&quot;
          </Typography>
        )}
      </Box>
    </Box>
  );
}

PermissionChecklist.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  maxHeight: PropTypes.number,
};
