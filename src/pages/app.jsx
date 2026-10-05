import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { DashboardView } from 'src/sections/dashboard/view';

// ----------------------------------------------------------------------

export default function AppPage() {
  return (
    <>
      <Helmet>
        <title>Executive Dashboard | {config.appName}</title>
      </Helmet>

      <DashboardView />
    </>
  );
}
