import { Helmet } from 'react-helmet-async';

import { GroupsView } from 'src/sections/groups';

// ----------------------------------------------------------------------

export default function GroupsPage() {
  return (
    <>
      <Helmet>
        <title> User Groups | Staff Console </title>
      </Helmet>

      <GroupsView />
    </>
  );
}

