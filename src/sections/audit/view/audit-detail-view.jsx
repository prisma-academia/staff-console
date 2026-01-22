import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';

import { AuditApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import BeforeAfterComparison from '../before-after-comparison';
import { formatActor, formatEntityId, isFailedOperation } from '../utils';

// ----------------------------------------------------------------------

export default function AuditDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['audit-log', id],
    queryFn: () => AuditApi.getAuditLogById(id),
  });

  // Handle response structure - API may return { ok: true, data: {...} } or just the data
  const auditLog = response?.data || response;

  const { mutate: deleteAuditLog } = useMutation({
    mutationFn: () => AuditApi.deleteAuditLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      enqueueSnackbar('Audit log deleted successfully', { variant: 'success' });
      navigate('/audit');
    },
    onError: (deleteError) => {
      enqueueSnackbar(deleteError.message || 'Delete failed', { variant: 'error' });
    }
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this audit log?')) {
      deleteAuditLog();
    }
  };

  const handleViewActorHistory = () => {
    if (auditLog?.actor) {
      const actorId = typeof auditLog.actor === 'object' ? auditLog.actor._id : auditLog.actor;
      navigate(`/audit?actor=${actorId}`);
    }
  };

  const getActionTypeColor = (type) => {
    switch (type) {
      case 'create':
        return 'success';
      case 'update':
        return 'info';
      case 'delete':
        return 'error';
      case 'view':
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography>Loading audit log details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !auditLog) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Audit log not found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {error?.message || 'The requested audit log could not be found. It may have been deleted or the ID is invalid.'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/audit')} sx={{ mt: 2 }}>
            Back to Audit Logs
          </Button>
        </Box>
      </Container>
    );
  }

  const isFailed = isFailedOperation(auditLog.entityId);

  const formattedDate = auditLog.timestamp
    ? format(new Date(auditLog.timestamp), 'PPpp')
    : 'N/A';

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link to="/audit" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
            >
              Audit Logs
            </Typography>
          </Link>
          <Typography color="text.primary">Audit Log Details</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Audit Log Details
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              View detailed information about this audit log entry
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
              onClick={() => navigate('/audit')}
            >
              Back
            </Button>

            {auditLog.actor && (
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:person-fill" />}
                onClick={handleViewActorHistory}
              >
                View Actor History
              </Button>
            )}

            <Can do="delete_audit">
              <Button
                variant="outlined"
                color="error"
                startIcon={<Iconify icon="eva:trash-2-outline" />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </Can>
          </Stack>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {isFailed && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Failed Operation Detected
            </Typography>
            <Typography variant="body2">
              This audit log represents a failed operation. No entity was created, so the entity ID is a placeholder.
              {auditLog.metadata?.error && (
                <> Error: {auditLog.metadata.error}</>
              )}
            </Typography>
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Basic Information Card */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 3, mt: 1 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Audit Log ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {auditLog._id}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Timestamp
                </Typography>
                <Typography variant="body1">{formattedDate}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Label color={auditLog.status === 'success' ? 'success' : 'error'}>
                  {auditLog.status}
                </Label>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Action Type
                </Typography>
                <Label color={getActionTypeColor(auditLog.actionType)}>
                  {auditLog.actionType}
                </Label>
              </Grid>
            </Grid>
          </Card>

          {/* Entity Information Card */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Entity Information
            </Typography>
            <Divider sx={{ mb: 3, mt: 1 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Entity Type
                </Typography>
                <Typography variant="body1">{auditLog.entityType}</Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Entity ID
                </Typography>
                {isFailed ? (
                  <Alert severity="warning" sx={{ py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {formatEntityId(auditLog.entityId)}
                    </Typography>
                  </Alert>
                ) : (
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {formatEntityId(auditLog.entityId)}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Card>

          {/* Actor Information Card */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actor Information
            </Typography>
            <Divider sx={{ mb: 3, mt: 1 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Actor Type
                </Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {auditLog.actorType}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Actor
                </Typography>
                <Typography variant="body1">{formatActor(auditLog.actor)}</Typography>
                {typeof auditLog.actor === 'object' && auditLog.actor?.email && (
                  <Typography variant="body2" color="text.secondary">
                    {auditLog.actor.email}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Card>

          {/* Before/After Comparison Card */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Changes
            </Typography>
            <Divider sx={{ mb: 3, mt: 1 }} />
            <BeforeAfterComparison before={auditLog.before} after={auditLog.after} />
          </Card>

          {/* Metadata Card */}
          {auditLog.metadata && Object.keys(auditLog.metadata).length > 0 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Metadata
              </Typography>
              <Divider sx={{ mb: 3, mt: 1 }} />
              <Box
                component="pre"
                sx={{
                  p: 2,
                  bgcolor: 'background.neutral',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  overflow: 'auto',
                }}
              >
                {JSON.stringify(auditLog.metadata, null, 2)}
              </Box>
            </Card>
          )}
        </Stack>
      </Box>
    </Container>
  );
}
