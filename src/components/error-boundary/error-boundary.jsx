import React from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Button, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { fallback, children } = this.props;
    const { hasError, error } = this.state;

    if (hasError) {

      if (fallback) {
        return fallback;
      }

      // Check if it's a permission error (403)
      const isPermissionError = error?.status === 403 || 
                                error?.message?.toLowerCase().includes('permission');

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Stack spacing={3} alignItems="center" sx={{ maxWidth: 500, textAlign: 'center' }}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                bgcolor: isPermissionError ? 'warning.lighter' : 'error.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify
                icon={isPermissionError ? 'eva:lock-fill' : 'eva:alert-circle-fill'}
                sx={{
                  width: 64,
                  height: 64,
                  color: isPermissionError ? 'warning.main' : 'error.main',
                }}
              />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {isPermissionError ? 'Access Denied' : 'Something went wrong'}
            </Typography>

            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {error?.message || 
               (isPermissionError 
                 ? 'You do not have permission to access this resource.' 
                 : 'An unexpected error occurred. Please try again.')}
            </Typography>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                startIcon={<Iconify icon="eva:refresh-fill" />}
              >
                Reload Page
              </Button>
              <Button
                variant="contained"
                onClick={this.handleReset}
                startIcon={<Iconify icon="eva:arrow-back-fill" />}
              >
                Try Again
              </Button>
            </Stack>
          </Stack>
        </Box>
      );
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
};

export default ErrorBoundary;

