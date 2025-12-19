import { Helmet } from 'react-helmet-async';

import { InstructorView } from 'src/sections/instructor/view';

// ----------------------------------------------------------------------

export default function InstructorPage() {
  return (
    <>
      <Helmet>
        <title> Instructors | AB NAIBI Admission </title>
      </Helmet>

      <InstructorView />
    </>
  );
}
