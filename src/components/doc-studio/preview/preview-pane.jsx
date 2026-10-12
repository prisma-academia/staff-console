import PropTypes from 'prop-types';
import { useRef, useState, useEffect, useCallback } from 'react';

import {
  Box,
  Chip,
  Stack,
  Alert,
  Button,
  Avatar,
  Tooltip,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  Autocomplete,
  ToggleButton,
  LinearProgress,
  CircularProgress,
  ToggleButtonGroup,
} from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const A4 = { portrait: { w: 794, h: 1123 }, landscape: { w: 1123, h: 794 } };

/** Watches an element's width (for "fit" zoom). */
function useWidth(ref) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

// ----------------------------------------------------------------------

/**
 * A4 print preview. The iframe is laid out at TRUE page size and scaled with a
 * transform — shrinking its width instead would reflow the text and show page
 * breaks that will not happen. Dashed guides mark where each sheet ends.
 *
 * Sandboxed without same-origin: the page's own script (watermark tiling) may
 * run, but cannot reach the console. Height and print go by postMessage.
 */
export function PrintFrame({ html, zoom, landscape, frameRef }) {
  const page = landscape ? A4.landscape : A4.portrait;
  const [height, setHeight] = useState(page.h);
  const localRef = useRef(null);
  const ref = frameRef || localRef;

  useEffect(() => {
    const onMessage = (event) => {
      if (ref.current && event.source === ref.current.contentWindow && event.data?.type === 'doc:height') {
        setHeight(Math.max(page.h, Math.ceil(event.data.height)));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [ref, page.h]);

  const pages = Math.max(1, Math.ceil(height / page.h - 0.02));
  const scaledH = pages * page.h * zoom;

  return (
    <Box sx={{ position: 'relative', width: page.w * zoom, height: scaledH, flexShrink: 0, mx: 'auto' }}>
      <Box
        ref={ref}
        component="iframe"
        title="Document preview"
        srcDoc={html}
        sandbox="allow-scripts allow-modals"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: page.w,
          height: pages * page.h,
          border: 0,
          bgcolor: 'common.white',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          boxShadow: (theme) => theme.customShadows?.z24 || '0 12px 40px rgba(0,0,0,.15)',
          borderRadius: '2px',
        }}
      />
      {Array.from({ length: pages - 1 }, (_, index) => (
        <Box key={index} sx={{ position: 'absolute', left: -6, right: -6, top: (index + 1) * page.h * zoom, borderTop: '1.5px dashed', borderColor: 'warning.main', pointerEvents: 'none' }}>
          <Typography
            variant="caption"
            sx={{ position: 'absolute', right: 0, top: -9, px: 0.75, borderRadius: 1, fontSize: 10, fontWeight: 700, bgcolor: 'warning.main', color: 'warning.contrastText' }}
          >
            Page {index + 2}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

PrintFrame.propTypes = { html: PropTypes.string, zoom: PropTypes.number, landscape: PropTypes.bool, frameRef: PropTypes.object };

/**
 * Scriptless frame (email, public page). `allow-same-origin` WITHOUT
 * `allow-scripts` is safe — nothing in it can run — and lets the console
 * measure the content height.
 */
function AutoHeightFrame({ html, width, title, minHeight = 300 }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(minHeight);
  const measure = useCallback(() => {
    const doc = ref.current?.contentDocument;
    if (doc?.documentElement) setHeight(Math.max(minHeight, doc.documentElement.scrollHeight));
  }, [minHeight]);

  return (
    <Box
      ref={ref}
      component="iframe"
      title={title}
      srcDoc={html}
      sandbox="allow-same-origin"
      onLoad={measure}
      sx={{ width, height, border: 0, display: 'block', bgcolor: 'common.white', transition: 'width .3s' }}
    />
  );
}

AutoHeightFrame.propTypes = { html: PropTypes.string, width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]), title: PropTypes.string, minHeight: PropTypes.number };

// ----------------------------------------------------------------------

/** An inbox row above the email, then the email itself in a device frame. */
export function EmailFrame({ result, device, brandName }) {
  const width = device === 'mobile' ? 375 : 640;
  const initials = (brandName || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  return (
    <Stack spacing={2} alignItems="center" sx={{ width: 1 }}>
      <Box sx={{ width: Math.min(width, 640), maxWidth: 1, bgcolor: 'background.paper', borderRadius: 2, boxShadow: (theme) => theme.customShadows?.card, p: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>{initials}</Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Stack direction="row" justifyContent="space-between" spacing={1}>
              <Typography variant="subtitle2" noWrap>
                {brandName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                now
              </Typography>
            </Stack>
            <Typography variant="body2" fontWeight={700} noWrap>
              {result?.subject || <em style={{ fontWeight: 400, opacity: 0.6 }}>No subject</em>}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {result?.preheader || result?.text?.slice(0, 90)}
            </Typography>
          </Box>
        </Stack>
      </Box>
      <Box
        sx={{
          width: device === 'mobile' ? 375 + 24 : width,
          maxWidth: 1,
          borderRadius: device === 'mobile' ? '36px' : 2,
          p: device === 'mobile' ? '12px' : 0,
          bgcolor: device === 'mobile' ? 'grey.900' : 'transparent',
          boxShadow: (theme) => theme.customShadows?.z16,
          overflow: 'hidden',
          transition: 'all .3s',
        }}
      >
        <Box sx={{ borderRadius: device === 'mobile' ? '26px' : 2, overflow: 'hidden', bgcolor: 'common.white' }}>
          {result?.html && <AutoHeightFrame html={result.html} width="100%" title="Email preview" />}
        </Box>
      </Box>
    </Stack>
  );
}

EmailFrame.propTypes = { result: PropTypes.object, device: PropTypes.string, brandName: PropTypes.string };

const segmentColour = (segments) => {
  if (segments > 3) return 'error';
  if (segments > 1) return 'warning';
  return 'success';
};

/** A phone with the message bubble, and the numbers that decide the bill. */
export function SmsFrame({ result, sender }) {
  const sms = result?.sms;
  const unicode = sms?.encoding === 'UCS-2';
  return (
    <Stack spacing={2} alignItems="center">
      <Box sx={{ width: 300, height: 560, borderRadius: '44px', bgcolor: 'grey.900', p: '12px', boxShadow: (theme) => theme.customShadows?.z24 }}>
        <Box sx={{ height: 1, borderRadius: '34px', bgcolor: '#f2f2f7', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ pt: 4, pb: 1.5, textAlign: 'center', bgcolor: 'rgba(255,255,255,.85)', borderBottom: '1px solid #e5e5ea' }}>
            <Avatar sx={{ width: 40, height: 40, mx: 'auto', mb: 0.5, bgcolor: 'grey.400', fontSize: 15 }}>{(sender || 'S').slice(0, 2).toUpperCase()}</Avatar>
            <Typography variant="caption" fontWeight={700}>
              {sender || 'Sender'}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mb: 1 }}>
              Today
            </Typography>
            {result?.text ? (
              <Box sx={{ maxWidth: '85%', px: 1.5, py: 1, borderRadius: '18px', borderBottomLeftRadius: '6px', bgcolor: '#e5e5ea', color: '#000', whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.35, wordBreak: 'break-word' }}>
                {result.text}
              </Box>
            ) : (
              <Typography variant="caption" color="text.disabled">
                The message is empty.
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      {sms && (
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
          <Chip size="small" label={`${sms.length} characters`} />
          <Chip size="small" color={unicode ? 'warning' : 'default'} label={unicode ? 'Unicode (70/SMS)' : 'GSM-7 (160/SMS)'} icon={<Iconify icon={unicode ? 'mdi:alert-outline' : 'mdi:check'} width={14} />} />
          <Chip size="small" color={segmentColour(sms.segments)} label={`${sms.segments} SMS${sms.segments === 1 ? '' : ' parts'} · ${sms.remaining} left`} />
        </Stack>
      )}
    </Stack>
  );
}

SmsFrame.propTypes = { result: PropTypes.object, sender: PropTypes.string };

/** A public verification page inside browser chrome. */
export function WebFrame({ result, device }) {
  const width = device === 'mobile' ? 390 : 860;
  return (
    <Box sx={{ width, maxWidth: 1, mx: 'auto', borderRadius: 2, overflow: 'hidden', boxShadow: (theme) => theme.customShadows?.z16, bgcolor: 'background.paper', transition: 'width .3s' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.5, py: 1, bgcolor: 'grey.200' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((colour) => (
          <Box key={colour} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colour }} />
        ))}
        <Box sx={{ flexGrow: 1, mx: 1, px: 1.5, py: 0.25, borderRadius: 5, bgcolor: 'common.white', display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Iconify icon="mdi:lock" width={12} sx={{ color: 'success.main' }} />
          <Typography variant="caption" color="text.secondary" noWrap>
            …/verify — opened from the QR code
          </Typography>
        </Box>
      </Stack>
      {result?.html && <AutoHeightFrame html={result.html} width="100%" title="Public page preview" minHeight={420} />}
    </Box>
  );
}

WebFrame.propTypes = { result: PropTypes.object, device: PropTypes.string };

// ----------------------------------------------------------------------

/** "Preview with": search real records, or fall back to sample data. */
export function RecordPicker({ api, typeKey, noun, value, onChange }) {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const rows = await api.searchRecords(typeKey, input);
        if (alive) setOptions(rows || []);
      } catch (error) {
        if (alive) setOptions([]);
      } finally {
        if (alive) setLoading(false);
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [api, typeKey, input]);

  return (
    <Autocomplete
      size="small"
      sx={{ flexGrow: 1, minWidth: 200 }}
      options={options}
      value={value}
      loading={loading}
      filterOptions={(x) => x}
      onInputChange={(_event, next, reason) => reason === 'input' && setInput(next)}
      onChange={(_event, next) => onChange(next)}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      getOptionLabel={(option) => option.label || ''}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {option.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {option.sublabel}
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={`Sample data — search for a real ${noun || 'record'}`}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <Iconify icon={value ? 'mdi:account-search' : 'mdi:flask-outline'} width={18} sx={{ ml: 0.5, mr: 0.5, color: value ? 'primary.main' : 'text.disabled' }} />
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

RecordPicker.propTypes = { api: PropTypes.object, typeKey: PropTypes.string, noun: PropTypes.string, value: PropTypes.object, onChange: PropTypes.func };

// ----------------------------------------------------------------------

const ZOOMS = [
  { value: 'fit', label: 'Fit' },
  { value: 0.5, label: '50%' },
  { value: 0.75, label: '75%' },
  { value: 1, label: '100%' },
];

/**
 * The right-hand preview: whatever the channel, it shows the server's render of
 * the working copy — the same function that produces the real output.
 */
export default function PreviewPane({ channel, api, typeKey, recordNoun, supportsRecords, record, onRecordChange, preview, landscape, brandName, smsSender, onExactPdf, exactBusy }) {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const width = useWidth(containerRef);
  const [zoom, setZoom] = useState('fit');
  const [device, setDevice] = useState('desktop');
  const page = landscape ? A4.landscape : A4.portrait;
  const fit = width ? Math.min(1, Math.max(0.3, (width - 48) / page.w)) : 0.6;
  const scale = zoom === 'fit' ? fit : zoom;
  const { result, pending, error, refresh } = preview;

  const print = () => frameRef.current?.contentWindow?.postMessage('doc:print', '*');

  return (
    <Stack sx={{ height: 1, minHeight: 0, bgcolor: (theme) => theme.palette.grey[100] }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        {supportsRecords ? (
          <RecordPicker api={api} typeKey={typeKey} noun={recordNoun} value={record} onChange={onRecordChange} />
        ) : (
          <Chip icon={<Iconify icon="mdi:flask-outline" width={16} />} label="Sample values" size="small" sx={{ mr: 'auto' }} />
        )}

        {channel === 'print' && (
          <TextField select size="small" value={zoom} onChange={(event) => setZoom(event.target.value)} sx={{ width: 92 }}>
            {ZOOMS.map((option) => (
              <MenuItem key={option.label} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}
        {(channel === 'email' || channel === 'web') && (
          <ToggleButtonGroup size="small" exclusive value={device} onChange={(_event, next) => next && setDevice(next)}>
            <ToggleButton value="desktop">
              <Tooltip title="Desktop">
                <Iconify icon="mdi:monitor" width={18} />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="mobile">
              <Tooltip title="Mobile">
                <Iconify icon="mdi:cellphone" width={18} />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        )}
        <Tooltip title="Refresh preview">
          <span>
            <IconButton onClick={refresh} disabled={pending}>
              <Iconify icon="mdi:refresh" />
            </IconButton>
          </span>
        </Tooltip>
        {channel === 'print' && (
          <>
            <Tooltip title="Print this preview">
              <span>
                <IconButton onClick={print} disabled={!result?.html}>
                  <Iconify icon="mdi:printer-outline" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Open the exact PDF the server produces">
              <span>
                <Button size="small" variant="outlined" onClick={onExactPdf} disabled={exactBusy || !result?.html} startIcon={exactBusy ? <CircularProgress size={14} /> : <Iconify icon="mdi:file-pdf-box" />}>
                  PDF
                </Button>
              </span>
            </Tooltip>
          </>
        )}
      </Stack>

      <Box sx={{ height: 3 }}>{pending && <LinearProgress sx={{ height: 3 }} />}</Box>

      {error && (
        <Alert severity="error" sx={{ m: 1.5 }} action={<Button color="inherit" size="small" onClick={refresh}>Retry</Button>}>
          {error.message || 'The preview could not be rendered.'}
        </Alert>
      )}

      <Box ref={containerRef} sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
        {!result && !error && (
          <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ height: 1, color: 'text.disabled' }}>
            <CircularProgress size={28} />
            <Typography variant="body2">Rendering…</Typography>
          </Stack>
        )}
        {result && channel === 'print' && <PrintFrame html={result.html} zoom={scale} landscape={landscape} frameRef={frameRef} />}
        {result && channel === 'email' && <EmailFrame result={result} device={device} brandName={brandName} />}
        {result && channel === 'sms' && <SmsFrame result={result} sender={smsSender} />}
        {result && channel === 'web' && <WebFrame result={result} device={device} />}
      </Box>
    </Stack>
  );
}

PreviewPane.propTypes = {
  channel: PropTypes.string,
  api: PropTypes.object,
  typeKey: PropTypes.string,
  recordNoun: PropTypes.string,
  supportsRecords: PropTypes.bool,
  record: PropTypes.object,
  onRecordChange: PropTypes.func,
  preview: PropTypes.object,
  landscape: PropTypes.bool,
  brandName: PropTypes.string,
  smsSender: PropTypes.string,
  onExactPdf: PropTypes.func,
  exactBusy: PropTypes.bool,
};
