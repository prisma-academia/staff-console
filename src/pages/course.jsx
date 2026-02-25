import { Helmet } from 'react-helmet-async';

import config from 'src/config';

import { CourseView } from 'src/sections/course/view';

// ----------------------------------------------------------------------

export default function CoursePage() {
  return (
    <>
      <Helmet>
        <title>Courses | {config.appName}</title>
      </Helmet>

      <CourseView />
    </>
  );
}
