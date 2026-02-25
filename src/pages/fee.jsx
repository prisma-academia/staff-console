import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { FeeView } from 'src/sections/fee/view';

// ----------------------------------------------------------------------

export default function FeePage() {
  return (
    <>
      <Helmet>
        <title>Fees | {config.appName}</title>
      </Helmet>

      <FeeView />
    </>
  );
}
