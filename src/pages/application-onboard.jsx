import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import OnboardWizard from 'src/sections/application/onboard/onboard-wizard';

// ----------------------------------------------------------------------

export default function ApplicationOnboardPage() {
  return (
    <>
      <Helmet>
        <title>Onboard applicant | {config.appName}</title>
      </Helmet>

      <OnboardWizard />
    </>
  );
}
