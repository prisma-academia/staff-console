import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

import Label from 'src/components/label';
import Scrollbar from 'src/components/scrollbar';

import Panel from '../components/panel';
import { MiniStat } from '../components/kpi-card';
import { useFinance } from '../use-dashboard-data';
import { RankList, BarChart, DonutChart } from '../components/charts';
import { fDay, fPct, fDate, SERIES, fCount, fNaira, fillDays, toSlices, fDateTime, fillMonths, fNairaShort , fMonthToDate } from '../utils';

// ----------------------------------------------------------------------

// Payment status is a health signal, so it takes status colours, not series colours.
const STATUS_COLORS = { Completed: '#00A76F', Pending: '#FFAB00', Failed: '#FF5630', Abandoned: '#919EAB', Overdue: '#B71D18' };

export default function FinanceTab({ session }) {
  const { data, isLoading } = useFinance(session);
  const s = data?.summary;

  const monthly = fillMonths(data?.monthly, ['amount', 'count'], 12);
  const daily = fillDays(data?.daily, 30, ['amount', 'count']);
  const statusSlices = Object.entries(data?.status || {})
    .map(([label, v]) => ({ label, value: v.count }))
    .sort((a, b) => b.value - a.value);
  const feeTypeSlices = toSlices(Object.fromEntries((data?.byFeeType || []).map((t) => [t.feeType, t.amount])));
  const programmes = data?.byProgram || [];

  return (
    <Grid container spacing={3}>
      {[
        { label: 'Billed (expected)', value: fNairaShort(s?.expected), caption: `${fCount(s?.feeCount)} fees` },
        { label: 'Collected', value: fNairaShort(s?.collected), caption: `${fPct(s?.collectionRate)} of billed` },
        { label: 'Outstanding', value: fNairaShort(s?.outstanding), caption: `${fNairaShort(s?.overdueOutstanding)} overdue` },
        { label: 'Gross revenue', value: fNairaShort(s?.revenue), caption: `${fCount(s?.completedPayments)} payments` },
        { label: 'Last 30 days', value: fNairaShort(s?.revenueLast30Days), caption: 'Completed payments' },
        { label: 'Average payment', value: fNairaShort(s?.averagePayment), caption: `Checkout success ${fPct(s?.paymentSuccessRate)}` },
      ].map((stat) => (
        <Grid key={stat.label} item xs={6} sm={4} lg={2}>
          <MiniStat loading={isLoading} {...stat} />
        </Grid>
      ))}

      <Grid item xs={12} md={8}>
        <Panel rank={1} title="Revenue by month" subheader="Completed payments" loading={isLoading} empty={!monthly.length}>
          <BarChart
            categories={monthly.map((m) => fMonthToDate(m.month))}
            series={[{ name: 'Collected', data: monthly.map((m) => m.amount) }]}
            valueFormat={fNairaShort}
            height={300}
          />
        </Panel>
      </Grid>
      <Grid item xs={12} md={4}>
        <Panel rank={2} title="Revenue by fee type" loading={isLoading} empty={!feeTypeSlices.length}>
          <DonutChart slices={feeTypeSlices} valueFormat={fNairaShort} totalLabel="Collected" />
        </Panel>
      </Grid>

      <Grid item xs={12}>
        <Panel
          rank={3}
          title="Collection by fee"
          subheader="Expected is the fee amount times the students it applies to; each student counts once"
          loading={isLoading}
          empty={!data?.fees?.length}
          emptyText="No fees set up for this session"
        >
          <FeeTable fees={data?.fees || []} />
        </Panel>
      </Grid>

      <Grid item xs={12} md={8}>
        <Panel rank={4} title="Daily collections" subheader="Last 30 days" loading={isLoading}>
          <BarChart
            categories={daily.map((d) => fDay(d.date))}
            series={[{ name: 'Collected', data: daily.map((d) => d.amount) }]}
            valueFormat={fNairaShort}
            height={280}
          />
        </Panel>
      </Grid>
      <Grid item xs={12} md={4}>
        <Panel rank={5} title="Payment status" subheader="All payment attempts" loading={isLoading} empty={!statusSlices.length}>
          <DonutChart slices={statusSlices} colors={statusSlices.map((sl) => STATUS_COLORS[sl.label] || '#919EAB')} totalLabel="Attempts" />
        </Panel>
      </Grid>

      <Grid item xs={12} md={6}>
        <Panel rank={6} title="Revenue by programme" loading={isLoading} empty={!programmes.length}>
          <RankList
            rows={programmes.map((p) => ({
              key: String(p.programId),
              label: p.name,
              value: p.amount,
              display: fNaira(p.amount),
              caption: `${fCount(p.count)} payments`,
            }))}
          />
        </Panel>
      </Grid>
      <Grid item xs={12} md={6}>
        <Panel rank={7} title="Payment gateways" subheader="Collected amount and checkout success" loading={isLoading} empty={!data?.byGateway?.some((g) => g.completed > 0)}>
          <RankList
            color={SERIES[2]}
            rows={(data?.byGateway || [])
              .filter((g) => g.completed > 0)
              .map((g) => ({
              key: g.gateway,
              label: g.gateway,
              value: g.amount,
              display: fNaira(g.amount),
              caption: `${fPct(g.successRate)} success`,
            }))}
          />
        </Panel>
      </Grid>

      <Grid item xs={12}>
        <Panel title="Latest payments" loading={isLoading} empty={!data?.recent?.length}>
          <Stack divider={<Box sx={{ borderTop: (t) => `1px solid ${t.palette.divider}` }} />}>
            {(data?.recent || []).map((p) => (
              <Stack key={p._id} direction="row" alignItems="center" spacing={2} sx={{ py: 1.25 }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {p.student?.name || 'Unknown student'}{' '}
                    <Typography component="span" variant="caption" color="text.secondary">
                      {p.student?.regNumber}
                    </Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap component="div">
                    {p.fee?.name} · {fDateTime(p.createdAt)}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fNaira(p.amount)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Panel>
      </Grid>
    </Grid>
  );
}

FinanceTab.propTypes = { session: PropTypes.string };

function FeeTable({ fees }) {
  return (
    <TableContainer sx={{ mx: -2.5, width: 'auto' }}>
      <Scrollbar>
        <Table size="small" sx={{ minWidth: 880 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 2.5 }}>Fee</TableCell>
              <TableCell>Due</TableCell>
              <TableCell align="right">Students</TableCell>
              <TableCell align="right">Paid</TableCell>
              <TableCell align="right">Expected</TableCell>
              <TableCell align="right">Collected</TableCell>
              <TableCell align="right">Outstanding</TableCell>
              <TableCell sx={{ width: 180, pr: 2.5 }}>Progress</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fees.map((fee) => (
              <TableRow key={fee._id} hover>
                <TableCell sx={{ pl: 2.5 }}>
                  <Typography variant="subtitle2" noWrap>
                    {fee.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fee.feeType}
                    {fee.semester ? ` · ${fee.semester}` : ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5} alignItems="flex-start">
                    <Typography variant="body2" noWrap>
                      {fDate(fee.dueDate)}
                    </Typography>
                    {fee.isOverdue && (
                      <Label color="error" variant="soft">
                        Overdue
                      </Label>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="right">{fCount(fee.studentCount)}</TableCell>
                <TableCell align="right">{fCount(fee.paidStudents)}</TableCell>
                <TableCell align="right">{fNaira(fee.expected)}</TableCell>
                <TableCell align="right">{fNaira(fee.collected)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {fNaira(fee.outstanding)}
                </TableCell>
                <TableCell sx={{ pr: 2.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(fee.progress, 100)}
                      color={fee.isOverdue ? 'error' : 'primary'}
                      sx={{ flexGrow: 1, height: 6, borderRadius: 1 }}
                    />
                    <Typography variant="caption" sx={{ width: 44, textAlign: 'right' }}>
                      {fPct(fee.progress)}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Scrollbar>
    </TableContainer>
  );
}

FeeTable.propTypes = { fees: PropTypes.array };
