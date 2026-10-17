import PropTypes from 'prop-types';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import useMediaQuery from '@mui/material/useMediaQuery';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

let pdfjsPromise = null;

/** pdf.js is large, so it loads on first use only; the legacy build covers older browsers. */
function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs')
      .then((lib) => {
        lib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
        return lib;
      })
      .catch((error) => {
        pdfjsPromise = null;
        throw error;
      });
  }
  return pdfjsPromise;
}

const ZOOMS = [1, 1.25, 1.5, 2];
// Pages fit the dialog width but never grow past this at 100% (an A4 page stays readable, not huge).
const MAX_FIT_WIDTH = 900;

export const pdfFileName = (filename) => {
  const base = String(filename || 'document').replace(/[\\/:*?"<>|]+/g, '-');
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
};

/** Accepts a Blob or { blob, filename } from fetchBlob. */
const normaliseResult = (result) => {
  if (result instanceof Blob) return { blob: result, filename: null };
  if (result && result.blob instanceof Blob) {
    // Some helpers fall back to a placeholder name (e.g. export.csv) when the server sends none.
    const name = /\.pdf$/i.test(result.filename || '') ? result.filename : null;
    return { blob: result.blob, filename: name };
  }
  throw new Error('The document could not be loaded');
};

// ----------------------------------------------------------------------

/** Draws every page to a canvas sized to the container width (sharp on high-DPI screens). */
function PdfPages({ doc, zoom }) {
  const hostRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !width) return undefined;
    let cancelled = false;
    const tasks = [];

    (async () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const fitWidth = Math.min(width, MAX_FIT_WIDTH);
      for (let n = 1; n <= doc.numPages; n += 1) {
        // eslint-disable-next-line no-await-in-loop
        const page = await doc.getPage(n);
        if (cancelled) return;
        const base = page.getViewport({ scale: 1 });
        const cssWidth = fitWidth * zoom;
        const viewport = page.getViewport({ scale: (cssWidth / base.width) * dpr });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        Object.assign(canvas.style, {
          display: 'block',
          margin: '0 auto',
          width: `${cssWidth}px`,
          height: `${(viewport.height / dpr).toFixed(1)}px`,
          background: '#fff',
          borderRadius: '2px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
        });
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', `Page ${n} of ${doc.numPages}`);
        const task = page.render({ canvas, viewport });
        tasks.push(task);
        // eslint-disable-next-line no-await-in-loop
        await task.promise;
        if (cancelled) return;
        // Show pages as they finish rather than waiting for the whole document.
        if (n === 1) {
          host.replaceChildren(canvas);
          setReady(true);
        } else {
          host.appendChild(canvas);
        }
      }
    })().catch((error) => {
      if (!cancelled && error?.name !== 'RenderingCancelledException') {
        console.error('PDF render failed', error);
      }
    });

    return () => {
      cancelled = true;
      tasks.forEach((task) => task.cancel());
    };
  }, [doc, width, zoom]);

  return (
    <Box sx={{ overflowX: 'auto' }}>
      {/* The host's children are canvases managed here, never by React. */}
      <Box ref={hostRef} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} />
      {!ready && <PageSkeleton />}
    </Box>
  );
}

PdfPages.propTypes = {
  doc: PropTypes.object.isRequired,
  zoom: PropTypes.number.isRequired,
};

function PageSkeleton() {
  return (
    <Skeleton
      variant="rectangular"
      sx={{ mx: 'auto', width: '100%', maxWidth: MAX_FIT_WIDTH, height: 'auto', aspectRatio: '1 / 1.414', borderRadius: 0.5 }}
    />
  );
}

// ----------------------------------------------------------------------

/**
 * Toolbar + pages. Re-keyed on every open and on retry, so each load starts clean.
 * Every object URL it creates (download, print) is revoked when it unmounts.
 */
function ViewerBody({ title, filename, fetchBlob, onClose, onRetry }) {
  const [blob, setBlob] = useState(null);
  const [resolvedName, setResolvedName] = useState(null);
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);
  const [zoomIdx, setZoomIdx] = useState(0);
  const urlsRef = useRef([]);
  const printFrameRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let loaded = null;

    (async () => {
      const [result, lib] = await Promise.all([fetchBlob(), loadPdfJs()]);
      if (cancelled) return;
      const file = normaliseResult(result);
      setBlob(file.blob);
      setResolvedName(file.filename);
      const data = new Uint8Array(await file.blob.arrayBuffer());
      loaded = await lib.getDocument({ data, isEvalSupported: false }).promise;
      if (cancelled) {
        loaded.destroy();
        return;
      }
      setDoc(loaded);
    })().catch((err) => {
      if (cancelled) return;
      setError(err?.message || 'The document could not be opened.');
    });

    return () => {
      cancelled = true;
      if (loaded) loaded.destroy();
    };
  }, [fetchBlob]);

  // Object URLs live until the dialog closes (a print or download may still be using them).
  useEffect(
    () => () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current = [];
      if (printFrameRef.current) printFrameRef.current.remove();
    },
    []
  );

  const objectUrl = useCallback(() => {
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    urlsRef.current.push(url);
    return url;
  }, [blob]);

  const saveName = pdfFileName(resolvedName || filename || title);

  const handleDownload = () => {
    if (!blob) return;
    const link = document.createElement('a');
    link.href = objectUrl();
    link.download = saveName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    if (!blob) return;
    if (printFrameRef.current) printFrameRef.current.remove();
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
    frame.onload = () => {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch {
        // Some browsers block printing a PDF frame; fall back to the browser's own viewer.
        window.open(frame.src, '_blank', 'noopener,noreferrer');
      }
    };
    frame.src = objectUrl();
    document.body.appendChild(frame);
    printFrameRef.current = frame;
  };

  let subtitle = 'Preparing document…';
  if (doc) subtitle = `${doc.numPages} ${doc.numPages === 1 ? 'page' : 'pages'} · PDF`;
  else if (error) subtitle = 'Not available';

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: { xs: 1, sm: 2 }, py: 1.25, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <IconButton onClick={onClose} aria-label="Close preview">
          <Iconify icon="eva:close-fill" />
        </IconButton>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" noWrap component="h2">
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="p">
            {subtitle}
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <Tooltip title="Zoom out">
            <span>
              <IconButton
                aria-label="Zoom out"
                disabled={!doc || zoomIdx === 0}
                onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
              >
                <Iconify icon="eva:minus-circle-outline" />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="body2" color="text.secondary" sx={{ width: 48, textAlign: 'center' }}>
            {Math.round(ZOOMS[zoomIdx] * 100)}%
          </Typography>
          <Tooltip title="Zoom in">
            <span>
              <IconButton
                aria-label="Zoom in"
                disabled={!doc || zoomIdx === ZOOMS.length - 1}
                onClick={() => setZoomIdx((i) => Math.min(ZOOMS.length - 1, i + 1))}
              >
                <Iconify icon="eva:plus-circle-outline" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <Tooltip title="Print">
          <span>
            <IconButton aria-label="Print" disabled={!doc} onClick={handlePrint}>
              <Iconify icon="eva:printer-outline" />
            </IconButton>
          </span>
        </Tooltip>
        <LoadingButton
          variant="contained"
          loading={!blob && !error}
          disabled={!blob}
          onClick={handleDownload}
          startIcon={<Iconify icon="eva:download-fill" />}
          sx={{ flexShrink: 0 }}
        >
          Download
        </LoadingButton>
      </Stack>

      <Box
        aria-busy={!doc && !error}
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', bgcolor: 'grey.200', px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}
      >
        {error && (
          <Stack alignItems="center" spacing={1.5} sx={{ maxWidth: 380, mx: 'auto', py: 8, textAlign: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                color: 'error.main',
                bgcolor: (t) => t.palette.error.lighter || t.palette.action.hover,
              }}
            >
              <Iconify icon="eva:alert-triangle-outline" width={24} />
            </Box>
            <Typography variant="subtitle1">We couldn&apos;t open this document</Typography>
            <Typography variant="body2" color="text.secondary">
              {error}
            </Typography>
            <Button variant="outlined" onClick={onRetry} startIcon={<Iconify icon="eva:refresh-fill" />}>
              Try again
            </Button>
          </Stack>
        )}
        {!error && doc && <PdfPages doc={doc} zoom={ZOOMS[zoomIdx]} />}
        {!error && !doc && (
          <Box role="status" aria-label="Loading document">
            <PageSkeleton />
          </Box>
        )}
      </Box>
    </>
  );
}

ViewerBody.propTypes = {
  title: PropTypes.string,
  filename: PropTypes.string,
  fetchBlob: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

/**
 * In-app PDF preview. `fetchBlob` resolves to a Blob (or { blob, filename }); the
 * document renders with pdf.js and the toolbar offers zoom, Print and Download.
 */
export default function PdfPreviewDialog({ open, onClose, title, filename, fetchBlob }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [attempt, setAttempt] = useState(0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...(fullScreen ? {} : { height: 'calc(100% - 64px)' }),
        },
      }}
    >
      {/* Dialog unmounts its content once closed, so each open loads from scratch. */}
      {fetchBlob && (
        <ViewerBody
          key={attempt}
          title={title || 'Document'}
          filename={filename}
          fetchBlob={fetchBlob}
          onClose={onClose}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      )}
    </Dialog>
  );
}

PdfPreviewDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  filename: PropTypes.string,
  fetchBlob: PropTypes.func,
};

// ----------------------------------------------------------------------

/**
 * const preview = usePdfPreview();
 * preview.open({ title, filename, fetchBlob });
 * return <>{button}{preview.dialog}</>;
 */
export function usePdfPreview() {
  const [state, setState] = useState({ open: false, seq: 0 });

  const open = useCallback(({ title, filename, fetchBlob }) => {
    setState((prev) => ({ open: true, seq: prev.seq + 1, title, filename, fetchBlob }));
  }, []);

  const close = useCallback(() => setState((prev) => ({ ...prev, open: false })), []);

  const dialog = (
    <PdfPreviewDialog
      key={state.seq}
      open={state.open}
      onClose={close}
      title={state.title}
      filename={state.filename}
      fetchBlob={state.fetchBlob}
    />
  );

  return { open, close, dialog };
}

/** A button that opens a PDF in the in-app preview (Download and Print live there). */
export function PdfPreviewButton({ title, filename, fetchBlob, children, startIcon, ...other }) {
  const preview = usePdfPreview();
  const heading = title || (typeof children === 'string' ? children : 'Document');

  return (
    <>
      <Button
        variant="outlined"
        startIcon={startIcon === undefined ? <Iconify icon="vscode-icons:file-type-pdf2" /> : startIcon}
        {...other}
        onClick={() => preview.open({ title: heading, filename, fetchBlob })}
      >
        {children}
      </Button>
      {preview.dialog}
    </>
  );
}

PdfPreviewButton.propTypes = {
  title: PropTypes.string,
  filename: PropTypes.string,
  fetchBlob: PropTypes.func.isRequired,
  children: PropTypes.node,
  startIcon: PropTypes.node,
};
