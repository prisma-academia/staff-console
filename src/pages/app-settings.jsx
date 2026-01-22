import { Helmet } from 'react-helmet-async';

import { AppSettingsView } from 'src/sections/app-settings/view';

// ----------------------------------------------------------------------

export default function AppSettingsPage() {
  return (
    <>
      <Helmet>
        <title> Application Settings | NDE Profiler </title>
      </Helmet>

      <AppSettingsView />
    </>
  );
}

