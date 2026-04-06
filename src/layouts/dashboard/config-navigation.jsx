import { useMemo } from 'react';

import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';

const useNavConfig = () => {
  const navConfig = useMemo(() => [
    {
      title: 'Home',
      path: '/',
      icon: <Iconify icon="eva:home-fill" width={24} />,
      permission: null,
      public: true,
    },
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <Iconify icon="eva:pie-chart-2-fill" width={24} />,
      permission: PERMISSIONS.VIEW_DASHBOARD,
    },
    {
      title: 'Users',
      path: '/user',
      icon: <Iconify icon="eva:people-fill" width={24} />,
      permission: PERMISSIONS.VIEW_USER,
    },
    {
      title: 'User Groups',
      path: '/groups',
      icon: <Iconify icon="mdi:account-group" width={24} />,
      permission: PERMISSIONS.VIEW_USER_GROUP,
    },
    {
      title: 'Role Permissions',
      path: '/role-permission',
      icon: <Iconify icon="eva:shield-fill" width={24} />,
      permission: PERMISSIONS.VIEW_ROLE_PERMISSION,
    },
    {
      title: 'Audit Logs',
      path: '/audit',
      icon: <Iconify icon="mdi:history" width={24} />,
      permission: PERMISSIONS.VIEW_AUDIT,
    },
    {
      title: 'Application Settings',
      path: '/app-settings',
      icon: <Iconify icon="eva:settings-2-fill" width={24} />,
      permission: PERMISSIONS.VIEW_SETTINGS,
    },
    {
      title: 'Applications & admissions',
      icon: <Iconify icon="mdi:form-select" width={24} />,
      children: [
        {
          title: 'Application',
          path: '/application',
          icon: <Iconify icon="mdi:form-select" width={24} />,
          permission: PERMISSIONS.VIEW_APPLICATION,
        },
        {
          title: 'Admission',
          path: '/admission',
          icon: <Iconify icon="eva:person-add-fill" width={24} />,
          permission: PERMISSIONS.VIEW_ADMISSION,
        },
        {
          title: 'Session',
          path: '/application/sessions',
          icon: <Iconify icon="eva:calendar-fill" width={24} />,
          permission: PERMISSIONS.VIEW_APP_SESSION,
        },
        {
          title: 'Programme',
          path: '/application/programmes',
          icon: <Iconify icon="eva:book-fill" width={24} />,
          permission: PERMISSIONS.VIEW_APP_PROGRAMME,
        },
        {
          title: 'Analytics',
          path: '/application/analytics',
          icon: <Iconify icon="eva:bar-chart-fill" width={24} />,
          permission: PERMISSIONS.VIEW_ANALYTICS,
        },
      ],
    },
    {
      title: 'Student',
      path: '/student',
      icon: <Iconify icon="mdi:school" width={24} />,
      permission: PERMISSIONS.VIEW_STUDENT,
    },
    {
      title: 'Programs',
      path: '/program',
      icon: <Iconify icon="eva:book-fill" width={24} />,
      permission: PERMISSIONS.VIEW_PROGRAM,
    },
    {
      title: 'Payments',
      path: '/payment',
      icon: <Iconify icon="eva:credit-card-fill" width={24} />,
      permission: PERMISSIONS.VIEW_PAYMENT,
    },
    {
      title: 'Memos',
      path: '/memo',
      icon: <Iconify icon="eva:message-square-fill" width={24} />,
      permission: PERMISSIONS.VIEW_MEMO,
    },
    {
      title: 'Fees',
      path: '/fee',
      icon: <Iconify icon="mdi:receipt" width={24} />,
      permission: PERMISSIONS.VIEW_FEE,
    },
    {
      title: 'Documents',
      path: '/document',
      icon: <Iconify icon="eva:file-fill" width={24} />,
      permission: PERMISSIONS.VIEW_DOCUMENT,
    },
    {
      title: 'Courses',
      path: '/course',
      icon: <Iconify icon="eva:book-open-fill" width={24} />,
      permission: PERMISSIONS.VIEW_COURSE,
    },
    {
      title: 'Class Levels',
      path: '/classlevel',
      icon: <Iconify icon="eva:layers-fill" width={24} />,
      permission: PERMISSIONS.VIEW_CLASSLEVEL,
    },
    {
      title: 'Sessions',
      path: '/session',
      icon: <Iconify icon="eva:calendar-fill" width={24} />,
      permission: PERMISSIONS.VIEW_SESSION,
    },
    {
      title: 'Calendar',
      path: '/calender',
      icon: <Iconify icon="eva:calendar-outline" width={24} />,
      permission: PERMISSIONS.VIEW_CALENDAR,
    },
    {
      title: 'Results',
      path: '/result',
      icon: <Iconify icon="eva:clipboard-fill" width={24} />,
      permission: PERMISSIONS.VIEW_RESULT,
    },
    {
      title: 'Assessments',
      path: '/assessment',
      icon: <Iconify icon="mdi:clipboard-check" width={24} />,
      permission: PERMISSIONS.VIEW_ASSESSMENT,
    },
    {
      title: 'Score sheet',
      path: '/assessment/scores',
      icon: <Iconify icon="mdi:table" width={24} />,
      permission: PERMISSIONS.VIEW_ASSESSMENT_SCORES,
    },
    {
      title: 'Templates',
      path: '/template',
      icon: <Iconify icon="mdi:file-document-multiple" width={24} />,
      permission: PERMISSIONS.VIEW_TEMPLATE,
    },
  ], []);

  return navConfig;
};

export default useNavConfig;
