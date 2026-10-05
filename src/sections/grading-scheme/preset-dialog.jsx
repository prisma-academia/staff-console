import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Chip,
  Radio,
  Stack,
  Alert,
  Button,
  Dialog,
  Switch,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  FormControlLabel,
} from '@mui/material';

import { GradingSchemeApi } from 'src/api';

// ----------------------------------------------------------------------

/** Pick one of the built-in presets (the colleges' marking documents) and create an editable scheme from it. */
export default function PresetDialog({ open, onClose, onCreated, existing }) {
  const { enqueueSnackbar } = useSnackbar();
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['grading-scheme-presets'],
    queryFn: GradingSchemeApi.getPresets,
    enabled: open,
    staleTime: Infinity,
  });

  const preset = presets.find((p) => p.code === selected);
  const taken = (field, value) => existing.some((s) => String(s[field]).toUpperCase() === String(value).trim().toUpperCase());

  useEffect(() => {
    if (preset) {
      setName(preset.name);
      setCode(preset.code);
    }
  }, [preset]);

  useEffect(() => {
    if (open) {
      setSelected('');
      setIsDefault(existing.length === 0);
    }
  }, [open, existing.length]);

  const create = async () => {
    setSaving(true);
    try {
      const scheme = await GradingSchemeApi.createFromPreset({ preset: selected, name: name.trim(), code: code.trim(), isDefault });
      enqueueSnackbar(`Created "${scheme.name}"`, { variant: 'success' });
      onCreated(scheme);
    } catch (error) {
      enqueueSnackbar(error.data?.message || error.message || 'Could not create the scheme', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const nameTaken = name && taken('name', name);
  const codeTaken = code && taken('code', code);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>New grading scheme from a preset</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          {isLoading && <Typography variant="body2">Loading presets…</Typography>}
          {presets.map((p) => (
            <Stack
              key={p.code}
              direction="row"
              spacing={1.5}
              alignItems="flex-start"
              onClick={() => setSelected(p.code)}
              sx={{
                p: 1.5,
                borderRadius: 1,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: selected === p.code ? 'primary.main' : 'divider',
              }}
            >
              <Radio checked={selected === p.code} size="small" sx={{ mt: -0.5 }} />
              <Stack spacing={0.75} sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="subtitle2">{p.name}</Typography>
                  <Chip size="small" variant="outlined" label={`${p.maxPoint}-point · pass ${p.passMark}`} />
                  {taken('code', p.code) && <Chip size="small" color="warning" label="Already added" />}
                </Stack>
                <Typography variant="body2" color="text.secondary">{p.description}</Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {p.bands.map((b) => (
                    <Chip key={b.grade} size="small" label={`${b.grade} ${b.minScore}–${b.maxScore} · ${b.point}`} color={b.isPass ? 'default' : 'error'} variant="outlined" />
                  ))}
                </Stack>
              </Stack>
            </Stack>
          ))}

          {preset && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField fullWidth size="small" label="Name" value={name} onChange={(e) => setName(e.target.value)}
                  error={Boolean(nameTaken)} helperText={nameTaken ? 'A scheme with this name exists' : ' '} />
                <TextField size="small" label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                  error={Boolean(codeTaken)} helperText={codeTaken ? 'A scheme with this code exists' : ' '} sx={{ minWidth: 220 }} />
              </Stack>
              <FormControlLabel
                control={<Switch checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />}
                label="Make this the default scheme (used by programmes without their own scheme)"
              />
              <Alert severity="info">
                The new scheme is fully editable. Assign it to programmes from the programme&apos;s edit form.
              </Alert>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <LoadingButton variant="contained" loading={saving} disabled={!preset || !name.trim() || !code.trim() || nameTaken || codeTaken} onClick={create}>
          Create scheme
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

PresetDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
  existing: PropTypes.array.isRequired,
};
