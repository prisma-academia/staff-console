import { Helmet } from 'react-helmet-async';

import { SessionView } from 'src/sections/session/view';

// ----------------------------------------------------------------------

export default function SessionPage() {
  return (
    <>
      <Helmet>
        <title>Sessions | AB NAIBI Admission</title>
      </Helmet>

      <SessionView />
    </>
  );
}
