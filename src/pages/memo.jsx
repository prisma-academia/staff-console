import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { MemoView } from 'src/sections/memo/view';

// ----------------------------------------------------------------------

export default function MemoPage() {
  return (
    <>
      <Helmet>
        <title>Memo | {config.appName}</title>
      </Helmet>

      <MemoView />
    </>
  );
}
