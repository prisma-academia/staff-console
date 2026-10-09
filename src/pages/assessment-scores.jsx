import { Helmet } from 'react-helmet-async';

import { Box, Container, Typography } from '@mui/material';

import config from 'src/config';
import { PERMISSIONS } from 'src/permissions/constants';

import Can from 'src/components/permission/can';

import { ScoreSheetView } from 'src/sections/assessment/view';

// ----------------------------------------------------------------------

export default function AssessmentScoresPage() {
  return (
    <>
      <Helmet>
        <title>Score entry | {config.appName}</title>
      </Helmet>
      <Can
        do={PERMISSIONS.VIEW_ASSESSMENT_SCORES}
        fallback={
          <Container maxWidth="md">
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                You don&apos;t have permission to view score sheets.
              </Typography>
            </Box>
          </Container>
        }
      >
        <ScoreSheetView />
      </Can>
    </>
  );
}
