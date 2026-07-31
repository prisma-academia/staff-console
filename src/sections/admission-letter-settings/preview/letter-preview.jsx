import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { useRef, useMemo, useState } from 'react';

import {
  Box,
  Chip,
  Stack,
  Alert,
  Button,
  Tooltip,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  Autocomplete,
  LinearProgress,
} from '@mui/material';

import { listAdmissions } from 'src/api/adminApplicationApi';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const ZOOM_STEPS = [0.5, 0.65, 0.8, 1];

// A4 at the CSS reference resolution, matching the template's `@page { size: A4 }`.
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

const admissionLabel = (admission) => {
  const app = admission?.application || {};
  const name = [app.firstName, app.otherName, app.lastName].filter(Boolean).join(' ');
  const reference = admission?.number || app.number;
  return [name || 'Unnamed applicant', reference].filter(Boolean).join(' — ');
};

// ----------------------------------------------------------------------

/**
 * The live A4 preview beside the editor.
 *
 * The HTML comes from the server's own letter pipeline — the same code that
 * produces the PDF — and is dropped into an `<iframe srcDoc>` rather than
 * inlined. That isolation is what the existing admission-letter-modal does too:
 * the letter carries `@page` print CSS and absolute sizing that must not leak
 * into the console's MUI styles or be overridden by them.
 */
export default function LetterPreview({ html, isPending, isError, error, admissionId, onAdmissionChange, onRefresh }) {
  const iframeRef = useRef(null);
  const [zoom, setZoom] = useState(0.65);

  const { data: admissionResult, isLoading: loadingAdmissions } = useQuery({
    queryKey: ['letter-preview-admissions'],
    queryFn: () => listAdmissions({ limit: 50 }),
    staleTime: 5 * 60 * 1000,
  });

  const admissions = useMemo(() => {
    const payload = admissionResult?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.docs)) return payload.docs;
    return [];
  }, [admissionResult]);

  const selected = admissions.find((admission) => admission._id === admissionId) || null;

  const handlePrint = () => {
    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.focus();
    frame.contentWindow.print();
  };

  return (
    <Stack sx={{ height: 1, minHeight: 0, bgcolor: 'background.neutral' }}>
      {/* ---- Preview controls ---- */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Autocomplete
          size="small"
          sx={{ flexGrow: 1, minWidth: 180 }}
          options={admissions}
          value={selected}
          loading={loadingAdmissions}
          getOptionLabel={admissionLabel}
          isOptionEqualToValue={(option, value) => option._id === value._id}
          onChange={(event, value) => onAdmissionChange(value?._id || null)}
          renderInput={(params) => (
            <TextField {...params} label="Preview with" placeholder="Sample applicant" />
          )}
          renderOption={(props, option) => (
            <MenuItem {...props} key={option._id}>
              <Typography variant="body2" noWrap>
                {admissionLabel(option)}
              </Typography>
            </MenuItem>
          )}
        />

        <TextField
          select
          size="small"
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          sx={{ width: 88, '& .MuiInputBase-root': { height: 40 } }}
        >
          {ZOOM_STEPS.map((step) => (
            <MenuItem key={step} value={step}>
              {`${Math.round(step * 100)}%`}
            </MenuItem>
          ))}
        </TextField>

        <Tooltip title="Refresh preview">
          <span>
            <IconButton onClick={onRefresh} disabled={isPending}>
              <Iconify icon="eva:refresh-fill" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Print this preview">
          <span>
            <IconButton onClick={handlePrint} disabled={!html || isPending}>
              <Iconify icon="eva:printer-fill" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* A 2px strip rather than blanking the pane: the previous letter stays
          readable while the next render is in flight. */}
      <Box sx={{ height: 2 }}>{isPending && <LinearProgress sx={{ height: 2 }} />}</Box>

      {!admissionId && (
        <Box sx={{ px: 1.5, pt: 1 }}>
          <Chip
            size="small"
            variant="outlined"
            color="info"
            icon={<Iconify icon="eva:info-outline" width={14} />}
            label="Sample data — pick an admission above to preview a real letter"
          />
        </Box>
      )}

      {isError && (
        <Box sx={{ p: 2 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={onRefresh}>
                Retry
              </Button>
            }
          >
            {error?.message || 'Could not render the preview.'}
          </Alert>
        </Box>
      )}

      {/* ---- The page ---- */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, display: 'flex', justifyContent: 'center' }}>
        {html ? (
          <Box
            sx={{
              // The iframe is laid out at true A4 and scaled down, so the letter
              // paginates exactly as it will in print regardless of zoom — a
              // CSS-width preview would reflow and lie about page breaks.
              width: A4_WIDTH_PX * zoom,
              height: A4_HEIGHT_PX * zoom,
              flexShrink: 0,
              alignSelf: 'flex-start',
            }}
          >
            <Box
              ref={iframeRef}
              component="iframe"
              title="Admission letter preview"
              srcDoc={html}
              sx={{
                width: A4_WIDTH_PX,
                height: A4_HEIGHT_PX,
                border: 0,
                bgcolor: 'common.white',
                boxShadow: (theme) => theme.customShadows?.z16 || '0 4px 24px rgba(0,0,0,.12)',
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
            />
          </Box>
        ) : (
          !isError && (
            <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 8 }}>
              <Iconify icon="eva:file-text-outline" width={40} sx={{ color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary">
                {isPending ? 'Rendering letter…' : 'The preview will appear here.'}
              </Typography>
            </Stack>
          )
        )}
      </Box>
    </Stack>
  );
}

LetterPreview.propTypes = {
  html: PropTypes.string,
  isPending: PropTypes.bool,
  isError: PropTypes.bool,
  error: PropTypes.object,
  admissionId: PropTypes.string,
  onAdmissionChange: PropTypes.func,
  onRefresh: PropTypes.func,
};
