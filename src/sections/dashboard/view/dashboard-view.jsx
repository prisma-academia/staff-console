import { useSearchParams } from 'react-router-dom';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import useActiveSession from 'src/hooks/use-active-session';

import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import FinanceTab from '../tabs/finance-tab';
import OverviewTab from '../tabs/overview-tab';
import StudentsTab from '../tabs/students-tab';
import AcademicsTab from '../tabs/academics-tab';
import { EmptyState } from '../components/panel';
import AdmissionsTab from '../tabs/admissions-tab';
import OperationsTab from '../tabs/operations-tab';

// ----------------------------------------------------------------------

// Tabs in priority order: money, intake, the student body, outcomes, then operations.
const TABS = [
  { value: 'overview', label: 'Overview', icon: 'solar:widget-5-bold-duotone' },
  { value: 'finance', label: 'Finance', icon: 'solar:wallet-money-bold-duotone' },
  { value: 'admissions', label: 'Admissions', icon: 'solar:diploma-verified-bold-duotone' },
  { value: 'students', label: 'Students', icon: 'solar:users-group-rounded-bold-duotone' },
  { value: 'academics', label: 'Academics', icon: 'solar:square-academic-cap-bold-duotone' },
  { value: 'operations', label: 'Staff & operations', icon: 'solar:case-round-bold-duotone' },
];

export default function DashboardView() {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const refreshing = useIsFetching({ queryKey: ['dashboard'] }) > 0;
  const { sessionId, session, isReady } = useActiveSession();

  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'overview';
  const setTab = (value) => {
    setParams(value === 'overview' ? {} : { tab: value }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scopeLabel = session ? `Session ${session.name}${session.isCurrent ? ' (current)' : ''}` : 'All sessions';

  return (
    <Can do={PERMISSIONS.VIEW_ANALYTICS} fallback={<NoAccess />}>
      <Container maxWidth="xl" sx={{ pb: 6 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'flex-end' }} spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4">Executive dashboard</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {scopeLabel} · finance and academics follow the session picker in the header
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:refresh-bold" sx={{ ...(refreshing && { animation: 'spin 1s linear infinite' }) }} />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboard'] })}
            disabled={refreshing}
            sx={{ '@keyframes spin': { to: { transform: 'rotate(360deg)' } } }}
          >
            Refresh
          </Button>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ mb: 3, borderBottom: (t) => `1px solid ${t.palette.divider}` }}
        >
          {TABS.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label} icon={<Iconify icon={t.icon} width={20} />} iconPosition="start" />
          ))}
        </Tabs>

        {isReady && (
          <>
            {tab === 'overview' && <OverviewTab session={sessionId} onNavigate={setTab} />}
            {tab === 'finance' && <FinanceTab session={sessionId} />}
            {tab === 'admissions' && <AdmissionsTab />}
            {tab === 'students' && <StudentsTab session={sessionId} />}
            {tab === 'academics' && <AcademicsTab session={sessionId} />}
            {tab === 'operations' && <OperationsTab />}
          </>
        )}
      </Container>
    </Can>
  );
}

function NoAccess() {
  return (
    <Container maxWidth="sm" sx={{ py: 10 }}>
      <EmptyState text="You do not have permission to view analytics. Ask an administrator for the view_analytics permission." />
    </Container>
  );
}
