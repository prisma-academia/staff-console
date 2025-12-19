import { Helmet } from 'react-helmet-async';

import { AdmissionView } from 'src/sections/admission/view';

// ----------------------------------------------------------------------

export default function ProfilerPage() {
  return (
    <>
      <Helmet>
        <title> Admission | AB NAIBI Admission </title>
      </Helmet>

      <AdmissionView />
    </>
  );
}
