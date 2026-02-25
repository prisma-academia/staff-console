import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { InstructorView } from 'src/sections/instructor/view';

// ----------------------------------------------------------------------

export default function InstructorPage() {
  return (
    <>
      <Helmet>
        <title>Instructors | {config.appName}</title>
      </Helmet>

      <InstructorView />
    </>
  );
}
