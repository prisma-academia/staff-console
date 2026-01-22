import { useState } from 'react';

import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Fade,
  Stack,
  Button,
  Dialog,
  Collapse,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useErrorStore } from 'src/store/error-store';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function ErrorModal() {
  const theme = useTheme();
  const { isOpen, type, title, message, details, retry, onClose, hideError } = useErrorStore();
  const [showDetails, setShowDetails] = useState(false);

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    hideError();
    setShowDetails(false);
  };

  const handleRetry = () => {
    if (retry) {
      retry();
    }
    handleClose();
  };

  const isPermission = type === 'permission';
  const iconColor = isPermission ? theme.palette.warning.main : theme.palette.error.main;
  const bgColor = isPermission
    ? alpha(theme.palette.warning.main, 0.08)
    : alpha(theme.palette.error.main, 0.08);
  const borderColor = isPermission
    ? alpha(theme.palette.warning.main, 0.2)
    : alpha(theme.palette.error.main, 0.2);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      TransitionComponent={Fade}
      transitionDuration={300}
      PaperProps={{
        elevation: 8,
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 3,
          bgcolor: isPermission ? theme.palette.warning.main : theme.palette.error.main,
          color: 'white',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Iconify
              icon={isPermission ? 'eva:lock-fill' : 'eva:alert-circle-fill'}
              sx={{ width: 28, height: 28 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Stack>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            sx={{
              color: 'white',
              '&:hover': {
                bgcolor: alpha('#fff', 0.1),
              },
            }}
          >
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box
          sx={{
            p: 2.5,
            bgcolor: bgColor,
            borderRadius: 1.5,
            border: `1px solid ${borderColor}`,
            mb: details ? 2 : 0,
          }}
        >
          <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.7 }}>
            {message}
          </Typography>
        </Box>

        {details && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowDetails(!showDetails)}
              startIcon={
                <Iconify
                  icon={showDetails ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
                  sx={{ width: 20, height: 20 }}
                />
              }
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                '&:hover': {
                  bgcolor: 'transparent',
                  color: 'text.primary',
                },
              }}
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </Button>

            <Collapse in={showDetails}>
              <Box
                sx={{
                  mt: 1.5,
                  p: 2,
                  bgcolor: theme.palette.grey[50],
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    m: 0,
                  }}
                >
                  {typeof details === 'string' ? details : JSON.stringify(details, null, 2)}
                </Typography>
              </Box>
            </Collapse>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: theme.palette.grey[50] }}>
        <Stack direction="row" spacing={1.5} width="100%" justifyContent="flex-end">
          {retry && (
            <Button
              variant="outlined"
              onClick={handleRetry}
              sx={{
                borderRadius: 1.5,
                px: 3,
                borderColor: iconColor,
                color: iconColor,
                '&:hover': {
                  borderColor: iconColor,
                  bgcolor: alpha(iconColor, 0.08),
                },
              }}
            >
              Retry
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleClose}
            sx={{
              borderRadius: 1.5,
              px: 3,
              bgcolor: iconColor,
              boxShadow: `0 4px 12px ${alpha(iconColor, 0.24)}`,
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: iconColor,
                boxShadow: `0 6px 16px ${alpha(iconColor, 0.32)}`,
                transform: 'translateY(-1px)',
              },
            }}
          >
            Close
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

