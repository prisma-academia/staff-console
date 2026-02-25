import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { DocumentView } from 'src/sections/document/view';

// ----------------------------------------------------------------------

export default function DocumentPage() {
  return (
    <>
      <Helmet>
        <title>Documents | {config.appName}</title>
      </Helmet>

      <DocumentView />
    </>
  );
}
