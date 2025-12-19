import { Helmet } from 'react-helmet-async';

import { RolePermissionView } from 'src/sections/role-permission/view';

// ----------------------------------------------------------------------

export default function RolePermissionPage() {
  return (
    <>
      <Helmet>
        <title> Role Permission | AB NAIBI Admission  </title>
      </Helmet>

      <RolePermissionView />
    </>
  );
}

