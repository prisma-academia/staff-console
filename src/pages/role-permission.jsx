import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { RolePermissionView } from 'src/sections/role-permission/view';

// ----------------------------------------------------------------------

export default function RolePermissionPage() {
  return (
    <>
      <Helmet>
        <title>Role Permission | {config.appName}</title>
      </Helmet>

      <RolePermissionView />
    </>
  );
}

