import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import { LoadingButton } from '@mui/lab';
import { alpha } from '@mui/material/styles';
import {
  Box,
  Tab,
  Card,
  Tabs,
  Chip,
  Grid,
  Stack,
  Alert,
  Button,
  Slider,
  Switch,
  Dialog,
  Divider,
  Tooltip,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  CardHeader,
  DialogTitle,
  CardContent,
  DialogActions,
  DialogContent,
  LinearProgress,
  CircularProgress,
  FormControlLabel,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';

import { PERMISSIONS } from 'src/permissions/constants';
import { brandApi, studioApi } from 'src/api/docStudioApi';

import Iconify from 'src/components/iconify';
import { timeAgo, useRelativeTime } from 'src/components/doc-studio/hooks';
import { PrintFrame, EmailFrame } from 'src/components/doc-studio/preview/preview-pane';

// ----------------------------------------------------------------------

const EMPTY_KIT = { identity: {}, assets: {}, colors: {}, typography: {}, print: {}, email: {}, signatories: [], currency: {} };

const normalize = (kit) => ({ ...EMPTY_KIT, ...(kit || {}), signatories: (kit && kit.signatories) || [] });

// ---- WCAG contrast -----------------------------------------------------

function luminance(hex) {
  const value = String(hex || '').replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const channel = (i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la == null || lb == null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function ContrastBadge({ fg, bg, label }) {
  const ratio = contrast(fg, bg);
  if (ratio == null) return null;
  const pass = ratio >= 4.5;
  const large = ratio >= 3;
  let verdict = 'hard to read';
  let colour = 'error';
  if (pass) {
    verdict = 'easy to read (WCAG AA)';
    colour = 'success';
  } else if (large) {
    verdict = 'OK only for large text';
    colour = 'warning';
  }
  return (
    <Tooltip title={`${label}: contrast ${ratio.toFixed(1)}:1 — ${verdict}`}>
      <Chip
        size="small"
        icon={<Iconify icon={pass ? 'mdi:check-circle' : 'mdi:alert'} width={14} />}
        color={colour}
        variant="outlined"
        label={`${ratio.toFixed(1)}:1`}
        sx={{ height: 20, fontSize: 11 }}
      />
    </Tooltip>
  );
}

ContrastBadge.propTypes = { fg: PropTypes.string, bg: PropTypes.string, label: PropTypes.string };

// ---- Fields ---------------------------------------------------------------

function ColorField({ label, value, inherited, onChange, disabled, checks }) {
  const shown = value || inherited || '#000000';
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        component="label"
        sx={{ position: 'relative', width: 44, height: 44, borderRadius: 1.5, bgcolor: shown, border: '3px solid', borderColor: 'background.paper', boxShadow: (theme) => `0 0 0 1px ${theme.palette.divider}`, cursor: disabled ? 'default' : 'pointer', flexShrink: 0 }}
      >
        <input type="color" value={shown} disabled={disabled} onChange={(event) => onChange(event.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'inherit' }} />
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="subtitle2">{label}</Typography>
        <Stack direction="row" spacing={0.75} alignItems="center">
          <TextField
            variant="standard"
            size="small"
            value={value || ''}
            placeholder={inherited}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            sx={{ width: 96, '& input': { fontFamily: 'monospace', fontSize: 13 } }}
          />
          {checks}
        </Stack>
      </Box>
    </Stack>
  );
}

ColorField.propTypes = { label: PropTypes.string, value: PropTypes.string, inherited: PropTypes.string, onChange: PropTypes.func, disabled: PropTypes.bool, checks: PropTypes.node };

/** Drop an image (or click) — it uploads to object storage and the URL is kept. */
function AssetField({ label, hint, value, inherited, onChange, disabled, height = 90 }) {
  const { enqueueSnackbar } = useSnackbar();
  const [busy, setBusy] = useState(false);
  const onDrop = useCallback(async (files) => {
    if (!files[0]) return;
    setBusy(true);
    try {
      const result = await brandApi.upload(files[0]);
      onChange(result.url);
    } catch (error) {
      enqueueSnackbar(error.message || 'Upload failed', { variant: 'error' });
    } finally {
      setBusy(false);
    }
  }, [onChange, enqueueSnackbar]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, disabled: disabled || busy, accept: { 'image/png': [], 'image/jpeg': [], 'image/webp': [], 'image/gif': [] }, maxSize: 5 * 1024 * 1024 });
  const shown = value || inherited;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
        <Typography variant="subtitle2">{label}</Typography>
        {value && !disabled && (
          <Button size="small" color="inherit" onClick={() => onChange('')}>
            {inherited ? 'Use settings default' : 'Remove'}
          </Button>
        )}
      </Stack>
      <Box
        {...getRootProps()}
        sx={{
          position: 'relative',
          height,
          borderRadius: 1.5,
          border: '1.5px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? (theme) => alpha(theme.palette.primary.main, 0.06) : (theme) => alpha(theme.palette.grey[500], 0.04),
          display: 'grid',
          placeItems: 'center',
          cursor: disabled ? 'default' : 'pointer',
          overflow: 'hidden',
          transition: 'all .15s',
          '&:hover': disabled ? {} : { borderColor: 'primary.main' },
        }}
      >
        <input {...getInputProps()} />
        {busy && <CircularProgress size={24} />}
        {!busy && shown && <Box component="img" src={shown} alt="" sx={{ maxWidth: '92%', maxHeight: height - 16, objectFit: 'contain', opacity: value ? 1 : 0.55 }} />}
        {!busy && !shown && (
          <Stack alignItems="center" spacing={0.5} sx={{ color: 'text.disabled' }}>
            <Iconify icon="mdi:cloud-upload-outline" width={26} />
            <Typography variant="caption">Drop an image or click</Typography>
          </Stack>
        )}
        {!value && inherited && !busy && <Chip size="small" label="From settings" sx={{ position: 'absolute', top: 6, left: 6, height: 18, fontSize: 10 }} />}
      </Box>
      {hint && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

AssetField.propTypes = { label: PropTypes.string, hint: PropTypes.string, value: PropTypes.string, inherited: PropTypes.string, onChange: PropTypes.func, disabled: PropTypes.bool, height: PropTypes.number };

function Section({ icon, title, subheader, children }) {
  return (
    <Card>
      <CardHeader
        avatar={<Box sx={{ width: 36, height: 36, borderRadius: 1, display: 'grid', placeItems: 'center', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}><Iconify icon={icon} width={20} /></Box>}
        title={title}
        subheader={subheader}
        sx={{ pb: 0 }}
      />
      <CardContent>{children}</CardContent>
    </Card>
  );
}

Section.propTypes = { icon: PropTypes.string, title: PropTypes.string, subheader: PropTypes.string, children: PropTypes.node };

// ---- Live preview across documents ----------------------------------------

const SHOWCASE = [
  { service: 'admissions', key: 'admission-letter', label: 'Admission letter', channel: 'print' },
  { service: 'core', key: 'payment-receipt', label: 'Receipt', channel: 'print' },
  { service: 'core', key: 'transcript', label: 'Transcript', channel: 'print' },
  { service: 'core', key: 'staff-welcome-email', label: 'Email', channel: 'email' },
];

function Showcase({ kit }) {
  const [tab, setTab] = useState(0);
  const [state, setState] = useState({ result: null, pending: false, error: null });
  const item = SHOWCASE[tab];
  const seq = useRef(0);
  const json = JSON.stringify(kit);

  useEffect(() => {
    const timer = setTimeout(async () => {
      seq.current += 1;
      const mine = seq.current;
      setState((current) => ({ ...current, pending: true }));
      try {
        // The core api completes the draft kit (inheriting blanks from
        // settings); the admissions service is handed that complete brand.
        const brand = item.service === 'admissions' ? await brandApi.resolve(kit) : kit;
        const result = await studioApi(item.service).preview({ key: item.key, brand });
        if (mine === seq.current) setState({ result, pending: false, error: null });
      } catch (error) {
        if (mine === seq.current) setState({ result: null, pending: false, error });
      }
    }, 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json, tab]);

  return (
    <Card sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
      <Stack direction="row" alignItems="center" sx={{ px: 2, pt: 1.5 }}>
        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
          Preview across documents
        </Typography>
        {state.pending && <CircularProgress size={16} />}
      </Stack>
      <Tabs value={tab} onChange={(_event, next) => setTab(next)} variant="scrollable" sx={{ px: 2 }}>
        {SHOWCASE.map((entry) => (
          <Tab key={entry.key} label={entry.label} />
        ))}
      </Tabs>
      <Divider />
      <Box sx={{ height: { xs: 520, lg: 'calc(100vh - 230px)' }, overflow: 'auto', p: 2, bgcolor: 'grey.100' }}>
        {state.error && <Alert severity="warning">{state.error.message}</Alert>}
        {state.result && item.channel === 'print' && <PrintFrame html={state.result.html} zoom={0.62} />}
        {state.result && item.channel === 'email' && <EmailFrame result={state.result} device="desktop" brandName={kit.identity?.shortName || kit.identity?.name || ''} />}
      </Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ p: 1.5 }}>
        Sample data, rendered by the real engine with your unpublished brand.
      </Typography>
    </Card>
  );
}

Showcase.propTypes = { kit: PropTypes.object };

// ----------------------------------------------------------------------

export default function BrandKitView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { check } = usePermissions();
  const canEdit = check(PERMISSIONS.MANAGE_BRAND_KIT);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['doc-studio', 'brand'], queryFn: brandApi.get, staleTime: 0, refetchOnWindowFocus: false });

  const [kit, setKit] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [savedAt, setSavedAt] = useState(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [note, setNote] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const revision = useRef(0);
  const lastSaved = useRef(null);
  const ago = useRelativeTime(savedAt);

  useEffect(() => {
    if (data && !kit) {
      const working = normalize(data.draft?.kit || data.published?.kit);
      setKit(working);
      lastSaved.current = JSON.stringify(working);
      revision.current = data.revision;
    }
  }, [data, kit]);

  // Autosave the draft kit.
  useEffect(() => {
    if (!kit || !canEdit) return undefined;
    const json = JSON.stringify(kit);
    if (json === lastSaved.current) return undefined;
    setSaveState('dirty');
    const timer = setTimeout(async () => {
      setSaveState('saving');
      try {
        const res = await brandApi.saveDraft({ kit, baseRevision: revision.current });
        revision.current = res.revision;
        lastSaved.current = json;
        setSavedAt(Date.now());
        setSaveState('saved');
      } catch (err) {
        setSaveState(err.status === 409 ? 'conflict' : 'error');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [kit, canEdit]);

  const set = (section, field) => (value) => setKit((current) => ({ ...current, [section]: { ...(current[section] || {}), [field]: value } }));
  const derived = data?.derived || {};
  const effective = data?.effective;
  const disabled = !canEdit;

  const hasChanges = Boolean(data?.draft) || (kit && JSON.stringify(kit) !== JSON.stringify(normalize(data?.published?.kit)));

  const publish = async () => {
    setPublishing(true);
    try {
      if (kit && JSON.stringify(kit) !== lastSaved.current) {
        const res = await brandApi.saveDraft({ kit, baseRevision: revision.current });
        revision.current = res.revision;
        lastSaved.current = JSON.stringify(kit);
      }
      const res = await brandApi.publish({ note, baseRevision: revision.current });
      revision.current = res.revision;
      // application-api mirrors the kit — ask it to pull the new version now.
      brandApi.refreshAdmissions().catch(() => enqueueSnackbar('Admissions documents will pick up the new brand within a minute.', { variant: 'info' }));
      queryClient.invalidateQueries({ queryKey: ['doc-studio'] });
      setPublishOpen(false);
      setNote('');
      enqueueSnackbar(`Brand Kit v${res.version} is live on every document`, { variant: 'success' });
      refetch();
    } catch (err) {
      enqueueSnackbar(err.message || 'Publishing failed', { variant: 'error' });
    } finally {
      setPublishing(false);
    }
  };

  const signatories = kit?.signatories || [];
  const setSignatory = (index, field, value) => setKit((current) => ({ ...current, signatories: current.signatories.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)) }));

  const versions = useQuery({ queryKey: ['doc-studio', 'brand-versions'], queryFn: brandApi.versions, enabled: historyOpen });

  const showcaseKit = useMemo(() => kit || {}, [kit]);

  if (isLoading || !kit) return <Box sx={{ p: 4 }}>{error ? <Alert severity="error">{error.message}</Alert> : <LinearProgress />}</Box>;

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/studio')} sx={{ alignSelf: 'flex-start' }}>
          <Iconify icon="mdi:arrow-left" />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight={800}>
            Brand Kit
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your identity on every letter, receipt, transcript, email and public page. Leave a field blank to use the institution settings.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="caption" color={saveState === 'error' || saveState === 'conflict' ? 'error' : 'text.secondary'}>
            {saveState === 'saving' && 'Saving…'}
            {saveState === 'saved' && `Draft saved ${ago}`}
            {saveState === 'dirty' && 'Editing…'}
            {saveState === 'error' && 'Not saved'}
            {saveState === 'conflict' && 'Changed elsewhere — reload'}
          </Typography>
          {data?.published && <Chip size="small" color="success" label={`Live · v${data.published.version}`} />}
          <Button color="inherit" variant="outlined" startIcon={<Iconify icon="mdi:history" />} onClick={() => setHistoryOpen(true)}>
            History
          </Button>
          {canEdit && (
            <LoadingButton variant="contained" disabled={!hasChanges} onClick={() => setPublishOpen(true)} startIcon={<Iconify icon="mdi:rocket-launch" />}>
              Publish brand
            </LoadingButton>
          )}
        </Stack>
      </Stack>

      {!canEdit && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You can view the Brand Kit; changing it needs the “Manage the Brand Kit” permission.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Stack spacing={3}>
            <Section icon="mdi:card-account-details-outline" title="Identity" subheader="How the institution is named on documents">
              <Grid container spacing={2}>
                {[
                  ['name', 'Name', 6],
                  ['shortName', 'Short name / acronym', 6],
                  ['fullName', 'Full name (headers)', 12],
                  ['motto', 'Motto', 12],
                  ['address', 'Address', 8],
                  ['location', 'Town / State', 4],
                  ['phone', 'Phone', 4],
                  ['email', 'Email', 4],
                  ['website', 'Website', 4],
                ].map(([field, label, cols]) => (
                  <Grid key={field} item xs={12} sm={cols}>
                    <TextField fullWidth size="small" label={label} value={kit.identity?.[field] || ''} placeholder={derived.identity?.[field] || ''} disabled={disabled} onChange={(event) => set('identity', field)(event.target.value)} InputLabelProps={{ shrink: true }} />
                  </Grid>
                ))}
              </Grid>
            </Section>

            <Section icon="mdi:image-multiple-outline" title="Logo & artwork" subheader="PNG with a transparent background looks best">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <AssetField label="Logo" value={kit.assets?.logoUrl} inherited={derived.assets?.logoUrl} disabled={disabled} onChange={set('assets', 'logoUrl')} hint="Header of documents and emails." />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <AssetField label="Watermark" value={kit.assets?.watermarkUrl} inherited={kit.assets?.logoUrl || derived.assets?.logoUrl} disabled={disabled} onChange={set('assets', 'watermarkUrl')} hint="Faint mark behind printed pages. Defaults to the logo." />
                </Grid>
                <Grid item xs={12}>
                  <AssetField label="Letterhead" value={kit.assets?.letterheadUrl} inherited={derived.assets?.letterheadUrl} disabled={disabled} onChange={set('assets', 'letterheadUrl')} height={110} hint="A full-width banner image, used when a document's header is set to “Letterhead”." />
                </Grid>
              </Grid>
            </Section>

            <Section icon="mdi:palette-outline" title="Colours" subheader="Contrast is checked as you pick">
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <ColorField label="Primary" value={kit.colors?.primary} inherited={effective?.colors?.primary} disabled={disabled} onChange={set('colors', 'primary')} checks={<ContrastBadge fg="#ffffff" bg={kit.colors?.primary || effective?.colors?.primary} label="White button text on primary" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ColorField label="Accent (rules & borders)" value={kit.colors?.accent} inherited={effective?.colors?.accent} disabled={disabled} onChange={set('colors', 'accent')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ColorField label="Headings" value={kit.colors?.heading} inherited={effective?.colors?.heading} disabled={disabled} onChange={set('colors', 'heading')} checks={<ContrastBadge fg={kit.colors?.heading || effective?.colors?.heading} bg="#ffffff" label="Headings on white" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ColorField label="Body text" value={kit.colors?.body} inherited={effective?.colors?.body} disabled={disabled} onChange={set('colors', 'body')} checks={<ContrastBadge fg={kit.colors?.body || effective?.colors?.body} bg="#ffffff" label="Body text on white" />} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ColorField label="Muted (captions)" value={kit.colors?.muted} inherited={effective?.colors?.muted} disabled={disabled} onChange={set('colors', 'muted')} />
                </Grid>
              </Grid>
            </Section>

            <Section icon="mdi:format-font" title="Typography & print" subheader="Fonts every printer has; page chrome defaults">
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth size="small" label="Font" value={kit.typography?.fontFamily || ''} disabled={disabled} onChange={(event) => set('typography', 'fontFamily')(event.target.value)}>
                    <MenuItem value="">Default (Arial)</MenuItem>
                    {(data?.fonts || []).map((font) => (
                      <MenuItem key={font} value={font} sx={{ fontFamily: font, textTransform: 'capitalize' }}>
                        {font}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Body size: {kit.typography?.baseSize || effective?.typography?.baseSize}pt
                  </Typography>
                  <Slider size="small" min={9} max={12} step={0.5} value={Number(kit.typography?.baseSize || effective?.typography?.baseSize || 10.5)} disabled={disabled} onChange={(_event, value) => set('typography', 'baseSize')(value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField select fullWidth size="small" label="Default document header" value={kit.print?.header || ''} disabled={disabled} onChange={(event) => set('print', 'header')(event.target.value)}>
                    <MenuItem value="">Logo & name (default)</MenuItem>
                    <MenuItem value="letterhead">Letterhead image</MenuItem>
                    <MenuItem value="none">No header</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Logo height: {kit.print?.logoHeight || effective?.print?.logoHeight}px
                  </Typography>
                  <Slider size="small" min={40} max={140} value={Number(kit.print?.logoHeight || effective?.print?.logoHeight || 84)} disabled={disabled} onChange={(_event, value) => set('print', 'logoHeight')(value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel control={<Switch checked={kit.print?.showWatermark ?? effective?.print?.showWatermark ?? true} disabled={disabled} onChange={(event) => set('print', 'showWatermark')(event.target.checked)} />} label="Watermark on printed pages" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Watermark strength: {Math.round((kit.print?.watermarkOpacity ?? effective?.print?.watermarkOpacity ?? 0.07) * 100)}%
                  </Typography>
                  <Slider size="small" min={0.02} max={0.2} step={0.01} value={Number(kit.print?.watermarkOpacity ?? effective?.print?.watermarkOpacity ?? 0.07)} disabled={disabled} onChange={(_event, value) => set('print', 'watermarkOpacity')(value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel control={<Switch checked={kit.print?.showFooterContacts ?? effective?.print?.showFooterContacts ?? true} disabled={disabled} onChange={(event) => set('print', 'showFooterContacts')(event.target.checked)} />} label="Contact footer on documents" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Footer line (optional)" placeholder="e.g. Accredited by the Nursing and Midwifery Council of Nigeria" value={kit.print?.footerText || ''} disabled={disabled} onChange={(event) => set('print', 'footerText')(event.target.value)} />
                </Grid>
              </Grid>
            </Section>

            <Section icon="mdi:draw-pen" title="Signatories" subheader="Picked by the Signature block on any document">
              <Stack spacing={2}>
                {signatories.map((entry, index) => (
                  <Card key={`${entry.key}-${index}`} variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={4}>
                        <AssetField label="Signature" value={entry.signatureImageUrl} disabled={disabled} onChange={(value) => setSignatory(index, 'signatureImageUrl', value)} height={80} />
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Stack spacing={1.25}>
                          <Stack direction="row" spacing={1}>
                            <TextField size="small" fullWidth label="Name" value={entry.name || ''} disabled={disabled} onChange={(event) => setSignatory(index, 'name', event.target.value)} />
                            <TextField size="small" label="Honorifics" placeholder="FWACN" value={entry.honorifics || ''} disabled={disabled} onChange={(event) => setSignatory(index, 'honorifics', event.target.value)} sx={{ width: 140 }} />
                          </Stack>
                          <TextField size="small" label="Title" placeholder="Registrar" value={entry.title || ''} disabled={disabled} onChange={(event) => setSignatory(index, 'title', event.target.value)} />
                          <Stack direction="row" spacing={1} alignItems="center">
                            <TextField size="small" fullWidth label="Subtitle (optional)" placeholder="For: Provost" value={entry.subtitle || ''} disabled={disabled} onChange={(event) => setSignatory(index, 'subtitle', event.target.value)} />
                            <TextField size="small" label="Key" value={entry.key || ''} disabled={disabled} onChange={(event) => setSignatory(index, 'key', event.target.value)} sx={{ width: 140 }} helperText="Used by blocks" />
                            {!disabled && (
                              <IconButton color="error" onClick={() => setKit((current) => ({ ...current, signatories: current.signatories.filter((_, i) => i !== index) }))}>
                                <Iconify icon="mdi:trash-can-outline" />
                              </IconButton>
                            )}
                          </Stack>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Card>
                ))}
                {!signatories.length && derived.signatories?.length > 0 && (
                  <Alert severity="info">
                    Using <strong>{derived.signatories[0].name}</strong> ({derived.signatories[0].title}) from the institution settings. Add signatories here to manage signature images and more signers.
                  </Alert>
                )}
                {!disabled && (
                  <Button
                    variant="outlined"
                    startIcon={<Iconify icon="mdi:plus" />}
                    onClick={() =>
                      setKit((current) => ({
                        ...current,
                        signatories: [...current.signatories, { key: current.signatories.length ? `signatory-${current.signatories.length + 1}` : 'registrar', name: '', title: '' }],
                      }))
                    }
                  >
                    Add signatory
                  </Button>
                )}
              </Stack>
            </Section>

            <Section icon="mdi:email-outline" title="Email & currency">
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Email footer line" placeholder="e.g. You are receiving this because you have an account with us." value={kit.email?.footerText || ''} disabled={disabled} onChange={(event) => set('email', 'footerText')(event.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Button roundness: {kit.email?.buttonRadius ?? effective?.email?.buttonRadius ?? 6}px
                  </Typography>
                  <Slider size="small" min={0} max={24} value={Number(kit.email?.buttonRadius ?? effective?.email?.buttonRadius ?? 6)} disabled={disabled} onChange={(_event, value) => set('email', 'buttonRadius')(value)} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth size="small" label="Currency" placeholder="NGN" value={kit.currency?.code || ''} disabled={disabled} onChange={(event) => set('currency', 'code')(event.target.value)} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField fullWidth size="small" label="Symbol" placeholder="₦" value={kit.currency?.symbol || ''} disabled={disabled} onChange={(event) => set('currency', 'symbol')(event.target.value)} />
                </Grid>
              </Grid>
            </Section>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Showcase kit={showcaseKit} />
        </Grid>
      </Grid>

      <Dialog open={publishOpen} onClose={() => setPublishOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Publish the Brand Kit?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Every document, email and public page — in both the academic and the admissions systems — uses the new brand from now on.
          </Typography>
          <TextField fullWidth size="small" label="What changed?" placeholder="e.g. New logo and registrar" value={note} onChange={(event) => setNote(event.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setPublishOpen(false)}>
            Cancel
          </Button>
          <LoadingButton variant="contained" loading={publishing} onClick={publish}>
            Publish
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Brand Kit history</DialogTitle>
        {versions.isLoading && <LinearProgress />}
        <DialogContent>
          {(versions.data || []).map((version) => (
            <Stack key={version.version} direction="row" spacing={2} alignItems="center" sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Chip size="small" label={`v${version.version}`} color={version.version === data?.published?.version ? 'success' : 'default'} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2">{version.note || <em>No note</em>}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {version.publishedBy?.name} · {timeAgo(version.publishedAt)}
                </Typography>
              </Box>
              {canEdit && (
                <Button
                  size="small"
                  color="inherit"
                  startIcon={<Iconify icon="mdi:restore" />}
                  onClick={async () => {
                    try {
                      const res = await brandApi.restore(version.version, { baseRevision: revision.current });
                      revision.current = res.revision;
                      const restored = normalize(res.draft?.kit);
                      setKit(restored);
                      lastSaved.current = JSON.stringify(restored);
                      setHistoryOpen(false);
                      enqueueSnackbar(`Version ${version.version} restored as a draft — publish it to make it live`, { variant: 'success' });
                    } catch (err) {
                      enqueueSnackbar(err.message, { variant: 'error' });
                    }
                  }}
                >
                  Restore
                </Button>
              )}
            </Stack>
          ))}
          {!versions.isLoading && !(versions.data || []).length && (
            <Typography variant="body2" color="text.secondary">
              Nothing published yet — documents use the institution settings.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
