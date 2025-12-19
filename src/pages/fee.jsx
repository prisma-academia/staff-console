import { Helmet } from 'react-helmet-async';

import { FeeView } from 'src/sections/fee/view';

// ----------------------------------------------------------------------

export default function FeePage() {
  return (
    <>
      <Helmet>
        <title> Fees | AB NAIBI Admission </title>
      </Helmet>

      <FeeView />
    </>
  );
}
