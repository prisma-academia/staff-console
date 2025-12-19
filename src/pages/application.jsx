import { Helmet } from 'react-helmet-async';

import { ApplicationView } from 'src/sections/application/view';

// ----------------------------------------------------------------------

export default function ApplicationPage() {
  return (
    <>
      <Helmet>
        <title> Application | AB NAIBI Application </title>
      </Helmet>

      <ApplicationView />
    </>
  );
}
