import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';

import { Box, Container, Typography } from '@mui/material';

import config from 'src/config';

import Can from 'src/components/permission/can';

import { ScoreSheetView } from 'src/sections/assessment/view';

// ----------------------------------------------------------------------

export default function AssessmentScoresPage() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId') || null;
  const sessionId = searchParams.get('sessionId') || null;

  return (
    <>
      <Helmet>
        <title>Score sheet | {config.appName}</title>
      </Helmet>
      <Can
        do="view_assessment_scores"
        fallback={
          <Container maxWidth="md">
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                You don&apos;t have permission to view the score sheet.
              </Typography>
            </Box>
          </Container>
        }
      >
        <Container maxWidth="xl">
          <Box sx={{ pb: 5, pt: 4 }}>
            <ScoreSheetView initialCourseId={courseId} initialSessionId={sessionId} />
          </Box>
        </Container>
      </Can>
    </>
  );
}
