import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { ResitView } from 'src/sections/resit/view';

// ----------------------------------------------------------------------

export default function ResitPage() {
  return (
    <>
      <Helmet>
        <title>Resits | {config.appName}</title>
      </Helmet>

      <ResitView />
    </>
  );
}
