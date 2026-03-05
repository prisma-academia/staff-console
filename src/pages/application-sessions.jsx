import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { AppSessionView } from 'src/sections/app-session/view';

// ----------------------------------------------------------------------

export default function ApplicationSessionsPage() {
  return (
    <>
      <Helmet>
        <title>App Sessions | {config.appName}</title>
      </Helmet>

      <AppSessionView />
    </>
  );
}
