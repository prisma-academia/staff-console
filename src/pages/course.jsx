import { Helmet } from 'react-helmet-async';

import { CourseView } from 'src/sections/course/view';

// ----------------------------------------------------------------------

export default function CoursePage() {
  return (
    <>
      <Helmet>
        <title> Courses | AB NAIBI Console </title>
      </Helmet>

      <CourseView />
    </>
  );
}
