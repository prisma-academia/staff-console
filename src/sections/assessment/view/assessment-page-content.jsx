import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';

import { Box, Card, Stack, Button, MenuItem, Container, TextField, Typography } from '@mui/material';

import { courseApi, programApi, SessionApi } from 'src/api';

import Iconify from 'src/components/iconify';

import AddAssessment from '../add-assessment';
import AssessmentsTable from './assessments-table';

// ----------------------------------------------------------------------

export default function AssessmentPageContent() {
  const [searchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState(() => searchParams.get('sessionId') || '');
  const [programId, setProgramId] = useState(() => searchParams.get('programId') || '');
  const [courseId, setCourseId] = useState(() => searchParams.get('courseId') || '');
  const [appliedSessionId, setAppliedSessionId] = useState('');
  const [appliedProgramId, setAppliedProgramId] = useState('');
  const [appliedCourseId, setAppliedCourseId] = useState('');

  useEffect(() => {
    const s = searchParams.get('sessionId') || '';
    const p = searchParams.get('programId') || '';
    const c = searchParams.get('courseId') || '';
    if (s) setSessionId(s);
    if (p) setProgramId(p);
    if (c) setCourseId(c);
  }, [searchParams]);

  const hasContext = Boolean(programId && courseId);
  const handleLoad = () => {
    if (hasContext) {
      setAppliedSessionId(sessionId);
      setAppliedProgramId(programId);
      setAppliedCourseId(courseId);
    }
  };

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

  const [addOpen, setAddOpen] = useState(false);

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight={700}>
              Assessments
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Select program and course to view and manage assessment definitions.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => setAddOpen(true)}
          >
            Add assessment
          </Button>
        </Box>

        <Card sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center">
            <TextField
              select
              label="Session"
              value={sessionId}
              onChange={(e) => {
                setSessionId(e.target.value);
                setProgramId('');
                setCourseId('');
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
              onChange={(e) => {
                setProgramId(e.target.value);
                setCourseId('');
              }}
              size="small"
              sx={{ minWidth: 200 }}
              disabled={false}
            >
              <MenuItem value="">Select program</MenuItem>
              {programList.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.name || p.code || p._id}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
              disabled={!programId}
            >
              <MenuItem value="">Select course</MenuItem>
              {coursesForProgram.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.name || c.code || c._id}
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ ml: 'auto' }}>
              <Button
                variant="contained"
                onClick={handleLoad}
                disabled={!hasContext}
                startIcon={<Iconify icon="eva:refresh-fill" />}
              >
                Load
              </Button>
            </Box>
          </Stack>
        </Card>

        <Box>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
            Assessments list
          </Typography>
          <AssessmentsTable
            sessionId={appliedSessionId || undefined}
            programId={appliedProgramId || undefined}
            courseId={appliedCourseId || undefined}
            addOpen={addOpen}
            setAddOpen={setAddOpen}
          />
        </Box>
        <AddAssessment
          open={addOpen}
          setOpen={setAddOpen}
          sessionId={sessionId || undefined}
          programId={programId || undefined}
          courseId={courseId || undefined}
        />
      </Box>
    </Container>
  );
}
