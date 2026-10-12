import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
  Chip,
  Stack,
  Alert,
  Button,
  Dialog,
  Drawer,
  Slider,
  Divider,
  Checkbox,
  IconButton,
  Typography,
  DialogTitle,
  ToggleButton,
  DialogContent,
  LinearProgress,
  ToggleButtonGroup,
} from '@mui/material';

import Iconify from 'src/components/iconify';

import { timeAgo } from './hooks';
import { DiffText } from './dialogs';
import { contentText } from './diff';
import { SmsFrame, WebFrame, EmailFrame, PrintFrame } from './preview/preview-pane';

// ----------------------------------------------------------------------

const dotColour = (entry) => {
  if (entry.live) return 'success.main';
  if (entry.side === 'draft') return 'warning.main';
  return 'grey.300';
};

const SOURCE = {
  publish: { label: 'Published', color: 'primary' },
  migration: { label: 'Carried over', color: 'info' },
  restore: { label: 'Restored', color: 'warning' },
  seed: { label: 'Seeded', color: 'default' },
};

/** A side of a comparison: a version number, 'draft' or 'default'. */
function useSideContent(api, typeKey, side) {
  return useQuery({
    queryKey: ['doc-studio', 'version', typeKey, side],
    enabled: typeof side === 'number',
    queryFn: () => api.version(typeKey, side),
    staleTime: Infinity,
  });
}

function sideLabel(side) {
  if (side === 'draft') return 'Your draft';
  if (side === 'default') return 'Built-in default';
  return `Version ${side}`;
}

function RenderedSide({ api, typeKey, channel, content, landscape, zoom }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['doc-studio', 'compare-render', typeKey, JSON.stringify(content)],
    enabled: Boolean(content),
    queryFn: () => api.preview({ key: typeKey, content }),
    staleTime: 60 * 1000,
  });
  if (isLoading) return <LinearProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (!data) return null;
  if (channel === 'print') return <PrintFrame html={data.html} zoom={zoom} landscape={landscape} />;
  if (channel === 'email') return <EmailFrame result={data} device="desktop" brandName="" />;
  if (channel === 'sms') return <SmsFrame result={data} />;
  return <WebFrame result={data} device="desktop" />;
}

RenderedSide.propTypes = { api: PropTypes.object, typeKey: PropTypes.string, channel: PropTypes.string, content: PropTypes.object, landscape: PropTypes.bool, zoom: PropTypes.number };

/**
 * Compare any two versions three ways: side by side, onion-skin overlay (drag
 * the slider to fade between them — misaligned lines jump out), or as a
 * word-level diff of the wording.
 */
export function CompareDialog({ open, onClose, api, typeKey, channel, left, right, draftContent, defaultContent, landscape }) {
  const [mode, setMode] = useState('side');
  const [mix, setMix] = useState(50);
  const leftQuery = useSideContent(api, typeKey, left);
  const rightQuery = useSideContent(api, typeKey, right);
  const resolve = (side, query) => {
    if (side === 'draft') return draftContent;
    if (side === 'default') return defaultContent;
    return query.data?.content;
  };
  const leftContent = resolve(left, leftQuery);
  const rightContent = resolve(right, rightQuery);
  const canOverlay = channel === 'print';

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogTitle sx={{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <IconButton onClick={onClose}>
            <Iconify icon="mdi:close" />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {sideLabel(left)} <Iconify icon="mdi:arrow-right" width={18} sx={{ mx: 1, verticalAlign: 'middle' }} /> {sideLabel(right)}
          </Typography>
          <ToggleButtonGroup size="small" exclusive value={mode} onChange={(_event, next) => next && setMode(next)}>
            <ToggleButton value="side">
              <Iconify icon="mdi:view-split-vertical" width={18} sx={{ mr: 0.75 }} /> Side by side
            </ToggleButton>
            {canOverlay && (
              <ToggleButton value="overlay">
                <Iconify icon="mdi:layers-outline" width={18} sx={{ mr: 0.75 }} /> Overlay
              </ToggleButton>
            )}
            <ToggleButton value="text">
              <Iconify icon="mdi:text-box-search-outline" width={18} sx={{ mr: 0.75 }} /> Wording
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ bgcolor: 'grey.100', p: 3 }}>
        {mode === 'side' && (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {[[left, leftContent], [right, rightContent]].map(([side, content]) => (
              <Stack key={String(side)} spacing={1.5} alignItems="center">
                <Chip label={sideLabel(side)} color={side === right ? 'primary' : 'default'} />
                <RenderedSide api={api} typeKey={typeKey} channel={channel} content={content} landscape={landscape} zoom={0.55} />
              </Stack>
            ))}
          </Box>
        )}
        {mode === 'overlay' && (
          <Stack spacing={2} alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: 620, maxWidth: 1 }}>
              <Typography variant="caption" noWrap>
                {sideLabel(left)}
              </Typography>
              <Slider value={mix} onChange={(_event, next) => setMix(next)} />
              <Typography variant="caption" noWrap>
                {sideLabel(right)}
              </Typography>
            </Stack>
            <Box sx={{ position: 'relative' }}>
              <Box sx={{ opacity: 1 - mix / 100 }}>
                <RenderedSide api={api} typeKey={typeKey} channel={channel} content={leftContent} landscape={landscape} zoom={0.75} />
              </Box>
              <Box sx={{ position: 'absolute', inset: 0, opacity: mix / 100 }}>
                <RenderedSide api={api} typeKey={typeKey} channel={channel} content={rightContent} landscape={landscape} zoom={0.75} />
              </Box>
            </Box>
          </Stack>
        )}
        {mode === 'text' && (
          <Box sx={{ maxWidth: 860, mx: 'auto', bgcolor: 'background.paper', p: 3, borderRadius: 2 }}>
            <DiffText before={contentText(leftContent)} after={contentText(rightContent)} maxHeight={10000} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

CompareDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  api: PropTypes.object,
  typeKey: PropTypes.string,
  channel: PropTypes.string,
  left: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  right: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  draftContent: PropTypes.object,
  defaultContent: PropTypes.object,
  landscape: PropTypes.bool,
};

// ----------------------------------------------------------------------

/**
 * The template's timeline. Tick two entries to compare them; restoring puts an
 * old version into the DRAFT — it only goes live when you publish it.
 */
export function HistoryDrawer({ open, onClose, api, typeKey, channel, liveVersion, hasDraft, draftContent, defaultContent, landscape, canEdit, onRestore }) {
  const [picked, setPicked] = useState([]);
  const [compare, setCompare] = useState(null);
  const { data: versions = [], isLoading, refetch } = useQuery({
    queryKey: ['doc-studio', 'versions', typeKey],
    queryFn: () => api.versions(typeKey),
    enabled: open,
  });

  useEffect(() => {
    if (open) refetch();
  }, [open, refetch]);

  const toggle = (side) =>
    setPicked((current) => (current.includes(side) ? current.filter((item) => item !== side) : [...current.slice(-1), side]));

  const order = (a, b) => {
    const rank = (side) => {
      if (side === 'default') return -1;
      if (side === 'draft') return 1e9;
      return side;
    };
    return rank(a) <= rank(b) ? [a, b] : [b, a];
  };

  const entries = [
    ...(hasDraft ? [{ side: 'draft', title: 'Your draft', subtitle: 'Not live yet', icon: 'mdi:pencil-outline', color: 'warning' }] : []),
    ...versions.map((version) => ({
      side: version.version,
      title: `Version ${version.version}`,
      subtitle: `${version.publishedBy?.name || 'Someone'} · ${timeAgo(version.publishedAt)}`,
      note: version.note,
      source: version.source,
      live: version.version === liveVersion,
    })),
    { side: 'default', title: 'Built-in default', subtitle: 'What prints when nothing is published', icon: 'mdi:package-variant-closed', color: 'default', live: !liveVersion },
  ];

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: 1, sm: 420 } } }}>
        <Stack direction="row" alignItems="center" sx={{ px: 2.5, py: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Version history
          </Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="mdi:close" />
          </IconButton>
        </Stack>
        <Divider />
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'grey.100' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
              Tick two entries to compare them.
            </Typography>
            <Button size="small" variant="contained" disabled={picked.length !== 2} startIcon={<Iconify icon="mdi:compare" />} onClick={() => setCompare(order(picked[0], picked[1]))}>
              Compare
            </Button>
          </Stack>
        </Box>
        {isLoading && <LinearProgress />}
        <Box sx={{ overflowY: 'auto', flexGrow: 1, px: 2.5, py: 2 }}>
          {entries.map((entry, index) => (
            <Stack key={String(entry.side)} direction="row" spacing={1.5} sx={{ position: 'relative', pb: 2.5 }}>
              <Stack alignItems="center" sx={{ width: 28 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: dotColour(entry),
                    color: entry.live || entry.side === 'draft' ? 'common.white' : 'text.secondary',
                    zIndex: 1,
                  }}
                >
                  <Iconify icon={entry.icon || (entry.live ? 'mdi:broadcast' : 'mdi:history')} width={15} />
                </Box>
                {index < entries.length - 1 && <Box sx={{ flexGrow: 1, width: 2, bgcolor: 'divider', mt: 0.5 }} />}
              </Stack>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Typography variant="subtitle2">{entry.title}</Typography>
                  {entry.live && <Chip size="small" color="success" label="Live" sx={{ height: 20 }} />}
                  {entry.source && SOURCE[entry.source] && entry.source !== 'publish' && <Chip size="small" variant="outlined" color={SOURCE[entry.source].color} label={SOURCE[entry.source].label} sx={{ height: 20 }} />}
                </Stack>
                <Typography variant="caption" color="text.secondary" display="block">
                  {entry.subtitle}
                </Typography>
                {entry.note && (
                  <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                    “{entry.note}”
                  </Typography>
                )}
                <Stack direction="row" spacing={0.5} sx={{ mt: 0.75 }}>
                  {typeof entry.side === 'number' && canEdit && (
                    <Button size="small" color="inherit" startIcon={<Iconify icon="mdi:restore" width={16} />} onClick={() => onRestore(entry.side)}>
                      Restore as draft
                    </Button>
                  )}
                  {typeof entry.side === 'number' && !(entry.live && !hasDraft) && (
                    <Button size="small" color="inherit" startIcon={<Iconify icon="mdi:eye-outline" width={16} />} onClick={() => setCompare([entry.side, hasDraft ? 'draft' : liveVersion || 'default'])}>
                      Compare with {hasDraft ? 'draft' : 'live'}
                    </Button>
                  )}
                </Stack>
              </Box>
              <Checkbox size="small" checked={picked.includes(entry.side)} onChange={() => toggle(entry.side)} sx={{ alignSelf: 'flex-start' }} />
            </Stack>
          ))}
        </Box>
      </Drawer>

      {compare && (
        <CompareDialog
          open
          onClose={() => setCompare(null)}
          api={api}
          typeKey={typeKey}
          channel={channel}
          left={compare[0]}
          right={compare[1]}
          draftContent={draftContent}
          defaultContent={defaultContent}
          landscape={landscape}
        />
      )}
    </>
  );
}

HistoryDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  api: PropTypes.object,
  typeKey: PropTypes.string,
  channel: PropTypes.string,
  liveVersion: PropTypes.number,
  hasDraft: PropTypes.bool,
  draftContent: PropTypes.object,
  defaultContent: PropTypes.object,
  landscape: PropTypes.bool,
  canEdit: PropTypes.bool,
  onRestore: PropTypes.func,
};
