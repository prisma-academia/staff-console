import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
} from '@tanstack/react-table';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Card,
  Stack,
  Select,
  MenuItem,
  TextField,
  Typography,
  InputLabel,
  FormControl,
} from '@mui/material';

import { courseApi, SessionApi, AssessmentApi } from 'src/api';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

function buildRowsFromResponse(students) {
  if (!students || !Array.isArray(students)) return [];
  return students.map((s) => {
    const scoresMap = (s.scores || []).reduce((acc, item) => {
      const id = item.assessmentId?._id?.toString?.() ?? item.assessmentId?.toString?.();
      if (id != null) acc[id] = item.score != null ? String(item.score) : '';
      return acc;
    }, {});
    return {
      studentId: s.studentId,
      regNumber: s.regNumber || '',
      name: s.name || '—',
      scores: scoresMap,
    };
  });
}

export default function ScoreSheetView({ initialCourseId = null, initialSessionId = null }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [courseId, setCourseId] = useState(initialCourseId || '');
  const [sessionId, setSessionId] = useState(initialSessionId || '');
  const [sheetData, setSheetData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loadState, setLoadState] = useState('idle'); // idle | loading | loaded

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => SessionApi.getSessions(),
  });
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: courseApi.getCourses,
  });

  const sessions = useMemo(() => (Array.isArray(sessionsData) ? sessionsData : []), [sessionsData]);
  const courses = useMemo(() => (Array.isArray(coursesData) ? coursesData : []), [coursesData]);

  const canLoad = Boolean(courseId);

  const loadSheet = useCallback(async () => {
    if (!courseId) return;
    setLoadState('loading');
    setSheetData(null);
    setRows([]);
    try {
      const params = { courseId };
      if (sessionId) params.sessionId = sessionId;
      const data = await AssessmentApi.getScoreSheet(params);
      setSheetData(data);
      setRows(buildRowsFromResponse(data?.students));
      setLoadState('loaded');
    } catch (err) {
      setLoadState('idle');
      enqueueSnackbar(err?.message || 'Failed to load score sheet', { variant: 'error' });
    }
  }, [courseId, sessionId, enqueueSnackbar]);

  const saveMutation = useMutation({
    mutationFn: (payload) => AssessmentApi.saveScoreSheet(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      enqueueSnackbar('Scores saved successfully', { variant: 'success' });
    },
    onError: (err) => {
      enqueueSnackbar(err?.message || 'Failed to save scores', { variant: 'error' });
    },
  });

  const handleCellChange = useCallback((rowIndex, assessmentId, value) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIndex ? { ...r, scores: { ...r.scores, [assessmentId]: value } } : r
      )
    );
  }, []);

  const handleSave = useCallback(() => {
    const sid = sheetData?.session?.id ?? sheetData?.session?._id ?? sessionId;
    if (!sid) {
      enqueueSnackbar('Session is required to save. Load with a session selected.', { variant: 'warning' });
      return;
    }
    if (!sid || !courseId || !rows.length) {
      enqueueSnackbar('Load data first and ensure session and course are set', { variant: 'warning' });
      return;
    }
    const assessments = sheetData?.assessments ?? [];
    const payload = {
      sessionId: sid,
      courseId,
      rows: rows.map((r) => ({
        studentId: r.studentId,
        assessmentScores: assessments.map((a) => {
          const id = a._id?.toString?.() ?? a._id;
          const raw = r.scores[id];
          const score = raw === '' || raw == null ? 0 : Number(raw);
          return { assessmentId: id, score: Number.isNaN(score) ? 0 : score };
        }),
      })),
    };
    saveMutation.mutate(payload);
  }, [sheetData, courseId, sessionId, rows, enqueueSnackbar, saveMutation]);

  const assessments = useMemo(() => sheetData?.assessments ?? [], [sheetData?.assessments]);

  const columnPinning = useMemo(
    () => ({
      left: ['regNumber', 'name'],
    }),
    []
  );

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
          <Box
            component="span"
            sx={{
              fontSize: '0.8125rem',
              display: 'block',
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {getValue() || '—'}
          </Box>
        ),
      },
    ];

    const scoreColumns = assessments.map((a) => {
      const id = a._id?.toString?.() ?? a._id;
      const maxScore = a.maxScore ?? 100;
      return {
        id,
        accessorFn: (row) => row.scores?.[id] ?? '',
        header: () => (
          <Box sx={{ textAlign: 'center' }}>
            <Box component="span" sx={{ fontWeight: 600, fontSize: '0.75rem', display: 'block' }} title={a.type}>
              {a.type || '—'}
            </Box>
            <Box component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              / {maxScore}
            </Box>
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
              sx={{
                width: 72,
                '& .MuiInputBase-input': { py: 0.5, fontSize: '0.8125rem' },
              }}
              variant="outlined"
            />
          );
        },
      };
    });

    return [
      {
        id: 'student-group',
        header: () => (
          <Box component="span" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
            Student
          </Box>
        ),
        columns: studentColumns,
      },
      ...(scoreColumns.length > 0
        ? [
            {
              id: 'scores-group',
              header: () => (
                <Box component="span" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Scores
                </Box>
              ),
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
    onColumnPinningChange: () => {},
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
    <Card sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
        Score sheet
      </Typography>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2} sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Session</InputLabel>
          <Select
            value={sessionId}
            label="Session"
            onChange={(e) => setSessionId(e.target.value)}
          >
            <MenuItem value="">Current / latest</MenuItem>
            {sessions.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {s.name || s.code || s._id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 220 }} required>
          <InputLabel>Course</InputLabel>
          <Select
            value={courseId}
            label="Course"
            onChange={(e) => setCourseId(e.target.value)}
          >
            <MenuItem value="">Select course</MenuItem>
            {courses.map((c) => (
              <MenuItem key={c._id} value={c._id}>
                {c.name || c.code || c._id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Can do="view_assessment_scores">
          <LoadingButton
            variant="contained"
            onClick={loadSheet}
            loading={loadState === 'loading'}
            disabled={!canLoad}
            startIcon={<Iconify icon="eva:refresh-fill" />}
          >
            Load
          </LoadingButton>
        </Can>
        <Can do="edit_assessment_scores">
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
      {loadState === 'loaded' && sheetData?.students?.length != null && sheetData.students.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {sheetData.students.length} student(s) · {assessments.length} assessment(s)
        </Typography>
      )}

      <Box
        sx={{
          overflow: 'auto',
          maxHeight: 'calc(100vh - 380px)',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
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
                  const isGroupStudent =
                    header.column.id === 'student-group' && header.depth === 0;
                  const bg = getHeaderBg(header);
                  return (
                    <Box
                      component="th"
                      key={header.id}
                      colSpan={header.colSpan}
                      rowSpan={header.rowSpan}
                      sx={{
                        minWidth:
                          header.colSpan > 1
                            ? header.column.getSize?.() ?? 300
                            : header.column.getSize?.() ?? 80,
                        width: header.colSpan === 1 ? header.getSize() : undefined,
                        fontWeight: 700,
                        textAlign: header.column.id === 'regNumber' ? 'left' : 'center',
                        bgcolor: bg,
                        position: isPinned || isGroupStudent ? 'sticky' : 'relative',
                        left: pinLeft ?? (isGroupStudent ? 0 : undefined),
                        zIndex: isPinned || isGroupStudent ? 3 : 1,
                        boxShadow:
                          isPinned || isGroupStudent
                            ? (theme) => `2px 0 4px -2px ${theme.palette.divider}`
                            : 'none',
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
      {(!rows || rows.length === 0) && loadState !== 'loading' && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {canLoad
              ? 'Click Load to fetch students and assessments for the selected course.'
              : 'Select course (and optionally session), then click Load.'}
          </Typography>
        </Box>
      )}
    </Card>
  );
}

ScoreSheetView.propTypes = {
  initialCourseId: PropTypes.string,
  initialSessionId: PropTypes.string,
};
