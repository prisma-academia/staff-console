import { Helmet } from 'react-helmet-async';
import { Link as RouterLink } from 'react-router-dom';

import { Box, Button } from '@mui/material';

import Iconify from 'src/components/iconify';
import { AssessmentCoursesView } from 'src/sections/assessment/view';

// ----------------------------------------------------------------------

export default function AssessmentCoursesPage() {
  return (
    <>
      <Helmet>
        <title>Manage assessments by course | AB NAIBI Admission</title>
      </Helmet>
      <Box sx={{ mb: 2 }}>
        <Button
          component={RouterLink}
          to="/assessment"
          variant="outlined"
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
        >
          Back to assessment scores
        </Button>
      </Box>
      <AssessmentCoursesView />
    </>
  );
}
