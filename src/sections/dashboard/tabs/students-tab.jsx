import PropTypes from 'prop-types';

import Grid from '@mui/material/Grid';

import Panel from '../components/panel';
import { MiniStat } from '../components/kpi-card';
import { useStudents } from '../use-dashboard-data';
import { RankList, BarChart, DonutChart } from '../components/charts';
import { fPct, SERIES, fCount, fMonth, toSlices, fillMonths , ordinalSteps } from '../utils';

// ----------------------------------------------------------------------

const STATUS_LABELS = { active: 'Active', setup: 'Setup', pending: 'Pending', disable: 'Disabled' };

export default function StudentsTab({ session }) {
  const { data, isLoading } = useStudents(session);
  const s = data?.summary;

  const programmes = data?.byProgram || [];
  const levels = data?.byClassLevel || [];
  const ages = (data?.ageBands || []).filter((b) => b.band !== 'Unknown');
  const trend = fillMonths(data?.enrolmentTrend);
  const statusSlices = toSlices(
    Object.fromEntries(Object.entries(data?.status || {}).map(([k, v]) => [STATUS_LABELS[k] || k, v]))
  );
  const genderSlices = toSlices(data?.gender);

  return (
    <Grid container spacing={3}>
      {[
        { label: 'Enrolled students', value: fCount(s?.total), caption: `${fCount(s?.programCount)} programmes` },
        { label: 'Active', value: fCount(s?.active), caption: `${fPct(s?.total ? (s.active / s.total) * 100 : 0)} of enrolled` },
        { label: 'Awaiting activation', value: fCount(s?.awaitingActivation), caption: 'Setup or pending' },
        { label: 'New this session', value: session ? fCount(s?.newThisSession) : '—', caption: session ? 'By enrolment date' : 'Pick a session' },
        { label: 'Portal adoption', value: fPct(s?.portalAdoption), caption: 'Ever signed in' },
        { label: 'Signed in, 30 days', value: fCount(s?.activeLast30Days), caption: `${fCount(s?.activeLast7Days)} in the last 7 days` },
      ].map((stat) => (
        <Grid key={stat.label} item xs={6} sm={4} lg={2}>
          <MiniStat loading={isLoading} {...stat} />
        </Grid>
      ))}

      <Grid item xs={12} md={8}>
        <Panel rank={1} title="Enrolment by programme" subheader="Split by gender" loading={isLoading} empty={!programmes.length}>
          <BarChart
            horizontal
            stacked
            categories={programmes.map((p) => p.name)}
            series={[
              { name: 'Female', data: programmes.map((p) => p.female) },
              { name: 'Male', data: programmes.map((p) => p.male) },
            ]}
          />
        </Panel>
      </Grid>
      <Grid item xs={12} md={4}>
        <Panel rank={2} title="Account status" loading={isLoading} empty={!statusSlices.length}>
          <DonutChart slices={statusSlices} totalLabel="Students" />
        </Panel>
      </Grid>

      <Grid item xs={12} md={4}>
        <Panel rank={3} title="By class level" loading={isLoading} empty={!levels.length}>
          <BarChart
            categories={levels.map((l) => l.name)}
            series={[{ name: 'Students', data: levels.map((l) => l.count) }]}
            colors={ordinalSteps(levels.length)}
            distributed
            height={260}
          />
        </Panel>
      </Grid>
      <Grid item xs={12} md={4}>
        <Panel rank={4} title="Gender" loading={isLoading} empty={!genderSlices.length}>
          <DonutChart slices={genderSlices} totalLabel="Students" height={280} />
        </Panel>
      </Grid>
      <Grid item xs={12} md={4}>
        <Panel rank={5} title="Age bands" subheader="Age this year" loading={isLoading} empty={!ages.length}>
          <BarChart
            categories={ages.map((b) => b.band)}
            series={[{ name: 'Students', data: ages.map((b) => b.count) }]}
            colors={ordinalSteps(ages.length)}
            distributed
            height={260}
          />
        </Panel>
      </Grid>

      <Grid item xs={12} md={8}>
        <Panel rank={6} title="New enrolments by month" subheader="Last 24 months, by enrolment date" loading={isLoading} empty={!trend.length}>
          <BarChart
            categories={trend.map((t) => fMonth(t.month))}
            series={[{ name: 'Enrolled', data: trend.map((t) => t.count) }]}
            height={280}
          />
        </Panel>
      </Grid>
      <Grid item xs={12} md={4}>
        <Panel rank={7} title="State of residence" subheader="Top states" loading={isLoading} empty={!data?.byState?.length}>
          <RankList
            color={SERIES[2]}
            rows={(data?.byState || []).slice(0, 8).map((st) => ({
              key: st.state,
              label: st.state,
              value: st.count,
              caption: fPct(s?.total ? (st.count / s.total) * 100 : 0),
            }))}
          />
        </Panel>
      </Grid>

      {session && (
        <Grid item xs={12}>
          <Panel title="This session's intake by programme" loading={isLoading} empty={!data?.intakeByProgram?.length} emptyText="No students enrolled within this session's dates">
            <RankList rows={(data?.intakeByProgram || []).map((p) => ({ key: p.name, label: p.name, value: p.count }))} />
          </Panel>
        </Grid>
      )}
    </Grid>
  );
}

StudentsTab.propTypes = { session: PropTypes.string };
