import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Box, Tab, Tabs, Stack, Button, useTheme, Container, Typography } from '@mui/material';

import useActiveSession from 'src/hooks/use-active-session';

import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import ResitPricesTab from '../resit-prices-tab';
import ResitScoresTab from '../resit-scores-tab';
import RegisterResitDialog from '../register-resit-dialog';
import ResitRegistrationsTab from '../resit-registrations-tab';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'prices', label: 'Prices', icon: 'mdi:tag-outline' },
  { value: 'registrations', label: 'Registrations', icon: 'mdi:account-check' },
  { value: 'scores', label: 'Resit scores', icon: 'mdi:restore' },
];

/**
 * Resits of failed courses: what each resit costs, who registered (and paid) for one, and
 * the resit score sheet where the scores are recorded in place of the failed ones.
 */
export default function ResitView() {
  const theme = useTheme();
  const [params, setParams] = useSearchParams();
  const [registerOpen, setRegisterOpen] = useState(false);
  const { session } = useActiveSession();

  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'prices';
  const setTab = (value) => setParams(value === 'prices' ? {} : { tab: value }, { replace: true });
  const courseId = params.get('course') || '';
  // The resit score sheet for a course (from a registration's "Record score", or the picker)
  const openScores = (id, { replace = false } = {}) =>
    setParams(id ? { tab: 'scores', course: id } : { tab: 'scores' }, { replace });

  return (
    <Can do={PERMISSIONS.VIEW_RESIT} fallback={<NoAccess />}>
      <Container maxWidth="xl">
        <Box sx={{ pb: 5, pt: { xs: 2, md: 4 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h4" color="text.primary" fontWeight="700">
                Resits
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Resit prices for failed courses, the students who registered and paid, and their resit
                scores
                {session ? ` · ${session.name || session.code}` : ''}
              </Typography>
            </Box>
            <Can do={PERMISSIONS.MANAGE_RESIT}>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={() => setRegisterOpen(true)}
                sx={{
                  px: 3,
                  flexGrow: { xs: 1, sm: 0 },
                  boxShadow: theme.customShadows.primary,
                  '&:hover': { boxShadow: 'none' },
                }}
              >
                Register a student
              </Button>
            </Can>
          </Stack>

          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{ mb: 3, borderBottom: (t) => `1px solid ${t.palette.divider}` }}
          >
            {TABS.map((t) => (
              <Tab
                key={t.value}
                value={t.value}
                label={t.label}
                icon={<Iconify icon={t.icon} width={20} />}
                iconPosition="start"
              />
            ))}
          </Tabs>

          {tab === 'prices' && <ResitPricesTab />}
          {tab === 'registrations' && <ResitRegistrationsTab onRecordScores={(id) => openScores(id)} />}
          {tab === 'scores' && (
            <ResitScoresTab
              courseId={courseId}
              onCourseChange={(id) => openScores(id, { replace: true })}
            />
          )}
        </Box>
      </Container>

      <RegisterResitDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={() => setTab('registrations')}
      />
    </Can>
  );
}

function NoAccess() {
  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
      <Iconify icon="eva:lock-outline" width={48} sx={{ color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        No access to resits
      </Typography>
      <Typography variant="body2" color="text.secondary">
        You do not have permission to view resits. Ask an administrator for the view_resit
        permission.
      </Typography>
    </Container>
  );
}
