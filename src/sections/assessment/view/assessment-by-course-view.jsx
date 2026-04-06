import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';

import { Box, Button, MenuItem, Container, TextField, Typography } from '@mui/material';

import { PERMISSIONS } from 'src/permissions/constants';
import { courseApi, SessionApi, programApi } from 'src/api';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import AssessmentsTable from './assessments-table';

// ----------------------------------------------------------------------

export default function AssessmentByCourseView({ courseId }) {
  const [sessionId, setSessionId] = useState('');
  const [programId, setProgramId] = useState('');

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => SessionApi.getSessions(),
  });
  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => programApi.getPrograms(),
  });
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: courseApi.getCourses,
    enabled: Boolean(courseId),
  });

  const sessionList = Array.isArray(sessions) ? sessions : [];
  const programList = Array.isArray(programs) ? programs : [];
  const courseList = useMemo(() => (Array.isArray(courses) ? courses : []), [courses]);
  const course = useMemo(
    () => (courseId ? courseList.find((c) => c._id === courseId) ?? null : null),
    [courseId, courseList]
  );
  const title = course?.name || course?.code || 'Course assessments';

  const hasContext = Boolean(sessionId && programId && courseId);

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Button
            component={RouterLink}
            to="/assessment"
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
          >
            Back to assessments
          </Button>
          {hasContext && (
            <Can do={PERMISSIONS.VIEW_ASSESSMENT_SCORES}>
              <Button
                component={RouterLink}
                to={`/assessment/scores?courseId=${encodeURIComponent(courseId)}&sessionId=${encodeURIComponent(sessionId)}`}
                variant="contained"
                startIcon={<Iconify icon="eva:edit-2-fill" />}
              >
                Enter scores for this course
              </Button>
            </Can>
          )}
        </Box>

        <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
          {title}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
            Context
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <TextField
              select
              label="Session"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Select session</MenuItem>
              {sessionList.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.name || s.code || s._id}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Program"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="">Select program</MenuItem>
              {programList.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.name || p.code || p._id}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Course: {course?.name || course?.code || courseId}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
            Assessments list
          </Typography>
          <AssessmentsTable
            sessionId={sessionId || undefined}
            programId={programId || undefined}
            courseId={courseId || undefined}
          />
        </Box>
      </Box>
    </Container>
  );
}

AssessmentByCourseView.propTypes = {
  courseId: PropTypes.string.isRequired,
};

