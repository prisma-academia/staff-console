import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { ApplicationView } from 'src/sections/application/view';

// ----------------------------------------------------------------------

export default function ApplicationPage() {
  return (
    <>
      <Helmet>
        <title>Application | {config.appName}</title>
      </Helmet>

      <ApplicationView />
    </>
  );
}
