import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { SettingsView } from 'src/sections/settings/view/index';

// ----------------------------------------------------------------------

export default function GroupPage() {
  return (
    <>
      <Helmet>
        <title>Settings | {config.appName}</title>
      </Helmet>

      <SettingsView />
    </>
  );
}
