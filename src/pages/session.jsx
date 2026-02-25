import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { SessionView } from 'src/sections/session/view';

// ----------------------------------------------------------------------

export default function SessionPage() {
  return (
    <>
      <Helmet>
        <title>Sessions | {config.appName}</title>
      </Helmet>

      <SessionView />
    </>
  );
}
