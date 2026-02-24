import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link as RouterLink } from 'react-router-dom';

import {
  Box,
  Card,
  Grid,
  MenuItem,
  Container,
  TextField,
  Typography,
  CardActionArea,
} from '@mui/material';

import { courseApi, SessionApi, programApi } from 'src/api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function AssessmentCoursesView() {
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
    queryFn: () => courseApi.getCourses(),
  });

  const sessionList = Array.isArray(sessions) ? sessions : [];
  const programList = Array.isArray(programs) ? programs : [];
  const courseList = useMemo(() => (Array.isArray(courses) ? courses : []), [courses]);
  const coursesForProgram = useMemo(() => {
    if (!programId) return [];
    return courseList.filter((c) =>
      (c.programs || []).some((p) => (typeof p === 'object' ? p?._id : p) === programId)
    );
  }, [courseList, programId]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ pb: 5, pt: 2 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          Assessments by course
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Select session and program, then choose a course to view and manage its assessments on the main assessment page.
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <TextField
            select
            label="Session"
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);
              setProgramId('');
            }}
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
            disabled={!sessionId}
          >
            <MenuItem value="">Select program</MenuItem>
            {programList.map((p) => (
              <MenuItem key={p._id} value={p._id}>
                {p.name || p.code || p._id}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {!programId ? (
          <Typography variant="body2" color="text.secondary">
            Select session and program to see courses.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {coursesForProgram.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  No courses found for this program.
                </Typography>
              </Grid>
            ) : (
              coursesForProgram.map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course._id}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardActionArea
                      component={RouterLink}
                      to={`/assessment?sessionId=${encodeURIComponent(sessionId)}&programId=${encodeURIComponent(programId)}&courseId=${encodeURIComponent(course._id)}`}
                      sx={{ p: 2 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: 'grey.200',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Iconify icon="eva:book-fill" sx={{ color: 'text.secondary', fontSize: 28 }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" fontWeight={600} noWrap>
                            {course.name || course.code || course._id}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {course.code || course._id}
                          </Typography>
                        </Box>
                      </Box>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </Box>
    </Container>
  );
}
