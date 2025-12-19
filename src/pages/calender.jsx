import { Helmet } from 'react-helmet-async';

import { CalenderView } from 'src/sections/calender/view';

// ----------------------------------------------------------------------

export default function CalenderPage() {
  return (
    <>
      <Helmet>
        <title> Calender | AB NAIBI Admission </title>
      </Helmet>

      <CalenderView />
    </>
  );
}
