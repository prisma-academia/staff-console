import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  Box,
  Card,
  Stack,
  alpha,
  Button,
  useTheme,
  Container,
  Typography,
} from '@mui/material';

import { courseApi } from 'src/api';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import AddAssessment from '../add-assessment';

export default function AssessmentCoursesView() {
  const theme = useTheme();
  const [addOpen, setAddOpen] = useState(false);

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: courseApi.getCourses,
  });

  const courseList = Array.isArray(courses) ? courses : [];

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Assessments
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Select a course to view and manage its assessments
            </Typography>
          </Box>
          <Can do="add_assessment">
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setAddOpen(true)}
              sx={{
                px: 3,
                boxShadow: theme.customShadows?.primary,
                '&:hover': { boxShadow: 'none' },
              }}
            >
              Add Assessment
            </Button>
          </Can>
        </Box>

        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={2}>
          <Card
            component={Link}
            to="/assessment/course/global"
            sx={{
              p: 2,
              minWidth: 200,
              textDecoration: 'none',
              cursor: 'pointer',
              boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}`,
              '&:hover': {
                boxShadow: `0 4px 12px ${alpha(theme.palette.grey[500], 0.16)}`,
              },
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Global
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assessments not tied to a course
            </Typography>
            <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
              Show assessments →
            </Typography>
          </Card>
          {courseList.map((course) => (
            <Card
              key={course._id}
              component={Link}
              to={`/assessment/course/${course._id}`}
              sx={{
                p: 2,
                minWidth: 200,
                textDecoration: 'none',
                cursor: 'pointer',
                boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}`,
                '&:hover': {
                  boxShadow: `0 4px 12px ${alpha(theme.palette.grey[500], 0.16)}`,
                },
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {course.name || course.title || course.code || course._id}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {course.code ? `Code: ${course.code}` : 'Course'}
              </Typography>
              <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                Show assessments →
              </Typography>
            </Card>
          ))}
        </Stack>
        {!isLoading && courseList.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            No courses found. Add courses first, or use Global for assessments not tied to a course.
          </Typography>
        )}
      </Box>

      <AddAssessment open={addOpen} setOpen={setAddOpen} />
    </Container>
  );
}
