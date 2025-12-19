import { useMemo } from 'react';

import config from 'src/config';

import SvgColor from 'src/components/svg-color';

const useNavConfig = () => {
  const icon = (name) => {
    const iconPath = config.utils.buildImageUrl(config.assets.icons.navbar, `${name}.svg`);
    return <SvgColor src={iconPath} sx={{ width: 1, height: 1 }} />;
  };

  const navConfig = useMemo(() => [
    {
      title: 'Dashboard',
      path: '/',
      icon: icon('ic_analytics'),
      permission: 'view_dashboard',
    },
    {
      title: 'Users',
      path: '/user',
      icon: icon('ic_person'),
      permission: 'view_user',
    },
    {
      title: 'User Groups',
      path: '/groups',
      icon: icon('ic_person'),
      permission: 'view_user_group',
    },
    {
      title: 'Role Permissions',
      path: '/role-permission',
      icon: icon('ic_settings'),
      permission: 'view_role_permission',
    },
    {
      title: 'Application',
      path: '/application',
      icon: icon('ic_admission'),
      permission: 'view_application',
    },
    {
      title: 'Admission',
      path: '/admission',
      icon: icon('ic_admission'),
      permission: 'view_admission',
    },
    {
      title: 'Student',
      path: '/student',
      icon: icon('ic_student'),
      permission: 'view_student',
    },
    {
      title: 'Programs',
      path: '/program',
      icon: icon('ic_program'),
      permission: 'view_program',
    },
    {
      title: 'Payments',
      path: '/payment',
      icon: icon('ic_payment'),
      permission: 'view_payment',
    },
    {
      title: 'Preference',
      path: '/preference',
      icon: icon('ic_settings'),
      permission: 'view_preference',
    },
    {
      title: 'Memos',
      path: '/memo',
      icon: icon('ic_memo'),
      permission: 'view_memo',
    },
    {
      title: 'Fees',
      path: '/fee',
      icon: icon('ic_fee'),
      permission: 'view_fee',
    },
    {
      title: 'Documents',
      path: '/document',
      icon: icon('ic_document'),
      permission: 'view_document',
    },
    {
      title: 'Courses',
      path: '/course',
      icon: icon('ic_course'),
      permission: 'view_course',
    },
    {
      title: 'Calendar',
      path: '/calender',
      icon: icon('ic_calendar'),
      permission: 'view_calendar',
    },
    {
      title: 'Results',
      path: '/result',
      icon: icon('ic_result'),
      permission: 'view_result',
    },
  ], []);

  return navConfig;
};

export default useNavConfig;
