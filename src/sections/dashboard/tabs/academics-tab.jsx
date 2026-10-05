import PropTypes from 'prop-types';

import Grid from '@mui/material/Grid';

import { MiniStat } from '../components/kpi-card';
import { useAcademics } from '../use-dashboard-data';
import Panel, { EmptyState } from '../components/panel';
import { fPct, SERIES, fCount, ordinalSteps } from '../utils';
import { Funnel, RankList, BarChart } from '../components/charts';

// ----------------------------------------------------------------------

export default function AcademicsTab({ session }) {
  const { data, isLoading } = useAcademics(session);
  const s = data?.summary;
  const hasResults = Boolean(s?.results);

  const programmes = data?.byProgram || [];
  const grades = data?.grades || [];
  const gpaBands = data?.gpaBands || [];

  return (
    <Grid container spacing={3}>
      {[
        { label: 'Results recorded', value: fCount(s?.results), caption: `${fCount(s?.studentsWithResults)} students` },
        { label: 'Pass rate', value: hasResults ? fPct(s?.passRate) : '—', caption: `${fCount(s?.failed)} failed` },
        { label: 'Average score', value: hasResults ? s?.averageScore : '—', caption: 'Out of 100' },
        { label: 'Average GPA', value: hasResults ? s?.averageGpa?.toFixed(2) : '—', caption: 'Credit-weighted' },
        { label: 'Carry-overs', value: fCount(s?.carryOvers), caption: `${fCount(s?.retakes)} retakes` },
        { label: 'Awaiting publication', value: fCount((s?.draft || 0) + (s?.approved || 0)), caption: `${fCount(s?.draft)} draft · ${fCount(s?.approved)} approved` },
      ].map((stat) => (
        <Grid key={stat.label} item xs={6} sm={4} lg={2}>
          <MiniStat loading={isLoading} {...stat} />
        </Grid>
      ))}

      {!isLoading && !hasResults && (
        <Grid item xs={12}>
          <Panel title="No results for this session yet">
            <EmptyState
              height={120}
              text="Performance charts appear once course results are computed. The curriculum readiness below shows what is set up so far."
            />
          </Panel>
        </Grid>
      )}

      {hasResults && (
        <>
          <Grid item xs={12} md={8}>
            <Panel rank={1} title="Pass rate by programme" subheader="Share of course results passed" loading={isLoading} empty={!programmes.length}>
              <BarChart
                horizontal
                max={100}
                categories={programmes.map((p) => p.name)}
                series={[{ name: 'Pass rate', data: programmes.map((p) => p.passRate) }]}
                valueFormat={fPct}
              />
            </Panel>
          </Grid>
          <Grid item xs={12} md={4}>
            <Panel rank={2} title="Results pipeline" subheader="Draft → approved → published" loading={isLoading}>
              <Funnel
                stages={[
                  { stage: 'Recorded', count: s.results },
                  { stage: 'Approved', count: s.approved + s.published },
                  { stage: 'Published', count: s.published },
                ]}
                colors={ordinalSteps(3).reverse()}
              />
            </Panel>
          </Grid>

          <Grid item xs={12} md={6}>
            <Panel rank={3} title="Grade distribution" loading={isLoading} empty={!grades.length}>
              <BarChart categories={grades.map((g) => g.grade)} series={[{ name: 'Results', data: grades.map((g) => g.count) }]} height={280} />
            </Panel>
          </Grid>
          <Grid item xs={12} md={6}>
            <Panel rank={4} title="Student GPA bands" subheader="This session's credit-weighted GPA per student" loading={isLoading} empty={!gpaBands.length}>
              <BarChart
                categories={gpaBands.map((b) => b.band)}
                series={[{ name: 'Students', data: gpaBands.map((b) => b.count) }]}
                colors={ordinalSteps(gpaBands.length)}
                distributed
                height={280}
              />
            </Panel>
          </Grid>

          <Grid item xs={12} md={6}>
            <Panel rank={5} title="Courses needing support" subheader="Lowest pass rates" loading={isLoading} empty={!data?.weakestCourses?.length}>
              <RankList
                max={100}
                color="error.main"
                rows={(data?.weakestCourses || []).map((c) => ({
                  key: String(c.courseId),
                  label: `${c.code ? `${c.code} · ` : ''}${c.name}`,
                  value: c.passRate,
                  display: fPct(c.passRate),
                  caption: `avg ${c.avgScore} · ${fCount(c.count)}`,
                }))}
              />
            </Panel>
          </Grid>
          <Grid item xs={12} md={6}>
            <Panel rank={6} title="Strongest courses" subheader="Highest pass rates" loading={isLoading} empty={!data?.strongestCourses?.length}>
              <RankList
                max={100}
                color={SERIES[2]}
                rows={(data?.strongestCourses || []).map((c) => ({
                  key: String(c.courseId),
                  label: `${c.code ? `${c.code} · ` : ''}${c.name}`,
                  value: c.passRate,
                  display: fPct(c.passRate),
                  caption: `avg ${c.avgScore} · ${fCount(c.count)}`,
                }))}
              />
            </Panel>
          </Grid>
        </>
      )}

      <Grid item xs={12}>
        <Panel title="Curriculum readiness" subheader="What is in place for teaching and assessment" loading={isLoading}>
          <Grid container spacing={2}>
            {[
              { label: 'Active programmes', value: fCount(s?.programCount) },
              { label: 'Class levels', value: fCount(s?.classLevelCount) },
              { label: 'Courses', value: fCount(s?.courseCount) },
              { label: 'Courses with assessments', value: fPct(s?.assessmentCoverage), caption: `${fCount(s?.coursesWithAssessments)} courses` },
              { label: 'Courses with results', value: fPct(s?.resultCoverage), caption: `${fCount(s?.coursesWithResults)} courses` },
              { label: 'Score entries', value: fCount(s?.scoreEntries), caption: 'This session' },
            ].map((stat) => (
              <Grid key={stat.label} item xs={6} sm={4} md={2}>
                <MiniStat {...stat} />
              </Grid>
            ))}
          </Grid>
        </Panel>
      </Grid>
    </Grid>
  );
}

AcademicsTab.propTypes = { session: PropTypes.string };
