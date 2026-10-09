import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { AssessmentHubView } from 'src/sections/assessment/view';

// ----------------------------------------------------------------------

export default function AssessmentPage() {
  return (
    <>
      <Helmet>
        <title>Assessments | {config.appName}</title>
      </Helmet>
      <AssessmentHubView />
    </>
  );
}
