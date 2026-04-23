import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import StudentIntakeView from 'src/sections/student/intake/student-intake-view';

export default function StudentIntakePage() {
  return (
    <>
      <Helmet>
        <title>Student Intake | {config.appName}</title>
      </Helmet>

      <StudentIntakeView />
    </>
  );
}
