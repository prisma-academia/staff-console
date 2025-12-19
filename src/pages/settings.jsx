import { Helmet } from 'react-helmet-async';

import { SettingsView } from 'src/sections/settings/view/index';

// ----------------------------------------------------------------------

export default function GroupPage() {
  return (
    <>
      <Helmet>
        <title> Settings | NDE Profiler  </title>
      </Helmet>

      <SettingsView />
    </>
  );
}
