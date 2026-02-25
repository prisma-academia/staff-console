import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { NotFoundView } from 'src/sections/error';

// ----------------------------------------------------------------------

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>Page Not Found | {config.appName}</title>
      </Helmet>

      <NotFoundView />
    </>
  );
}
