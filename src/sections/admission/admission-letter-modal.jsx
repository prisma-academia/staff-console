import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
  Alert,
  Stack,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import { getAdmissionLetterPdf, getAdmissionLetterPreview } from 'src/api/adminApplicationApi';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

/**
 * Previews and downloads the admission letter for a single admission.
 *
 * The preview is the server-rendered letter HTML shown in an <iframe srcDoc>
 * rather than dangerouslySetInnerHTML: the letter carries its own print CSS
 * (@page rules, absolute sizing) which must not leak into — or be overridden
 * by — the console's MUI styles.
 */
export default function AdmissionLetterModal({ open, onClose, admission }) {
  const iframeRef = useRef(null);
  const { enqueueSnackbar } = useSnackbar();
  const [downloading, setDownloading] = useState(false);

  const id = admission?._id;

  const applicantName =
    [admission?.application?.firstName, admission?.application?.otherName, admission?.application?.lastName]
      .filter(Boolean)
      .join(' ') || 'Applicant';

  const {
    data: html,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admission-letter-preview', id],
    queryFn: () => getAdmissionLetterPreview(id),
    enabled: Boolean(open && id),
  });

  const handleDownload = async () => {
    if (!id || downloading) return;
    setDownloading(true);
    try {
      const { blob, filename } = await getAdmissionLetterPdf(id);
      const url = window.URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (w) w.focus();
      else {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'admission-letter.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(url);
    } catch (err) {
      enqueueSnackbar(err?.message || 'Failed to download the admission letter', { variant: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const frame = iframeRef.current;
    if (!frame?.contentWindow) return;
    frame.contentWindow.focus();
    frame.contentWindow.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6">Admission Letter</Typography>
        <Typography variant="body2" color="text.secondary">
          {applicantName}
          {admission?.number ? ` — ${admission.number}` : ''}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, bgcolor: 'grey.200' }}>
        {isLoading && (
          <Stack alignItems="center" justifyContent="center" sx={{ height: 480 }} spacing={2}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Rendering letter…
            </Typography>
          </Stack>
        )}

        {isError && (
          <Box sx={{ p: 3 }}>
            <Alert severity="error">
              {error?.message || 'Could not render the admission letter.'}
            </Alert>
          </Box>
        )}

        {!isLoading && !isError && (
          <Box
            ref={iframeRef}
            component="iframe"
            title="Admission letter preview"
            srcDoc={html}
            sx={{ display: 'block', width: '100%', height: 640, border: 0, bgcolor: 'common.white' }}
          />
        )}
      </DialogContent>

      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="eva:printer-fill" />}
          onClick={handlePrint}
          disabled={isLoading || isError}
        >
          Print
        </Button>
        <Button
          variant="contained"
          startIcon={
            downloading ? <CircularProgress size={16} color="inherit" /> : <Iconify icon="eva:download-fill" />
          }
          onClick={handleDownload}
          disabled={downloading || !id}
        >
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AdmissionLetterModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  admission: PropTypes.object,
};
