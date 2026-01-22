import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { AuditApi } from 'src/api';

import Iconify from 'src/components/iconify';

import AuditStatsCard from '../audit-stats-card';

// ----------------------------------------------------------------------

export function AuditStatsView({ entityType, startDate, endDate }) {
  const params = {};
  if (entityType) params.entityType = entityType;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['audit-stats', params],
    queryFn: () => AuditApi.getStats(params),
  });

  // Handle response structure - API may return { ok: true, data: {...} } or just the data
  const stats = response?.data || response;

  if (isLoading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading statistics...</Typography>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No statistics available</Typography>
      </Box>
    );
  }

  const {
    total = 0,
    byActionType = {},
    byStatus = {},
    byEntityType = {},
    recentActivity24h = 0,
  } = stats;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Audit Statistics</Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Iconify icon="eva:refresh-fill" />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <AuditStatsCard
            title="Total Audit Logs"
            value={total}
            icon="eva:file-text-fill"
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <AuditStatsCard
            title="Recent Activity (24h)"
            value={recentActivity24h}
            icon="eva:clock-fill"
            color="info"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <AuditStatsCard
            title="Success"
            value={byStatus.success || 0}
            icon="eva:checkmark-circle-2-fill"
            color="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <AuditStatsCard
            title="Failures"
            value={byStatus.failure || 0}
            icon="eva:close-circle-fill"
            color="error"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <AuditStatsCard
            title="Created"
            value={byActionType.create || 0}
            icon="eva:plus-circle-fill"
            color="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <AuditStatsCard
            title="Updated"
            value={byActionType.update || 0}
            icon="eva:edit-fill"
            color="info"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <AuditStatsCard
            title="Deleted"
            value={byActionType.delete || 0}
            icon="eva:trash-2-fill"
            color="error"
          />
        </Grid>
      </Grid>

      {Object.keys(byEntityType).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            By Entity Type
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {Object.entries(byEntityType).map(([entityTypeName, count]) => (
              <Grid item xs={12} sm={6} md={3} key={entityTypeName}>
                <AuditStatsCard
                  title={entityTypeName}
                  value={count}
                  icon="eva:layers-fill"
                  color="secondary"
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

AuditStatsView.propTypes = {
  entityType: PropTypes.string,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
};
