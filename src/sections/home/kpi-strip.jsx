import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';

import Iconify from 'src/components/iconify';

import KpiCard from 'src/sections/dashboard/components/kpi-card';
import { SectionHeading } from 'src/sections/dashboard/components/panel';
import { fPct, fCount, toneFor, fNairaShort } from 'src/sections/dashboard/utils';

// ----------------------------------------------------------------------

/**
 * Four headline figures for the session, from one GET /analytics call (plus the
 * admissions service). Cards drill into the matching dashboard tab when allowed.
 */
export default function KpiStrip({ summary, loading, error, admissions, admissionsLoading, admissionsError, sessionLabel, canOpenDashboard }) {
  const navigate = useNavigate();
  const drill = (tab) => (canOpenDashboard ? () => navigate(`/dashboard?tab=${tab}`) : undefined);

  const s = summary?.students?.summary;
  const f = summary?.finance?.summary;
  const a = summary?.academics?.summary;
  const ad = admissions?.summary;
  const unavailable = error ? 'Analytics unavailable' : '';

  let applicationsCaption = '';
  if (admissionsError) applicationsCaption = 'Admissions service unavailable';
  else if (ad) applicationsCaption = `${fCount(ad.offered)} offered · ${fCount(ad.accepted)} accepted`;

  let resultsCaption = unavailable;
  if (a) resultsCaption = a.results ? `${fCount(a.published)} of ${fCount(a.results)} results` : 'No results recorded this session';

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12}>
        <SectionHeading
          title="This session at a glance"
          description={sessionLabel}
          action={
            canOpenDashboard ? (
              <Button
                size="small"
                color="inherit"
                endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
                onClick={() => navigate('/dashboard')}
                sx={{ flexShrink: 0 }}
              >
                Dashboard
              </Button>
            ) : null
          }
        />
      </Grid>

      <Grid item xs={12} sm={6} lg={3}>
        <KpiCard
          label="Active students"
          icon="solar:users-group-rounded-bold-duotone"
          loading={loading}
          value={s ? fCount(s.active) : '—'}
          progress={s?.total ? (s.active / s.total) * 100 : undefined}
          caption={s ? `of ${fCount(s.total)} enrolled · ${fCount(s.newThisSession)} new` : unavailable}
          onClick={drill('students')}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <KpiCard
          label="Fees collected"
          icon="solar:wallet-money-bold-duotone"
          loading={loading}
          value={f ? fNairaShort(f.collected) : '—'}
          progress={f?.expected ? f.collectionRate : undefined}
          tone={f?.expected ? toneFor(f.collectionRate, 75, 50) : undefined}
          toneLabel={f?.expected ? fPct(f.collectionRate) : undefined}
          caption={f ? `of ${fNairaShort(f.expected)} expected` : unavailable}
          onClick={drill('finance')}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <KpiCard
          label="Paid applications"
          icon="solar:diploma-verified-bold-duotone"
          loading={admissionsLoading}
          value={ad ? fCount(ad.paid) : '—'}
          progress={ad?.paid ? (ad.offered / ad.paid) * 100 : undefined}
          caption={applicationsCaption}
          onClick={drill('admissions')}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <KpiCard
          label="Results published"
          icon="solar:square-academic-cap-bold-duotone"
          loading={loading}
          value={a?.results ? fPct(a.publishRate) : '—'}
          progress={a?.results ? a.publishRate : undefined}
          caption={resultsCaption}
          onClick={drill('academics')}
        />
      </Grid>
    </Grid>
  );
}

KpiStrip.propTypes = {
  summary: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.bool,
  admissions: PropTypes.object,
  admissionsLoading: PropTypes.bool,
  admissionsError: PropTypes.bool,
  sessionLabel: PropTypes.string,
  canOpenDashboard: PropTypes.bool,
};
