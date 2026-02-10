import { Helmet } from 'react-helmet-async';

import { AssessmentCoursesView } from 'src/sections/assessment/view';

// ----------------------------------------------------------------------

export default function AssessmentPage() {
  return (
    <>
      <Helmet>
        <title>Assessments | AB NAIBI Admission</title>
      </Helmet>

      <AssessmentCoursesView />
    </>
  );
}
