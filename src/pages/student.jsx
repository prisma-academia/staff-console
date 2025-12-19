import { Helmet } from 'react-helmet-async';

import { StudentView } from 'src/sections/student/view';

// ----------------------------------------------------------------------

export default function EnrollmentPage() {
  return (
    <>
      <Helmet>
        <title> Student | AB NAIBI Admission</title>
      </Helmet>

      <StudentView />
    </>
  );
}
