import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { GroupsView } from 'src/sections/groups';

// ----------------------------------------------------------------------

export default function GroupsPage() {
  return (
    <>
      <Helmet>
        <title>User Groups | {config.appName}</title>
      </Helmet>

      <GroupsView />
    </>
  );
}

