import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { StudentView } from 'src/sections/student/view';

// ----------------------------------------------------------------------

export default function EnrollmentPage() {
  return (
    <>
      <Helmet>
        <title>Student | {config.appName}</title>
      </Helmet>

      <StudentView />
    </>
  );
}
