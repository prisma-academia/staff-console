import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Box } from '@mui/system';
import {
  Card,
  Grid,
  alpha,
  useTheme,
  MenuItem,
  Container,
  TextField,
  Typography,
} from '@mui/material';

import { PERMISSIONS } from 'src/permissions/constants';
import { getAnalytics, listSessions } from 'src/api/adminApplicationApi';

import Can from 'src/components/permission/can';

export default function AppAnalyticsView() {
  const theme = useTheme();
  const [sessionId, setSessionId] = useState('');

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const result = await listSessions();
      if (!result.ok) throw new Error(result.message);
      return result.data ?? [];
    },
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-analytics', sessionId],
    queryFn: async () => {
      const result = await getAnalytics({ sessionId });
      if (!result.ok) throw new Error(result.message);
      return result.data;
    },
    enabled: Boolean(sessionId),
  });

  const isLoading = analyticsLoading && Boolean(sessionId);

  return (
    <Can do={PERMISSIONS.VIEW_ANALYTICS} fallback={null}>
      <Container maxWidth="xl">
        <Box sx={{ pb: 5, pt: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Application Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Session-scoped application and admission counts (application-api)
            </Typography>
          </Box>

          <Card
            sx={{
              p: 2.5,
              mb: 3,
              boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
              borderRadius: 2,
            }}
          >
            <TextField
              select
              label="Session"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              size="small"
              sx={{ minWidth: 280 }}
              disabled={sessionsLoading}
            >
              <MenuItem value="">Select a session</MenuItem>
              {(sessions || []).map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.name || s._id}
                </MenuItem>
              ))}
            </TextField>
          </Card>

          {!sessionId && (
            <Typography variant="body2" color="text.secondary">
              Select a session above to view analytics.
            </Typography>
          )}

          {sessionId && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    p: 2.5,
                    boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}`,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  }}
                >
                  <Typography variant="overline" color="text.secondary">
                    Applications (paid)
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 0.5 }}>
                    {isLoading ? '—' : (analytics?.applicationCount ?? '—')}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    p: 2.5,
                    boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}`,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.08),
                  }}
                >
                  <Typography variant="overline" color="text.secondary">
                    Admissions
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 0.5 }}>
                    {isLoading ? '—' : (analytics?.admissionCount ?? '—')}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    p: 2.5,
                    boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}`,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                  }}
                >
                  <Typography variant="overline" color="text.secondary">
                    Transactions
                  </Typography>
                  <Typography variant="h4" sx={{ mt: 0.5 }}>
                    {isLoading ? '—' : analytics?.transactions ?? 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Payment gateway does not expose totals
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Container>
    </Can>
  );
}

