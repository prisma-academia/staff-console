import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fData } from 'src/utils/format-number';

import Label from 'src/components/label';

import Panel from '../components/panel';
import { MiniStat } from '../components/kpi-card';
import { useOperations } from '../use-dashboard-data';
import { RankList, DonutChart, TrendChart } from '../components/charts';
import { fDay, SERIES, fCount, fillDays, toSlices, fDateTime } from '../utils';

// ----------------------------------------------------------------------

const ACTION_WORDS = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
  view: 'viewed',
  bulk_create: 'bulk-created',
  bulk_update: 'bulk-updated',
  bulk_delete: 'bulk-deleted',
  approve: 'approved',
  publish: 'published',
  reopen: 'reopened',
  regrade: 'regraded',
};

export default function OperationsTab() {
  const { data, isLoading } = useOperations();
  const s = data?.summary;
  const daily = fillDays(data?.activity?.daily, 30, ['count', 'failures']);
  const modules = Object.entries(data?.activity?.byEntity || {}).sort((a, b) => b[1] - a[1]);
  const roleSlices = toSlices(data?.staff?.roles);

  return (
    <Grid container spacing={3}>
      {[
        { label: 'Staff accounts', value: fCount(s?.staff), caption: `${fCount(s?.activeStaff)} active · ${fCount(s?.pendingStaff)} pending` },
        { label: 'Signed in, 7 days', value: fCount(s?.staffActiveLast7Days), caption: `${fCount(s?.staffActiveLast30Days)} in 30 days` },
        { label: 'Actions, 30 days', value: fCount(s?.actionsLast30Days), caption: 'From the audit log' },
        { label: 'Failed actions', value: fCount(s?.failedActionsLast30Days), caption: 'Last 30 days' },
        { label: 'Documents', value: fCount(s?.documents), caption: s?.documentBytes ? fData(s.documentBytes) : 'No files' },
        { label: 'Memos', value: fCount(s?.memos), caption: `${fCount(s?.upcomingEvents)} upcoming events` },
      ].map((stat) => (
        <Grid key={stat.label} item xs={6} sm={4} lg={2}>
          <MiniStat loading={isLoading} {...stat} />
        </Grid>
      ))}

      <Grid item xs={12} md={8}>
        <Panel rank={1} title="System activity" subheader="Recorded actions per day, last 30 days" loading={isLoading}>
          <TrendChart
            categories={daily.map((d) => fDay(d.date))}
            series={[
              { name: 'Actions', data: daily.map((d) => d.count) },
              { name: 'Failed', data: daily.map((d) => d.failures) },
            ]}
            colors={[SERIES[0], SERIES[7]]}
            height={300}
          />
        </Panel>
      </Grid>
      <Grid item xs={12} md={4}>
        <Panel rank={2} title="Activity by module" subheader="Last 30 days" loading={isLoading} empty={!modules.length}>
          <RankList rows={modules.slice(0, 8).map(([label, value]) => ({ key: label, label, value }))} />
        </Panel>
      </Grid>

      <Grid item xs={12} md={4}>
        <Panel rank={3} title="Most active staff" subheader="Last 30 days" loading={isLoading} empty={!data?.activity?.topActors?.length}>
          <RankList
            color={SERIES[2]}
            rows={(data?.activity?.topActors || []).map((a) => ({
              key: String(a.actorId),
              label: a.name,
              value: a.count,
              caption: a.role,
            }))}
          />
        </Panel>
      </Grid>
      <Grid item xs={12} md={4}>
        <Panel rank={4} title="Staff by role" loading={isLoading} empty={!roleSlices.length}>
          <DonutChart slices={roleSlices} totalLabel="Staff" height={280} />
        </Panel>
      </Grid>
      <Grid item xs={12} md={4}>
        <Panel rank={5} title="Staff by department" loading={isLoading} empty={!data?.staff?.departments?.length}>
          <RankList color={SERIES[1]} rows={(data?.staff?.departments || []).map((d) => ({ key: d.name, label: d.name, value: d.count }))} />
        </Panel>
      </Grid>

      <Grid item xs={12} md={7}>
        <Panel title="Recent activity" loading={isLoading} empty={!data?.activity?.recent?.length}>
          <Stack divider={<Box sx={{ borderTop: (t) => `1px solid ${t.palette.divider}` }} />}>
            {(data?.activity?.recent || []).map((a) => (
              <Stack key={a._id} direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    <strong>{a.actor}</strong> {ACTION_WORDS[a.actionType] || a.actionType} a {a.entityType.toLowerCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fDateTime(a.timestamp)}
                  </Typography>
                </Box>
                {a.status === 'failure' && (
                  <Label color="error" variant="soft">
                    Failed
                  </Label>
                )}
              </Stack>
            ))}
          </Stack>
        </Panel>
      </Grid>
      <Grid item xs={12} md={5}>
        <Panel title="Upcoming events" subheader="From the calendar" loading={isLoading} empty={!data?.communication?.upcomingEvents?.length} emptyText="No upcoming events">
          <Stack spacing={1.5}>
            {(data?.communication?.upcomingEvents || []).map((e) => (
              <Box key={e._id} sx={{ pl: 1.5, borderLeft: (t) => `3px solid ${t.palette.primary.main}` }}>
                <Typography variant="subtitle2">{e.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {fDateTime(e.start)}
                  {e.location ? ` · ${e.location}` : ''}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Panel>
      </Grid>
    </Grid>
  );
}
