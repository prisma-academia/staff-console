import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Button from '@mui/material/Button';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import Iconify from 'src/components/iconify';

import KpiCard from '../components/kpi-card';
import Panel, { SectionHeading } from '../components/panel';
import { Funnel, RankList, BarChart } from '../components/charts';
import { useFinance, useStudents, useAcademics, useAdmissions, useOperations } from '../use-dashboard-data';
import { fPct, SERIES, fCount, fNaira, toneFor, fillMonths, fNairaShort, fMonthToDate , ordinalSteps } from '../utils';

// ----------------------------------------------------------------------

const SEVERITY = { critical: 0, warning: 1, info: 2 };
const SEVERITY_ICON = {
  critical: { icon: 'solar:danger-circle-bold', color: 'error.main', word: 'Critical' },
  warning: { icon: 'solar:danger-triangle-bold', color: 'warning.main', word: 'Warning' },
  info: { icon: 'solar:info-circle-bold', color: 'info.main', word: 'Info' },
};

/** Everything that needs an executive decision, most severe first. */
function buildAlerts({ finance, students, academics, admissions, operations }) {
  const alerts = [];
  const f = finance?.summary;
  if (f) {
    if (f.overdueFeeCount > 0) {
      alerts.push({
        severity: 'critical',
        tab: 'finance',
        title: `${fNaira(f.overdueOutstanding)} overdue`,
        detail: `${f.overdueFeeCount} fee${f.overdueFeeCount > 1 ? 's are' : ' is'} past the due date and not fully paid`,
      });
    }
    if (f.expected > 0 && f.collectionRate < 50) {
      alerts.push({
        severity: f.collectionRate < 25 ? 'critical' : 'warning',
        tab: 'finance',
        title: `Fee collection at ${fPct(f.collectionRate)}`,
        detail: `${fNaira(f.outstanding)} still outstanding this session`,
      });
    }
    if (f.pendingPayments > 0) {
      alerts.push({
        severity: 'info',
        tab: 'finance',
        title: `${fCount(f.pendingPayments)} unfinished checkouts`,
        detail: 'Payments started but not completed at the gateway',
      });
    }
  }
  const s = students?.summary;
  if (s?.awaitingActivation > 0) {
    alerts.push({
      severity: 'warning',
      tab: 'students',
      title: `${fCount(s.awaitingActivation)} students not activated`,
      detail: 'Accounts still in setup or pending — they cannot use the portal',
    });
  }
  const a = academics?.summary;
  if (a) {
    if (a.draft > 0) {
      alerts.push({ severity: 'warning', tab: 'academics', title: `${fCount(a.draft)} results in draft`, detail: 'Awaiting approval' });
    }
    if (a.approved > 0) {
      alerts.push({ severity: 'info', tab: 'academics', title: `${fCount(a.approved)} results approved, not published`, detail: 'Students cannot see them yet' });
    }
    if (a.courseCount > 0 && a.assessmentCoverage < 100) {
      alerts.push({
        severity: 'info',
        tab: 'academics',
        title: `${fCount(a.courseCount - a.coursesWithAssessments)} courses without assessments`,
        detail: 'Scores cannot be entered until assessments are set up',
      });
    }
  }
  const ad = admissions?.summary;
  if (ad) {
    const pendingOffers = ad.offered - ad.accepted;
    if (pendingOffers > 0) {
      alerts.push({ severity: 'info', tab: 'admissions', title: `${fCount(pendingOffers)} offers not yet accepted`, detail: 'Acceptance fee unpaid' });
    }
    const awaitingDecision = ad.paid - ad.offered;
    if (awaitingDecision > 0) {
      alerts.push({ severity: 'warning', tab: 'admissions', title: `${fCount(awaitingDecision)} paid applicants awaiting a decision`, detail: 'No admission offer issued yet' });
    }
    if (ad.daysToClose != null && ad.daysToClose >= 0 && ad.daysToClose <= 14) {
      alerts.push({ severity: 'warning', tab: 'admissions', title: `Applications close in ${ad.daysToClose} day${ad.daysToClose === 1 ? '' : 's'}`, detail: admissions.session?.name });
    }
  }
  const o = operations?.summary;
  if (o) {
    if (o.failedActionsLast30Days > 0) {
      alerts.push({ severity: 'info', tab: 'operations', title: `${fCount(o.failedActionsLast30Days)} failed actions in 30 days`, detail: 'See audit activity' });
    }
    if (o.pendingStaff > 0) {
      alerts.push({ severity: 'info', tab: 'operations', title: `${o.pendingStaff} staff account${o.pendingStaff > 1 ? 's' : ''} pending`, detail: 'Not yet activated' });
    }
  }
  return alerts.sort((x, y) => SEVERITY[x.severity] - SEVERITY[y.severity]);
}

export default function OverviewTab({ session, onNavigate }) {
  const finance = useFinance(session);
  const students = useStudents(session);
  const academics = useAcademics(session);
  const operations = useOperations();
  const admissions = useAdmissions();

  const f = finance.data?.summary;
  const s = students.data?.summary;
  const a = academics.data?.summary;
  const o = operations.data?.summary;
  const ad = admissions.data?.summary;

  const alerts = buildAlerts({
    finance: finance.data,
    students: students.data,
    academics: academics.data,
    admissions: admissions.data,
    operations: operations.data,
  });
  const alertsLoading = finance.isLoading || students.isLoading || academics.isLoading;

  const monthly = fillMonths(finance.data?.monthly, ['amount', 'count'], 12);
  const feeRows = (finance.data?.fees || []).slice(0, 6);
  const programmes = (students.data?.byProgram || []).slice(0, 8);
  const funnel = admissions.data?.funnel || [];

  return (
    <Grid container spacing={3}>
      {/* Ranked headline figures, most important first */}
      <Grid item xs={12} sm={6} lg={3}>
        <KpiCard
          rank={1}
          label="Fee collection rate"
          icon="solar:wallet-money-bold-duotone"
          loading={finance.isLoading}
          value={fPct(f?.collectionRate)}
          progress={f?.collectionRate}
          tone={f?.expected ? toneFor(f.collectionRate, 75, 50) : undefined}
          caption={f ? `${fNairaShort(f.collected)} of ${fNairaShort(f.expected)} billed` : ''}
          onClick={() => onNavigate('finance')}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <KpiCard
          rank={2}
          label="Outstanding fees"
          icon="solar:bill-cross-bold-duotone"
          loading={finance.isLoading}
          value={fNairaShort(f?.outstanding)}
          tone={f && (f.overdueOutstanding > 0 ? 'critical' : 'good')}
          toneLabel={f?.overdueOutstanding > 0 ? `${fNairaShort(f.overdueOutstanding)} overdue` : 'None overdue'}
          caption={f ? `${f.feeCount} fees this session` : ''}
          onClick={() => onNavigate('finance')}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <KpiCard
          rank={3}
          label="Active students"
          icon="solar:users-group-rounded-bold-duotone"
          loading={students.isLoading}
          value={fCount(s?.active)}
          progress={s?.total ? (s.active / s.total) * 100 : undefined}
          caption={s ? `of ${fCount(s.total)} enrolled · ${fCount(s.newThisSession)} new this session` : ''}
          onClick={() => onNavigate('students')}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <KpiCard
          rank={4}
          label="Admissions accepted"
          icon="solar:diploma-verified-bold-duotone"
          loading={admissions.isLoading}
          value={admissions.isError ? '—' : fCount(ad?.accepted)}
          progress={ad?.paid ? (ad.accepted / ad.paid) * 100 : undefined}
          caption={ad ? `${fCount(ad.paid)} paid applicants · ${fCount(ad.offered)} offered` : 'Admissions service unavailable'}
          onClick={() => onNavigate('admissions')}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <KpiCard
          rank={5}
          label="Revenue collected"
          icon="solar:graph-up-bold-duotone"
          loading={finance.isLoading}
          value={fNairaShort(f?.revenue)}
          caption={f ? `${fNairaShort(f.revenueLast30Days)} in the last 30 days` : ''}
          onClick={() => onNavigate('finance')}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <KpiCard
          rank={6}
          label="Course pass rate"
          icon="solar:medal-ribbons-star-bold-duotone"
          loading={academics.isLoading}
          value={a?.results ? fPct(a.passRate) : '—'}
          progress={a?.results ? a.passRate : undefined}
          tone={a?.results ? toneFor(a.passRate, 70, 50) : undefined}
          caption={academicCaption(a)}
          onClick={() => onNavigate('academics')}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <KpiCard
          rank={7}
          label="Student portal adoption"
          icon="solar:smartphone-bold-duotone"
          loading={students.isLoading}
          value={fPct(s?.portalAdoption)}
          progress={s?.portalAdoption}
          caption={s ? `${fCount(s.activeLast30Days)} signed in within 30 days` : ''}
          onClick={() => onNavigate('students')}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <KpiCard
          rank={8}
          label="Staff active this week"
          icon="solar:case-round-bold-duotone"
          loading={operations.isLoading}
          value={o ? `${fCount(o.staffActiveLast7Days)} / ${fCount(o.staff)}` : '—'}
          progress={o?.staff ? (o.staffActiveLast7Days / o.staff) * 100 : undefined}
          caption={o ? `${fCount(o.actionsLast30Days)} recorded actions in 30 days` : ''}
          onClick={() => onNavigate('operations')}
        />
      </Grid>

      {/* Revenue momentum + attention list */}
      <Grid item xs={12} md={8}>
        <Panel
          title="Revenue collected by month"
          subheader="Completed fee payments"
          loading={finance.isLoading}
          empty={!monthly.length}
          emptyText="No completed payments yet"
          action={<DrillButton onClick={() => onNavigate('finance')} />}
        >
          <BarChart
            categories={monthly.map((m) => fMonthToDate(m.month))}
            series={[{ name: 'Collected', data: monthly.map((m) => m.amount) }]}
            valueFormat={fNairaShort}
            height={300}
          />
        </Panel>
      </Grid>
      <Grid item xs={12} md={4}>
        <Panel
          title="Needs attention"
          subheader="Ranked by severity"
          loading={alertsLoading}
          empty={!alerts.length}
          emptyText="Nothing needs attention right now"
        >
          <List disablePadding sx={{ mx: -1, maxHeight: 340, overflowY: 'auto' }}>
            {alerts.map((alert) => {
              const sev = SEVERITY_ICON[alert.severity];
              return (
                <ListItemButton key={alert.title} onClick={() => onNavigate(alert.tab)} sx={{ borderRadius: 1, alignItems: 'flex-start', py: 1 }}>
                  <Box sx={{ color: sev.color, mr: 1.5, mt: 0.25, display: 'flex' }} title={sev.word}>
                    <Iconify icon={sev.icon} width={20} />
                  </Box>
                  <ListItemText
                    primary={alert.title}
                    secondary={alert.detail}
                    primaryTypographyProps={{ variant: 'subtitle2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Panel>
      </Grid>

      <Grid item xs={12}>
        <SectionHeading title="Module snapshots" description="Open a tab for the full breakdown" />
      </Grid>

      <Grid item xs={12} md={6}>
        <Panel
          rank={1}
          title="Collection by fee"
          subheader="Largest outstanding balances first"
          loading={finance.isLoading}
          empty={!feeRows.length}
          emptyText="No fees set up for this session"
          action={<DrillButton onClick={() => onNavigate('finance')} />}
        >
          <RankList
            max={100}
            rows={feeRows.map((fee) => ({
              key: fee._id,
              label: fee.name,
              value: fee.progress,
              display: fPct(fee.progress),
              caption: `${fNairaShort(fee.outstanding)} due`,
              color: fee.isOverdue ? 'error.main' : SERIES[0],
              ...(fee.isOverdue && { caption: `${fNairaShort(fee.outstanding)} overdue` }),
            }))}
          />
        </Panel>
      </Grid>
      <Grid item xs={12} md={6}>
        <Panel
          rank={4}
          title="Admissions funnel"
          subheader={admissions.data?.session ? `Admission session ${admissions.data.session.name}` : 'Active admission session'}
          loading={admissions.isLoading}
          empty={admissions.isError || !funnel.length || !funnel[0].count}
          emptyText={admissions.isError ? 'Admissions service unavailable' : 'No applications yet'}
          action={<DrillButton onClick={() => onNavigate('admissions')} />}
        >
          <Funnel stages={funnel} colors={ordinalSteps(funnel.length).reverse()} />
        </Panel>
      </Grid>
      <Grid item xs={12} md={6}>
        <Panel
          rank={3}
          title="Enrolment by programme"
          subheader="Active vs not yet active"
          loading={students.isLoading}
          empty={!programmes.length}
          action={<DrillButton onClick={() => onNavigate('students')} />}
        >
          <BarChart
            horizontal
            stacked
            categories={programmes.map((p) => p.name)}
            series={[
              { name: 'Active', data: programmes.map((p) => p.active) },
              { name: 'Not active', data: programmes.map((p) => p.count - p.active) },
            ]}
            colors={[SERIES[0], '#C4CDD5']}
          />
        </Panel>
      </Grid>
      <Grid item xs={12} md={6}>
        <Panel
          rank={6}
          title="Results pipeline"
          subheader="Draft → approved → published"
          loading={academics.isLoading}
          empty={!a?.results}
          emptyText="No results recorded for this session"
          action={<DrillButton onClick={() => onNavigate('academics')} />}
        >
          <Funnel
            stages={[
              { stage: 'Recorded', count: a?.results || 0 },
              { stage: 'Approved', count: (a?.approved || 0) + (a?.published || 0) },
              { stage: 'Published', count: a?.published || 0 },
            ]}
            colors={ordinalSteps(3).reverse()}
          />
        </Panel>
      </Grid>
    </Grid>
  );
}

OverviewTab.propTypes = { session: PropTypes.string, onNavigate: PropTypes.func.isRequired };

function academicCaption(a) {
  if (!a) return '';
  if (!a.results) return 'No results recorded this session';
  return `${fCount(a.results)} results · avg score ${a.averageScore}`;
}

function DrillButton({ onClick }) {
  return (
    <Button size="small" color="inherit" endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />} onClick={onClick} sx={{ flexShrink: 0 }}>
      Details
    </Button>
  );
}

DrillButton.propTypes = { onClick: PropTypes.func };
