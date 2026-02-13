import { Helmet } from 'react-helmet-async';
import { Link as RouterLink } from 'react-router-dom';

import { Box, Button, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';
import { AssessmentSheetView } from 'src/sections/assessment/view';

// ----------------------------------------------------------------------

export default function AssessmentPage() {
  return (
    <>
      <Helmet>
        <title>Assessments | AB NAIBI Admission</title>
      </Helmet>
      <Box sx={{ mb: 2 }}>
        <Button
          component={RouterLink}
          to="/assessment/courses"
          variant="outlined"
          startIcon={<Iconify icon="eva:list-fill" />}
          sx={{ mr: 2 }}
        >
          Manage assessments by course
        </Button>
        <Typography component="span" variant="body2" color="text.secondary">
          Add or edit assessments, then enter scores below
        </Typography>
      </Box>
      <AssessmentSheetView />
    </>
  );
}
