import PropTypes from 'prop-types';
import Cropper from 'react-easy-crop';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ButtonBase from '@mui/material/ButtonBase';
import DialogTitle from '@mui/material/DialogTitle';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogContent from '@mui/material/DialogContent';

import Iconify from 'src/components/iconify';

import { PHOTO_SIZE, dataUrlBytes, getCroppedImage, captureVideoFrame } from './crop-image';

// ----------------------------------------------------------------------

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const hasCamera = () => Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

const TITLES = {
  choose: 'Add passport photo',
  camera: 'Take a photo',
  crop: 'Crop photo',
  confirm: 'Confirm photo',
};

/**
 * Passport photo picker for the staff console: file or webcam, square crop, confirm.
 * Mirrors application-site's PhotoCapture; onConfirm receives a PHOTO_SIZE px JPEG data URL.
 */
export default function PhotoCaptureDialog({ open, onClose, onConfirm }) {
  const [stage, setStage] = useState('choose');
  const [source, setSource] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [cropArea, setCropArea] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const fileInput = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const replaceSource = useCallback((next) => {
    setSource((previous) => {
      if (previous && previous.startsWith('blob:')) URL.revokeObjectURL(previous);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    stopCamera();
    replaceSource(null);
    setStage('choose');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCropArea(null);
    setResult(null);
    setError('');
    setBusy(false);
  }, [stopCamera, replaceSource]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => stopCamera, [stopCamera]);

  const startCrop = (src) => {
    replaceSource(src);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setStage('crop');
  };

  const handleFile = (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a JPEG, PNG or WebP image.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('That image is larger than 10 MB.');
      return;
    }
    setError('');
    startCrop(URL.createObjectURL(file));
  };

  const openCamera = async () => {
    setError('');
    if (!hasCamera()) {
      setError('This browser cannot access a camera. Upload a photo instead.');
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      setStage('camera');
    } catch (err) {
      setError('Camera unavailable or permission denied. Upload a photo instead.');
    }
  };

  // Attach the stream once the camera stage's <video> has mounted.
  useEffect(() => {
    if (stage === 'camera' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [stage]);

  const takePicture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const frame = captureVideoFrame(video);
    stopCamera();
    startCrop(frame);
  };

  const applyCrop = async () => {
    if (!cropArea) return;
    setBusy(true);
    try {
      setResult(await getCroppedImage(source, cropArea, rotation));
      setStage('confirm');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const confirm = () => {
    onConfirm(result);
    onClose();
  };

  const choice = (icon, label, onClick) => (
    <ButtonBase
      onClick={onClick}
      sx={{
        flex: 1,
        p: 3,
        gap: 1,
        borderRadius: 2,
        flexDirection: 'column',
        border: (theme) => `2px dashed ${theme.palette.divider}`,
        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
      }}
    >
      <Iconify icon={icon} width={36} sx={{ color: 'primary.main' }} />
      <Typography variant="subtitle2">{label}</Typography>
    </ButtonBase>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {TITLES[stage]}
        <IconButton onClick={onClose} aria-label="Close">
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {stage === 'choose' && (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {choice('eva:image-outline', 'Upload from computer', () => fileInput.current.click())}
              {choice('eva:camera-outline', 'Use webcam', openCamera)}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Recent passport photo on a plain background. JPEG, PNG or WebP up to 10 MB; you will
              crop it next.
            </Typography>
          </Stack>
        )}

        {stage === 'camera' && (
          <Stack spacing={2}>
            <Box sx={{ position: 'relative', bgcolor: 'common.black', borderRadius: 2, overflow: 'hidden', aspectRatio: '1 / 1' }}>
              <Box
                component="video"
                ref={videoRef}
                playsInline
                muted
                sx={{ width: 1, height: 1, objectFit: 'cover', transform: 'scaleX(-1)' }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 32,
                  borderRadius: '50%',
                  pointerEvents: 'none',
                  border: '2px solid rgba(255,255,255,0.7)',
                }}
              />
            </Box>
            <Stack direction="row" justifyContent="space-between">
              <Button
                onClick={() => {
                  stopCamera();
                  setStage('choose');
                }}
              >
                Back
              </Button>
              <Button variant="contained" startIcon={<Iconify icon="eva:camera-fill" />} onClick={takePicture}>
                Capture
              </Button>
            </Stack>
          </Stack>
        )}

        {stage === 'crop' && source && (
          <Stack spacing={2}>
            <Box sx={{ position: 'relative', height: 320, bgcolor: 'grey.900', borderRadius: 2, overflow: 'hidden' }}>
              <Cropper
                image={source}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={(_, areaPixels) => setCropArea(areaPixels)}
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Zoom
              </Typography>
              <Slider size="small" min={1} max={3} step={0.05} value={zoom} onChange={(_, v) => setZoom(v)} />
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Rotate
                </Typography>
                <Slider size="small" min={-180} max={180} step={1} value={rotation} onChange={(_, v) => setRotation(v)} />
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Iconify icon="eva:refresh-fill" />}
                onClick={() => setRotation((r) => (r + 90 > 180 ? r - 270 : r + 90))}
              >
                90°
              </Button>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Button onClick={reset}>Start over</Button>
              <LoadingButton variant="contained" loading={busy} disabled={!cropArea} onClick={applyCrop}>
                Next
              </LoadingButton>
            </Stack>
          </Stack>
        )}

        {stage === 'confirm' && result && (
          <Stack spacing={2} alignItems="center">
            <Box
              component="img"
              src={result}
              alt="Cropped passport"
              sx={{ width: 200, height: 200, borderRadius: 2, objectFit: 'cover', boxShadow: 2 }}
            />
            <Typography variant="caption" color="text.secondary">
              {PHOTO_SIZE} × {PHOTO_SIZE} px · {Math.round(dataUrlBytes(result) / 1024)} KB
            </Typography>
            <Stack direction="row" justifyContent="space-between" sx={{ width: 1 }}>
              <Stack direction="row" spacing={1}>
                <Button onClick={() => setStage('crop')}>Re-crop</Button>
                <Button onClick={reset}>Retake</Button>
              </Stack>
              <Button variant="contained" onClick={confirm}>
                Use this photo
              </Button>
            </Stack>
          </Stack>
        )}

        <input ref={fileInput} type="file" accept={ACCEPTED_TYPES.join(',')} onChange={handleFile} hidden />
      </DialogContent>
    </Dialog>
  );
}

PhotoCaptureDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
};
