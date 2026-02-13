import { useState, useMemo, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Card,
  Stack,
  Select,
  MenuItem,
  Container,
  Typography,
  InputLabel,
  FormControl,
  TextField,
} from '@mui/material';

import { ResultApi, programApi, classLevelApi, courseApi } from 'src/api';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

function buildRowsFromResponse(students) {
  if (!students || !Array.isArray(students)) return [];
  return students.map((s) => ({
    studentId: s.studentId,
    regNumber: s.regNumber || '',
    name: s.name || '—',
    scores: (s.scores || []).reduce((acc, { assessmentId, score }) => {
      const id = assessmentId?._id?.toString?.() || assessmentId?.toString?.();
      if (id != null) acc[id] = score != null ? String(score) : '';
      return acc;
    }, {}),
  }));
}

export default function AssessmentSheetView() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [programId, setProgramId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [classLevelId, setClassLevelId] = useState('');
  const [sheetData, setSheetData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [columnPinning, setColumnPinning] = useState({
    left: ['regNumber', 'name'],
  });

  const { data: programOptions } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
  });
  const { data: classLevelOptions } = useQuery({
    queryKey: ['classLevels'],
    queryFn: classLevelApi.getClassLevels,
  });
  const { data: courseOptions } = useQuery({
    queryKey: ['courses'],
    queryFn: courseApi.getCourses,
  });

  const programList = useMemo(() => (Array.isArray(programOptions) ? programOptions : []), [programOptions]);
  const classLevelList = useMemo(() => (Array.isArray(classLevelOptions) ? classLevelOptions : []), [classLevelOptions]);
  const courseList = useMemo(() => (Array.isArray(courseOptions) ? courseOptions : []), [courseOptions]);

  const canLoad = Boolean(programId && courseId && classLevelId);

  const loadSheet = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setSheetData(null);
    setRows([]);
    try {
      const data = await ResultApi.getAssessmentSheet({ programId, courseId, classLevelId });
      setSheetData(data);
      setRows(buildRowsFromResponse(data?.students));
    } catch (err) {
      enqueueSnackbar(err?.message || 'Failed to load assessment sheet', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [programId, courseId, classLevelId, canLoad, enqueueSnackbar]);

  const saveMutation = useMutation({
    mutationFn: (payload) => ResultApi.saveAssessmentSheet(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores-by-assessment'] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      enqueueSnackbar('Scores saved successfully', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err?.message || 'Failed to save scores', { variant: 'error' });
    },
  });

  const handleCellChange = useCallback((rowIndex, assessmentId, value) => {
    setRows((prev) => {
      const next = prev.map((r, i) =>
        i === rowIndex ? { ...r, scores: { ...r.scores, [assessmentId]: value } } : r
      );
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!sheetData?.sessionId || !courseId || !rows.length) {
      enqueueSnackbar('Load data first and ensure course is selected', { variant: 'warning' });
      return;
    }
    const assessments = sheetData.assessments || [];
    const payload = {
      sessionId: sheetData.sessionId,
      courseId,
      rows: rows.map((r) => ({
        studentId: r.studentId,
        assessmentScores: assessments.map((a) => {
          const id = a._id?.toString?.() || a._id;
          const raw = r.scores[id];
          const score = raw === '' || raw == null ? 0 : Number(raw);
          return { assessmentId: id, score: Number.isNaN(score) ? 0 : score };
        }),
      })),
    };
    saveMutation.mutate(payload);
  }, [sheetData, courseId, rows, enqueueSnackbar, saveMutation]);

  const assessments = useMemo(() => sheetData?.assessments ?? [], [sheetData?.assessments]);

  const columns = useMemo(() => {
    const studentColumns = [
      {
        accessorKey: 'regNumber',
        header: 'Reg No',
        size: 120,
        cell: ({ getValue }) => (
          <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
            {getValue() || '—'}
          </Box>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 180,
        cell: ({ getValue }) => (
          <Box component="span" sx={{ fontSize: '0.8125rem', display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getValue() || '—'}
          </Box>
        ),
      },
    ];

    const scoreColumns = assessments.map((a) => {
      const id = a._id?.toString?.() || a._id;
      const maxScore = a.maxScore ?? 100;
      return {
        id,
        accessorFn: (row) => row.scores?.[id] ?? '',
        header: () => (
          <Box sx={{ textAlign: 'center' }}>
            <Box component="span" sx={{ fontWeight: 600, fontSize: '0.75rem', display: 'block' }} title={a.name}>
              {a.name || a.type || '—'}
            </Box>
            <Box component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>/ {maxScore}</Box>
          </Box>
        ),
        size: 100,
        meta: { maxScore },
        cell: ({ row, column }) => {
          const assessmentId = column.id;
          const max = column.columnDef.meta?.maxScore ?? 100;
          return (
            <TextField
              size="small"
              type="number"
              inputProps={{ min: 0, max, step: 0.01 }}
              value={row.original.scores?.[assessmentId] ?? ''}
              onChange={(e) => handleCellChange(row.index, assessmentId, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              sx={{ width: 72, '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8125rem' } }}
              variant="outlined"
            />
          );
        },
      };
    });

    return [
      {
        id: 'student-group',
        header: 'Student',
        columns: studentColumns,
      },
      ...(scoreColumns.length > 0
        ? [
            {
              id: 'scores-group',
              header: 'Scores',
              columns: scoreColumns,
            },
          ]
        : []),
    ];
  }, [assessments, handleCellChange]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.studentId?.toString?.() ?? String(rows.indexOf(row)),
    state: { columnPinning },
    onColumnPinningChange: setColumnPinning,
  });

  const getHeaderBg = (header) => {
    const colId = header.column.id;
    if (colId === 'regNumber' || colId === 'name' || colId === 'student-group') return 'grey.200';
    return 'primary.lighter';
  };

  const getCellBg = (column) => {
    const colId = column.id;
    if (colId === 'regNumber' || colId === 'name') return 'grey.50';
    return 'background.paper';
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight={700}>
              Assessment scores
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Select program, course, and class, then Load to view and edit scores
            </Typography>
          </Box>
        </Box>

        <Card sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Program</InputLabel>
              <Select
                value={programId}
                label="Program"
                onChange={(e) => setProgramId(e.target.value)}
              >
                <MenuItem value="">Select program</MenuItem>
                {programList.map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.name || p.code || p._id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Course</InputLabel>
              <Select
                value={courseId}
                label="Course"
                onChange={(e) => setCourseId(e.target.value)}
              >
                <MenuItem value="">Select course</MenuItem>
                {courseList.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name || c.code || c._id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Class</InputLabel>
              <Select
                value={classLevelId}
                label="Class"
                onChange={(e) => setClassLevelId(e.target.value)}
              >
                <MenuItem value="">Select class</MenuItem>
                {classLevelList.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.name || c._id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <LoadingButton
              variant="contained"
              onClick={loadSheet}
              loading={loading}
              disabled={!canLoad}
              startIcon={<Iconify icon="eva:refresh-fill" />}
            >
              Load
            </LoadingButton>
            <Can anyOf={['add_score', 'edit_score']}>
              <LoadingButton
                variant="contained"
                color="primary"
                onClick={handleSave}
                loading={saveMutation.isPending}
                disabled={!sheetData?.students?.length}
                startIcon={<Iconify icon="eva:save-fill" />}
              >
                Save
              </LoadingButton>
            </Can>
          </Stack>
          {sheetData?.students?.length != null && sheetData.students.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {sheetData.students.length} student(s) · {assessments.length} assessment(s)
            </Typography>
          )}
        </Card>

        <Card
          variant="outlined"
          sx={{
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ maxHeight: 'calc(100vh - 340px)', overflow: 'auto' }}>
            <Box
              component="table"
              sx={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                '& th, & td': {
                  borderRight: '1px solid',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  py: 0.5,
                  px: 1,
                  fontSize: '0.8125rem',
                },
              }}
            >
              <Box component="thead" sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: 'background.paper' }}>
                {table.getHeaderGroups().map((headerGroup) => (
                  <Box component="tr" key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const isPinned = header.column.getIsPinned();
                      const pinLeft = isPinned === 'left' ? header.column.getStart('left') : undefined;
                      const isGroupStudent = header.column.id === 'student-group' && header.depth === 0;
                      const bg = getHeaderBg(header);
                      return (
                        <Box
                          component="th"
                          key={header.id}
                          colSpan={header.colSpan}
                          sx={{
                            minWidth: header.colSpan > 1 ? (header.column.getSize?.() ?? 300) : (header.column.getSize?.() ?? 80),
                            width: header.colSpan === 1 ? header.getSize() : undefined,
                            fontWeight: 700,
                            textAlign: header.id === 'regNumber' ? 'left' : 'center',
                            bgcolor: bg,
                            position: isPinned || isGroupStudent ? 'sticky' : 'relative',
                            left: pinLeft ?? (isGroupStudent ? 0 : undefined),
                            zIndex: isPinned || isGroupStudent ? 3 : 1,
                            boxShadow: isPinned || isGroupStudent ? (theme) => `2px 0 4px -2px ${theme.palette.divider}` : 'none',
                          }}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
              <Box component="tbody">
                {table.getRowModel().rows.map((row) => (
                  <Box
                    component="tr"
                    key={row.id}
                    sx={{
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const isPinned = cell.column.getIsPinned();
                      const pinLeft = isPinned === 'left' ? cell.column.getStart('left') : undefined;
                      const bg = getCellBg(cell.column);
                      return (
                        <Box
                          component="td"
                          key={cell.id}
                          sx={{
                            minWidth: cell.column.getSize?.() ?? 80,
                            width: cell.column.getSize?.(),
                            textAlign: cell.column.id === 'regNumber' ? 'left' : 'center',
                            bgcolor: bg,
                            position: isPinned ? 'sticky' : 'relative',
                            left: pinLeft,
                            zIndex: isPinned ? 1 : 0,
                            boxShadow: isPinned ? (theme) => `2px 0 4px -2px ${theme.palette.divider}` : 'none',
                          }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
          {(!rows || rows.length === 0) && !loading && (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {canLoad ? 'Click Load to fetch students and assessments' : 'Select program, course, and class, then click Load'}
              </Typography>
            </Box>
          )}
        </Card>
      </Box>
    </Container>
  );
}
