import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { AssessmentByCourseView } from 'src/sections/assessment/view';

// ----------------------------------------------------------------------

export default function AssessmentCoursePage() {
  const { courseId } = useParams();

  return (
    <>
      <Helmet>
        <title>
          {courseId === 'global' ? 'Global assessments' : 'Course assessments'} | AB NAIBI Admission
        </title>
      </Helmet>
      <AssessmentByCourseView courseId={courseId || 'global'} />
    </>
  );
}
