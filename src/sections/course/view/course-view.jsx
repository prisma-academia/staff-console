import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';

import { Box, Tab, Tabs, Stack, Button, useTheme, Container, Typography } from '@mui/material';

import useActiveSession from 'src/hooks/use-active-session';

import { usePermissions } from 'src/utils/permissions';

import config from 'src/config';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import AddCourseModal from '../add-course';
import CourseListTab from '../course-list-tab';
import ResitPricesTab from '../resit/resit-prices-tab';
import ResitScoresTab from '../resit/resit-scores-tab';
import RegisterResitDialog from '../resit/register-resit-dialog';
import ResitRegistrationsTab from '../resit/resit-registrations-tab';

// ----------------------------------------------------------------------

// The course list, then the resits of failed courses: what a resit costs, who registered (and
// paid) for one, and the score sheet where resit scores replace the failed ones.
// ?tab= picks one (the first tab needs none); ?course= opens a course's resit score sheet.
const TABS = [
  {
    value: 'list',
    label: 'Course list',
    icon: 'mdi:book-open-variant',
    permission: PERMISSIONS.VIEW_COURSE,
    subtitle: 'Manage academic courses and curriculum',
  },
  {
    value: 'resit-fees',
    label: 'Resit fees',
    icon: 'mdi:tag-outline',
    permission: PERMISSIONS.VIEW_RESIT,
    subtitle: 'What a resit of each course costs',
    resit: true,
  },
  {
    value: 'resit-registrations',
    label: 'Resit registrations',
    icon: 'mdi:account-check-outline',
    permission: PERMISSIONS.VIEW_RESIT,
    subtitle: 'Students registered to resit a failed course, and their payments',
    resit: true,
  },
  {
    value: 'resit-scores',
    label: 'Resit scores',
    icon: 'mdi:restore',
    permission: PERMISSIONS.VIEW_RESIT,
    subtitle: 'Record resit scores in place of failed ones',
    resit: true,
  },
];

const tabId = (value) => `course-tab-${value}`;
const panelId = (value) => `course-tabpanel-${value}`;

export default function CourseView() {
  const theme = useTheme();
  const [params, setParams] = useSearchParams();
  const { check } = usePermissions();
  const { session } = useActiveSession();
  const [addOpen, setAddOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  const tabs = TABS.filter((t) => check(t.permission));
  const current = tabs.find((t) => t.value === params.get('tab')) || tabs[0];

  // Each tab keeps its own table state in the URL; switching starts the next one clean
  const setTab = (value) =>
    setParams(value === tabs[0]?.value ? {} : { tab: value }, { replace: true });
  const openResitScores = (courseId, { replace = false } = {}) =>
    setParams(
      courseId ? { tab: 'resit-scores', course: courseId } : { tab: 'resit-scores' },
      { replace }
    );

  if (!current) return <NoAccess />;

  const sessionName = session ? session.name || session.code : '';
  const isFirstTab = current.value === tabs[0].value;

  return (
    <Container maxWidth="xl">
      {!isFirstTab && (
        <Helmet>
          <title>
            {current.label} · Courses | {config.appName}
          </title>
        </Helmet>
      )}

      <Box sx={{ pb: 5, pt: { xs: 2, md: 4 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Courses
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {current.subtitle}
              {current.resit && sessionName ? ` · ${sessionName}` : ''}
            </Typography>
          </Box>

          {current.resit ? (
            <Can do={PERMISSIONS.MANAGE_RESIT}>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={() => setRegisterOpen(true)}
                sx={{
                  px: 3,
                  flexShrink: 0,
                  boxShadow: theme.customShadows.primary,
                  '&:hover': { boxShadow: 'none' },
                }}
              >
                Register a resit
              </Button>
            </Can>
          ) : (
            <Can do={PERMISSIONS.ADD_COURSE}>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={() => setAddOpen(true)}
                sx={{
                  px: 3,
                  flexShrink: 0,
                  boxShadow: theme.customShadows.primary,
                  '&:hover': { boxShadow: 'none' },
                }}
              >
                Add course
              </Button>
            </Can>
          )}
        </Stack>

        {tabs.length > 1 && (
          <Tabs
            value={current.value}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Courses and resits"
            sx={{ mb: 3, borderBottom: (t) => `1px solid ${t.palette.divider}` }}
          >
            {tabs.map((t) => (
              <Tab
                key={t.value}
                value={t.value}
                label={t.label}
                icon={<Iconify icon={t.icon} width={20} />}
                iconPosition="start"
                id={tabId(t.value)}
                aria-controls={panelId(t.value)}
              />
            ))}
          </Tabs>
        )}

        <Box
          role={tabs.length > 1 ? 'tabpanel' : undefined}
          id={panelId(current.value)}
          aria-labelledby={tabs.length > 1 ? tabId(current.value) : undefined}
        >
          {current.value === 'list' && (
            <CourseListTab onOpenResitScores={(courseId) => openResitScores(courseId)} />
          )}
          {current.value === 'resit-fees' && <ResitPricesTab />}
          {current.value === 'resit-registrations' && (
            <ResitRegistrationsTab onRecordScores={(courseId) => openResitScores(courseId)} />
          )}
          {current.value === 'resit-scores' && (
            <ResitScoresTab
              courseId={params.get('course') || ''}
              onCourseChange={(courseId) => openResitScores(courseId, { replace: true })}
            />
          )}
        </Box>
      </Box>

      <AddCourseModal open={addOpen} setOpen={setAddOpen} />
      {current.resit && (
        <RegisterResitDialog
          open={registerOpen}
          onClose={() => setRegisterOpen(false)}
          onRegistered={() => setTab('resit-registrations')}
        />
      )}
    </Container>
  );
}

function NoAccess() {
  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
      <Iconify icon="eva:lock-outline" width={48} sx={{ color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        No access to courses
      </Typography>
      <Typography variant="body2" color="text.secondary">
        You need the view_course permission to see the course list, or view_resit to manage
        resits. Ask an administrator for access.
      </Typography>
    </Container>
  );
}
