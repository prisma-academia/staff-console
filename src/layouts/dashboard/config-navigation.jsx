import { useMemo } from 'react';

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
      permission: 'view_dashboard',
    },
    {
      title: 'Users',
      path: '/user',
      icon: <Iconify icon="eva:people-fill" width={24} />,
      permission: 'view_user',
    },
    {
      title: 'User Groups',
      path: '/groups',
      icon: <Iconify icon="mdi:account-group" width={24} />,
      permission: 'view_user_group',
    },
    {
      title: 'Role Permissions',
      path: '/role-permission',
      icon: <Iconify icon="eva:shield-fill" width={24} />,
      permission: 'view_role_permission',
    },
    {
      title: 'Audit Logs',
      path: '/audit',
      icon: <Iconify icon="mdi:history" width={24} />,
      permission: 'view_audit',
    },
    {
      title: 'Application Settings',
      path: '/app-settings',
      icon: <Iconify icon="eva:settings-2-fill" width={24} />,
      permission: 'view_settings',
    },
    {
      title: 'Application',
      path: '/application',
      icon: <Iconify icon="mdi:form-select" width={24} />,
      permission: 'view_application',
    },
    {
      title: 'Admission',
      path: '/admission',
      icon: <Iconify icon="eva:person-add-fill" width={24} />,
      permission: 'view_admission',
    },
    {
      title: 'Student',
      path: '/student',
      icon: <Iconify icon="mdi:school" width={24} />,
      permission: 'view_student',
    },
    {
      title: 'Programs',
      path: '/program',
      icon: <Iconify icon="eva:book-fill" width={24} />,
      permission: 'view_program',
    },
    {
      title: 'Payments',
      path: '/payment',
      icon: <Iconify icon="eva:credit-card-fill" width={24} />,
      permission: 'view_payment',
    },
    {
      title: 'Preference',
      path: '/preference',
      icon: <Iconify icon="eva:options-2-fill" width={24} />,
      permission: 'view_preference',
    },
    {
      title: 'Memos',
      path: '/memo',
      icon: <Iconify icon="eva:message-square-fill" width={24} />,
      permission: 'view_memo',
    },
    {
      title: 'Fees',
      path: '/fee',
      icon: <Iconify icon="mdi:receipt" width={24} />,
      permission: 'view_fee',
    },
    {
      title: 'Documents',
      path: '/document',
      icon: <Iconify icon="eva:file-fill" width={24} />,
      permission: 'view_document',
    },
    {
      title: 'Courses',
      path: '/course',
      icon: <Iconify icon="eva:book-open-fill" width={24} />,
      permission: 'view_course',
    },
    {
      title: 'Class Levels',
      path: '/classlevel',
      icon: <Iconify icon="eva:layers-fill" width={24} />,
      permission: 'view_classlevel',
    },
    {
      title: 'Sessions',
      path: '/session',
      icon: <Iconify icon="eva:calendar-fill" width={24} />,
      permission: 'view_session',
    },
    {
      title: 'Calendar',
      path: '/calender',
      icon: <Iconify icon="eva:calendar-outline" width={24} />,
      permission: 'view_calendar',
    },
    {
      title: 'Results',
      path: '/result',
      icon: <Iconify icon="eva:clipboard-fill" width={24} />,
      permission: 'view_result',
    },
    {
      title: 'Assessments',
      path: '/assessment',
      icon: <Iconify icon="mdi:clipboard-check" width={24} />,
      permission: 'view_assessment',
    },
    {
      title: 'Score sheet',
      path: '/assessment/scores',
      icon: <Iconify icon="mdi:table" width={24} />,
      permission: 'view_assessment_scores',
    },
    {
      title: 'Templates',
      path: '/template',
      icon: <Iconify icon="mdi:file-document-multiple" width={24} />,
      permission: 'view_template',
    },
  ], []);

  return navConfig;
};

export default useNavConfig;
