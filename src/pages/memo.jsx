import { Helmet } from 'react-helmet-async';

import { MemoView } from 'src/sections/memo/view';

// ----------------------------------------------------------------------

export default function MemoPage() {
  return (
    <>
      <Helmet>
        <title> Memo | AB NAIBI Admission </title>
      </Helmet>

      <MemoView />
    </>
  );
}
