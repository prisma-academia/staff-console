import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { AppAnalyticsView } from 'src/sections/app-analytics/view/index';

// ----------------------------------------------------------------------

export default function ApplicationAnalyticsPage() {
  return (
    <>
      <Helmet>
        <title>Application Analytics | {config.appName}</title>
      </Helmet>

      <AppAnalyticsView />
    </>
  );
}
