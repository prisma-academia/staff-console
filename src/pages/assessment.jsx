import { Helmet } from 'react-helmet-async';

import { AssessmentPageContent } from 'src/sections/assessment/view';

// ----------------------------------------------------------------------

export default function AssessmentPage() {
  return (
    <>
      <Helmet>
        <title>Assessments | AB NAIBI Admission</title>
      </Helmet>
      <AssessmentPageContent />
    </>
  );
}
