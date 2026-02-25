import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { CalenderView } from 'src/sections/calender/view';

// ----------------------------------------------------------------------

export default function CalenderPage() {
  return (
    <>
      <Helmet>
        <title>Calender | {config.appName}</title>
      </Helmet>

      <CalenderView />
    </>
  );
}
