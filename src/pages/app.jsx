import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { AppView } from 'src/sections/overview/view';

// ----------------------------------------------------------------------

export default function AppPage() {
  return (
    <>
      <Helmet>
        <title>Dashboard | {config.appName}</title>
      </Helmet>

      <AppView />
    </>
  );
}
