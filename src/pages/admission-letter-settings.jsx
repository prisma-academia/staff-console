import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { AdmissionLetterSettingsView } from 'src/sections/admission-letter-settings/view';

// ----------------------------------------------------------------------

export default function AdmissionLetterSettingsPage() {
  return (
    <>
      <Helmet>
        <title>Admission Letter | {config.appName}</title>
      </Helmet>

      <AdmissionLetterSettingsView />
    </>
  );
}
