import PropTypes from 'prop-types';

import { Close } from '@mui/icons-material';
import {
  Box,
  Card,
  Grid,
  Stack,
  Dialog,
  Button,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

export default function ViewModal({ open, onClose, data }) {
  if (!data) return null;

  const fullName = data.firstName || data.lastName 
    ? `${data.firstName || ''} ${data.lastName || ''}`.trim()
    : 'N/A';

  const status = data.status?.toLowerCase() === 'paid' ? 'paid' : 'not paid';

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Application Details
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Personal Information
          </Typography>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography variant="body2">
                    {fullName}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body2">
                    {data.email || 'N/A'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Phone Number
                  </Typography>
                  <Typography variant="body2">
                    {data.phoneNumber || 'N/A'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Admission Number
                  </Typography>
                  <Typography variant="body2">
                    {data.number || 'N/A'}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Card>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Location Information
          </Typography>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    State of Origin
                  </Typography>
                  <Typography variant="body2">
                    {data.stateOfOrigin || 'N/A'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    LGA of Origin
                  </Typography>
                  <Typography variant="body2">
                    {data.lgaOfOrigin || 'N/A'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Home Address
                  </Typography>
                  <Typography variant="body2">
                    {data.address || 'N/A'}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Card>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Application Information
          </Typography>
          <Card sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Programme
                  </Typography>
                  <Typography variant="body2">
                    {data.programme || 'N/A'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="body2" 
                    sx={{ 
                      color: status === 'paid' ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}
                  >
                    {status === 'paid' ? 'Paid' : 'Not Paid'}
                  </Typography>
                </Stack>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Application Date
                  </Typography>
                  <Typography variant="body2">
                    {data.createdAt 
                      ? new Date(data.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : 'N/A'
                    }
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button variant="contained" onClick={onClose}>
          {status === 'paid' ? 'Print Receipt' : 'Process Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ViewModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  data: PropTypes.object,
};
