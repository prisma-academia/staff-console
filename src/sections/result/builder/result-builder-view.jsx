import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Card,
  Stack,
  Table,
  Button,
  Select,
  TableRow,
  MenuItem,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  InputLabel,
  FormControl,
  TableContainer,
} from '@mui/material';

import {
  ResultApi,
  SessionApi,
  programApi,
  classLevelApi,
} from 'src/api';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

const SEMESTERS = [
  { id: 'First Semester', name: 'First Semester' },
  { id: 'Second Semester', name: 'Second Semester' },
];

const GRADES = ['A', 'B', 'C', 'D', 'E', 'F'];

const GRADE_BG = {
  A: 'success.lighter',
  B: 'info.lighter',
  C: 'warning.lighter',
  D: 'warning.lighter',
  E: 'error.lighter',
  F: 'error.lighter',
};

const STICKY_HEADER = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  bgcolor: 'grey.100',
  fontWeight: 700,
  minWidth: 90,
  borderBottom: '1px solid',
  borderColor: 'divider',
};

const STICKY_CELL = (left, zIndex = 1) => ({
  position: 'sticky',
  left,
  zIndex,
  bgcolor: 'background.paper',
  borderRight: '1px solid',
  borderColor: 'divider',
  minWidth: 90,
});

export default function ResultBuilderView() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [classId, setClassId] = useState('');
  const [programId, setProgramId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [builderData, setBuilderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data: classLevelOptions } = useQuery({
    queryKey: ['classLevels'],
    queryFn: classLevelApi.getClassLevels,
  });
  const { data: programOptions } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });
  const { data: sessionOptions } = useQuery({
    queryKey: ['sessions'],
    queryFn: SessionApi.getSessions,
  });

  const loadBuilder = async () => {
    if (!classId || !programId || !sessionId || !semester) {
      enqueueSnackbar('Please select class, program, session, and semester', { variant: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const data = await ResultApi.getBuilder({
        classId,
        programId,
        sessionId,
        semester,
      });
      setBuilderData(data);
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to load builder data', { variant: 'error' });
      setBuilderData(null);
    } finally {
      setLoading(false);
    }
  };

  const updateCourseCell = (studentIndex, courseIndex, field, value) => {
    setBuilderData((prev) => {
      if (!prev?.students) return prev;
      const next = { ...prev, students: [...prev.students] };
      const student = { ...next.students[studentIndex], courses: [...next.students[studentIndex].courses] };
      const course = { ...student.courses[courseIndex], [field]: value };
      student.courses[courseIndex] = course;
      next.students[studentIndex] = student;
      return next;
    });
  };

  const getDisplayScore = (course) => course.finalScore ?? course.calculatedScore ?? '';
  const getDisplayGrade = (course) => course.finalGrade ?? course.calculatedGrade ?? '';

  const handleSaveAll = async () => {
    if (!builderData?.students?.length || !sessionId || !semester || !year) {
      enqueueSnackbar('Load builder data and ensure session, semester, and year are set', {
        variant: 'warning',
      });
      return;
    }
    setSaving(true);
    try {
      const resultsData = [];
      builderData.students.forEach((stu) => {
        (stu.courses || []).forEach((co) => {
          const score = co.finalScore ?? co.calculatedScore;
          const grade = co.finalGrade ?? co.calculatedGrade;
          if (score != null && grade) {
            resultsData.push({
              studentId: stu.studentId,
              courseId: co.courseId,
              score: Number(score),
              grade: String(grade),
              remark: co.remark || undefined,
            });
          }
        });
      });
      if (resultsData.length === 0) {
        enqueueSnackbar('No results to save. Enter scores and grades in the grid.', { variant: 'info' });
        setSaving(false);
        return;
      }
      await ResultApi.bulkSave({
        resultsData,
        sessionId,
        semester,
        year: Number(year),
      });
      enqueueSnackbar(`Saved ${resultsData.length} result(s)`, { variant: 'success' });
      loadBuilder();
    } catch (err) {
      enqueueSnackbar(err.message || 'Failed to save results', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!sessionId) {
      enqueueSnackbar('Select session and load data first', { variant: 'warning' });
      return;
    }
    setExporting(true);
    try {
      const params = { format: 'xlsx', sessionId };
      if (programId) params.programId = programId;
      if (classId) params.classLevelId = classId;
      if (semester) params.semester = semester;
      const blob = await ResultApi.exportResults(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results-export-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      enqueueSnackbar('Export downloaded', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message || 'Export failed', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    navigate('/result');
    enqueueSnackbar('Open Add result / Download template from the Results page', { variant: 'info' });
  };

  const classLevelSelectData = useMemo(
    () => (classLevelOptions || []).map((c) => ({ _id: c._id, name: c.name || c._id })),
    [classLevelOptions]
  );
  const programSelectData = useMemo(
    () => (programOptions || []).map((p) => ({ _id: p._id, name: p.name || p.code || p._id })),
    [programOptions]
  );
  const sessionSelectData = useMemo(
    () => (sessionOptions || []).map((s) => ({ _id: s._id, name: s.name || s.code || s._id })),
    [sessionOptions]
  );

  const students = useMemo(() => builderData?.students ?? [], [builderData]);
  const courseColumns = useMemo(() => {
    if (students.length === 0) return [];
    const first = students[0];
    return first?.courses ?? [];
  }, [students]);

  const canLoad = Boolean(classId && programId && sessionId && semester);

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2, pt: 4 }}>
        <Button
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
          onClick={() => navigate('/result')}
          variant="outlined"
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ flex: 1 }}>
          Result builder
        </Typography>
      </Stack>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Class level</InputLabel>
            <Select
              value={classId}
              label="Class level"
              onChange={(e) => setClassId(e.target.value)}
            >
              <MenuItem value="">Select</MenuItem>
              {classLevelSelectData.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Program</InputLabel>
            <Select
              value={programId}
              label="Program"
              onChange={(e) => setProgramId(e.target.value)}
            >
              <MenuItem value="">Select</MenuItem>
              {programSelectData.map((p) => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Session</InputLabel>
            <Select
              value={sessionId}
              label="Session"
              onChange={(e) => setSessionId(e.target.value)}
            >
              <MenuItem value="">Select</MenuItem>
              {sessionSelectData.map((s) => (
                <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Semester</InputLabel>
            <Select
              value={semester}
              label="Semester"
              onChange={(e) => setSemester(e.target.value)}
            >
              <MenuItem value="">Select</MenuItem>
              {SEMESTERS.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
            inputProps={{ min: 2000, max: 2100 }}
            sx={{ width: 100 }}
          />
          <LoadingButton
            variant="contained"
            onClick={loadBuilder}
            loading={loading}
            disabled={!canLoad}
            startIcon={<Iconify icon="eva:refresh-fill" />}
          >
            Load
          </LoadingButton>
          <Can anyOf={['add_result', 'edit_result']}>
            <LoadingButton
              variant="contained"
              color="primary"
              onClick={handleSaveAll}
              loading={saving}
              disabled={!builderData?.students?.length}
              startIcon={<Iconify icon="eva:save-fill" />}
            >
              Save all
            </LoadingButton>
          </Can>
          <Can anyOf={['export_result', 'view_result']}>
            <LoadingButton
              variant="outlined"
              onClick={handleExport}
              loading={exporting}
              disabled={!builderData}
              startIcon={<Iconify icon="eva:download-fill" />}
            >
              Export
            </LoadingButton>
          </Can>
          <Button
            variant="outlined"
            onClick={handleDownloadTemplate}
            startIcon={<Iconify icon="eva:file-text-fill" />}
          >
            Template
          </Button>
        </Stack>
        {builderData?.metadata && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {builderData.metadata.totalStudents ?? 0} students, {builderData.metadata.totalCourses ?? 0} courses
            {builderData.metadata.classLevel?.name && ` · ${builderData.metadata.classLevel.name}`}
            {builderData.metadata.program?.name && ` · ${builderData.metadata.program.name}`}
          </Typography>
        )}
      </Card>

      <Card sx={{ overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 340px)', overflow: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...STICKY_HEADER, left: 0, minWidth: 48, zIndex: 3 }}>#</TableCell>
                <TableCell sx={{ ...STICKY_HEADER, left: 48, minWidth: 110, zIndex: 3 }}>Reg No</TableCell>
                <TableCell sx={{ ...STICKY_HEADER, left: 158, minWidth: 160, zIndex: 3 }}>Name</TableCell>
                <TableCell sx={{ ...STICKY_HEADER, left: 318, minWidth: 64, zIndex: 3 }}>GPA</TableCell>
                <TableCell sx={{ ...STICKY_HEADER, left: 382, minWidth: 64, zIndex: 3 }}>CGPA</TableCell>
                {courseColumns.map((course, idx) => (
                  <React.Fragment key={course.courseId || idx}>
                    <TableCell
                      align="center"
                      sx={{ ...STICKY_HEADER, minWidth: 80 }}
                    >
                      {course.courseCode || course.courseName || 'Score'}
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ ...STICKY_HEADER, minWidth: 64 }}
                    >
                      Grade
                    </TableCell>
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((student, rowIndex) => (
                <TableRow key={student.studentId || rowIndex} hover>
                  <TableCell sx={{ ...STICKY_CELL(0), minWidth: 48 }}>{rowIndex + 1}</TableCell>
                  <TableCell sx={{ ...STICKY_CELL(48), minWidth: 110 }}>{student.regNumber || '—'}</TableCell>
                  <TableCell sx={{ ...STICKY_CELL(158), minWidth: 160 }}>{student.name || '—'}</TableCell>
                  <TableCell sx={{ ...STICKY_CELL(318), minWidth: 64 }}>{student.gpa ?? '—'}</TableCell>
                  <TableCell sx={{ ...STICKY_CELL(382), minWidth: 64 }}>{student.cgpa ?? '—'}</TableCell>
                  {(student.courses || []).map((course, colIndex) => {
                    const grade = getDisplayGrade(course);
                    const bg = GRADE_BG[grade] || 'grey.100';
                    return (
                      <React.Fragment key={course.courseId || colIndex}>
                        <TableCell
                          align="center"
                          sx={{ py: 0.25, bgcolor: bg }}
                        >
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0, max: 100, step: 0.5 }}
                            value={getDisplayScore(course)}
                            onChange={(e) =>
                              updateCourseCell(rowIndex, colIndex, 'finalScore', e.target.value)
                            }
                            variant="outlined"
                            sx={{ width: 72 }}
                          />
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ py: 0.25, bgcolor: bg }}
                        >
                          <Select
                            size="small"
                            value={getDisplayGrade(course)}
                            onChange={(e) =>
                              updateCourseCell(rowIndex, colIndex, 'finalGrade', e.target.value)
                            }
                            displayEmpty
                            sx={{ minWidth: 56, height: 40 }}
                          >
                            <MenuItem value="">—</MenuItem>
                            {GRADES.map((g) => (
                              <MenuItem key={g} value={g}>{g}</MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && students.length === 0 && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Select class, program, session, and semester, then click Load to see the grid.
            </Typography>
          </Box>
        )}
      </Card>
    </Container>
  );
}
