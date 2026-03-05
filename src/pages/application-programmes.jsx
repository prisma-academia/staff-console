import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { AppProgrammeView } from 'src/sections/app-programme/view';

// ----------------------------------------------------------------------

export default function ApplicationProgrammesPage() {
  return (
    <>
      <Helmet>
        <title>App Programmes | {config.appName}</title>
      </Helmet>

      <AppProgrammeView />
    </>
  );
}
