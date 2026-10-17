import { useMemo, useState } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';

import useActiveSession from 'src/hooks/use-active-session';

import { usePermissions } from 'src/utils/permissions';

import { useAuthStore } from 'src/store';

import KpiStrip from '../kpi-strip';
import HomeHeader from '../home-header';
import LatestMemos from '../latest-memos';
import AttentionRow from '../attention-row';
import QuickActions from '../quick-actions';
import { buildAttention } from '../attention';
import RecentActivity from '../recent-activity';
import ProfileSummary from '../profile-summary';
import { EditProfileDialog, ChangePasswordDialog } from '../profile-dialogs';
import {
  homeAccess,
  useMyCourses,
  useMyProfile,
  useMyActivity,
  useLatestMemos,
  useAnalyticsSummary,
  useAdmissionsSummary,
} from '../use-home-data';

// ----------------------------------------------------------------------

/**
 * Role-aware landing page. Every block is gated on the permission behind its data,
 * so a user with no analytics access still gets their work queue, modules, memos
 * and activity.
 */
export default function HomeView() {
  const userFromStore = useAuthStore((state) => state.user);
  const { check, checkAny } = usePermissions();
  const { sessionId, session, isReady: sessionReady } = useActiveSession();
  const access = homeAccess(check, checkAny);

  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [openEditProfile, setOpenEditProfile] = useState(false);

  const profile = useMyProfile();
  const activity = useMyActivity(8);
  const summary = useAnalyticsSummary(sessionId, { enabled: access.analytics && sessionReady });
  const admissions = useAdmissionsSummary({ enabled: access.analytics || access.admissions });
  const courses = useMyCourses(sessionId, { enabled: access.courses && sessionReady });
  const memos = useLatestMemos({ enabled: access.memos });

  const user = profile.data || userFromStore;

  const attentionSources = access.analytics || access.admissions || access.courses;
  const attentionLoading =
    !sessionReady ||
    (access.analytics && summary.isLoading) ||
    (access.admissions && admissions.isLoading) ||
    (access.courses && courses.isLoading);
  const attentionPartial =
    (access.analytics && summary.isError) || (access.admissions && admissions.isError) || (access.courses && courses.isError);

  const attention = useMemo(
    () =>
      buildAttention({
        check,
        checkAny,
        summary: access.analytics ? summary.data : null,
        admissions: access.admissions ? admissions.data : null,
        courses: access.courses ? courses.data?.courses : null,
      }),
    // check/checkAny change identity every render; the inputs that matter are the data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [summary.data, admissions.data, courses.data, access.analytics, access.admissions, access.courses]
  );

  let sessionLabel = 'All sessions';
  if (session) sessionLabel = `Session ${session.name}${session.currentSemester ? ` · ${session.currentSemester}` : ''}`;

  return (
    <Container maxWidth="xl" sx={{ pb: 6 }}>
      <HomeHeader
        user={user}
        loading={profile.isLoading && !user}
        session={session}
        sessionId={sessionId}
        sessionReady={sessionReady}
        onEditProfile={() => setOpenEditProfile(true)}
        onChangePassword={() => setOpenChangePassword(true)}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {attentionSources && <AttentionRow items={attention} loading={attentionLoading} partial={attentionPartial} />}

            {access.analytics && (
              <KpiStrip
                summary={summary.data}
                loading={!sessionReady || summary.isLoading}
                error={summary.isError}
                admissions={admissions.data}
                admissionsLoading={admissions.isLoading}
                admissionsError={admissions.isError}
                sessionLabel={sessionLabel}
                canOpenDashboard={access.dashboard}
              />
            )}

            <QuickActions />
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {access.memos && <LatestMemos memos={memos.data || []} loading={memos.isLoading} error={memos.isError} />}
            <RecentActivity logs={activity.data || []} loading={activity.isLoading} canViewAudit={access.audit} />
            <ProfileSummary user={user} loading={profile.isLoading && !user} error={profile.error} />
          </Stack>
        </Grid>
      </Grid>

      <ChangePasswordDialog open={openChangePassword} onClose={() => setOpenChangePassword(false)} email={user?.email} />
      <EditProfileDialog open={openEditProfile} onClose={() => setOpenEditProfile(false)} user={user} />
    </Container>
  );
}
