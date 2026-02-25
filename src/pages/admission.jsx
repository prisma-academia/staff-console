import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { AdmissionView } from 'src/sections/admission/view';

// ----------------------------------------------------------------------

export default function ProfilerPage() {
  return (
    <>
      <Helmet>
        <title>Admission | {config.appName}</title>
      </Helmet>

      <AdmissionView />
    </>
  );
}
