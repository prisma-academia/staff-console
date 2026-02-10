import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { AssessmentApi } from 'src/api';

import { EnterScoresPageView } from 'src/sections/assessment/enter-scores';

// ----------------------------------------------------------------------

export default function AssessmentEnterScoresPage() {
  const { assessmentId } = useParams();
  const { data: assessment } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => AssessmentApi.getAssessmentById(assessmentId),
    enabled: !!assessmentId,
  });

  const title = assessment?.name
    ? `Enter Scores — ${assessment.name}`
    : 'Enter Scores';

  return (
    <>
      <Helmet>
        <title>{title} | AB NAIBI Admission</title>
      </Helmet>
      <EnterScoresPageView assessmentId={assessmentId} />
    </>
  );
}
