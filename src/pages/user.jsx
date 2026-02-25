import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { UserView } from 'src/sections/user/view';

// ----------------------------------------------------------------------

export default function UserPage() {
  return (
    <>
      <Helmet>
        <title>User | {config.appName}</title>
      </Helmet>

      <UserView />
    </>
  );
}
