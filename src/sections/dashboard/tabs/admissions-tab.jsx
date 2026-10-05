import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { listSessions } from 'src/api/adminApplicationApi';

import Scrollbar from 'src/components/scrollbar';

import Panel from '../components/panel';
import { MiniStat } from '../components/kpi-card';
import { useAdmissions } from '../use-dashboard-data';
import { Funnel, RankList, DonutChart, TrendChart } from '../components/charts';
import { fDay, fPct, SERIES, fCount, fNaira, fillDays, toSlices, fNairaShort, ordinalSteps } from '../utils';

// ----------------------------------------------------------------------

export default function AdmissionsTab() {
  // Admission sessions belong to application-api; '' = its active session.
  const [admissionSession, setAdmissionSession] = useState('');
  const { data: sessions = [] } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const result = await listSessions();
      if (!result.ok) throw new Error(result.message);
      return result.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
  const { data, isLoading, isError, error } = useAdmissions(admissionSession);
  const s = data?.summary;

  const trend = fillDays(data?.trend, 60, ['started', 'paid']);
  const programmes = data?.byProgramme || [];

  const sessionPicker = (
    <TextField
      select
      size="small"
      label="Admission session"
      value={admissionSession}
      onChange={(e) => setAdmissionSession(e.target.value)}
      InputLabelProps={{ shrink: true }}
      SelectProps={{ displayEmpty: true }}
      sx={{ minWidth: 220 }}
    >
      <MenuItem value="">Active session{data?.session && !admissionSession ? ` (${data.session.name})` : ''}</MenuItem>
      {sessions.map((sess) => (
        <MenuItem key={sess._id} value={sess._id}>
          {sess.name}
          {sess.status === 'active' ? ' (active)' : ''}
        </MenuItem>
      ))}
    </TextField>
  );

  if (isError) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>{sessionPicker}</Grid>
        <Grid item xs={12}>
          <Alert severity="warning">Admissions analytics could not be loaded: {error?.message}</Alert>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        {sessionPicker}
      </Grid>

      {[
        { label: 'Applications started', value: fCount(s?.started), caption: `${fCount(s?.unpaid)} unpaid` },
        { label: 'Paid applications', value: fCount(s?.paid), caption: `${fPct(s?.paymentConversion)} of started` },
        { label: 'Offers made', value: fCount(s?.offered), caption: `${fPct(s?.admissionRate)} of paid` },
        { label: 'Offers accepted', value: fCount(s?.accepted), caption: `${fPct(s?.acceptanceRate)} of offers` },
        { label: 'Application fees', value: fNairaShort(s?.applicationRevenue), caption: 'Paid applications' },
        {
          label: 'Acceptance fees',
          value: fNairaShort(s?.acceptanceRevenue),
          caption: s?.daysToClose != null ? closingCaption(s.daysToClose) : `${fCount(s?.acceptancePaid)} paid`,
        },
      ].map((stat) => (
        <Grid key={stat.label} item xs={6} sm={4} lg={2}>
          <MiniStat loading={isLoading} {...stat} />
        </Grid>
      ))}

      <Grid item xs={12} md={5}>
        <Panel rank={1} title="Applicant funnel" subheader="Each step as a share of the one before" loading={isLoading} empty={!data?.funnel?.[0]?.count} emptyText="No applications in this session">
          <Funnel stages={data?.funnel || []} colors={ordinalSteps(4).reverse()} />
        </Panel>
      </Grid>
      <Grid item xs={12} md={7}>
        <Panel rank={2} title="Daily applications" subheader="Started and paid, last 60 days (offers are issued in batches, see the funnel)" loading={isLoading}>
          <TrendChart
            type="line"
            categories={trend.map((d) => fDay(d.date))}
            series={[
              { name: 'Started', data: trend.map((d) => d.started) },
              { name: 'Paid', data: trend.map((d) => d.paid) },
            ]}
            height={280}
          />
        </Panel>
      </Grid>

      <Grid item xs={12}>
        <Panel rank={3} title="By programme" loading={isLoading} empty={!programmes.length}>
          <TableContainer sx={{ mx: -2.5, width: 'auto' }}>
            <Scrollbar>
              <Table size="small" sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: 2.5 }}>Programme</TableCell>
                    <TableCell align="right">Started</TableCell>
                    <TableCell align="right">Paid</TableCell>
                    <TableCell align="right">Offered</TableCell>
                    <TableCell align="right">Accepted</TableCell>
                    <TableCell align="right">Offer rate</TableCell>
                    <TableCell align="right" sx={{ pr: 2.5 }}>
                      Application fees
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {programmes.map((p) => (
                    <TableRow key={p.programmeId} hover>
                      <TableCell sx={{ pl: 2.5 }}>
                        <Typography variant="subtitle2">{p.name}</Typography>
                        {p.code && (
                          <Typography variant="caption" color="text.secondary">
                            {p.code}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{fCount(p.started)}</TableCell>
                      <TableCell align="right">{fCount(p.paid)}</TableCell>
                      <TableCell align="right">{fCount(p.offered)}</TableCell>
                      <TableCell align="right">{fCount(p.accepted)}</TableCell>
                      <TableCell align="right">{fPct(p.admissionRate)}</TableCell>
                      <TableCell align="right" sx={{ pr: 2.5 }}>
                        {fNaira(p.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>
        </Panel>
      </Grid>

      <Grid item xs={12} md={4}>
        <Panel rank={4} title="Applicants by gender" subheader="Paid applications" loading={isLoading} empty={!toSlices(data?.gender).length}>
          <DonutChart slices={toSlices(data?.gender)} totalLabel="Applicants" height={280} />
        </Panel>
      </Grid>
      <Grid item xs={12} md={4}>
        <Panel rank={5} title="State of origin" subheader="Top states, paid applications" loading={isLoading} empty={!data?.byState?.length}>
          <RankList
            color={SERIES[2]}
            rows={(data?.byState || []).slice(0, 8).map((st) => ({
              key: st.state,
              label: st.state,
              value: st.count,
              caption: fPct(s?.paid ? (st.count / s.paid) * 100 : 0),
            }))}
          />
        </Panel>
      </Grid>
      <Grid item xs={12} md={4}>
        <Panel rank={6} title="Religion" subheader="Paid applications" loading={isLoading} empty={!toSlices(data?.religion).length}>
          <DonutChart slices={toSlices(data?.religion)} totalLabel="Applicants" height={280} />
        </Panel>
      </Grid>
    </Grid>
  );
}

function closingCaption(days) {
  if (days < 0) return 'Applications closed';
  if (days === 0) return 'Applications close today';
  return `Applications close in ${days} day${days === 1 ? '' : 's'}`;
}
