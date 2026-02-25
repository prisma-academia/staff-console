import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { AppSettingsView } from 'src/sections/app-settings/view';

// ----------------------------------------------------------------------

export default function AppSettingsPage() {
  return (
    <>
      <Helmet>
        <title>Application Settings | {config.appName}</title>
      </Helmet>

      <AppSettingsView />
    </>
  );
}

