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
      grade: s.grade || '',
      position: s.position || '',
    };
  });
}

const tableStyles = {
  table: {
    borderCollapse: 'separate',
    borderSpacing: 0,
    width: 'max-content',
    minWidth: '100%',
    fontSize: '0.8125rem',
  },
  th: {
    borderRight: '1px solid #d4d4d4',
    borderBottom: '1px solid #d4d4d4',
    borderTop: '1px solid #d4d4d4',
    padding: '8px 12px',
    fontWeight: 600,
    textAlign: 'left',
    backgroundColor: '#f3f2f1',
    color: '#323130',
    boxSizing: 'border-box',
  },
  td: {
    borderRight: '1px solid #d4d4d4',
    borderBottom: '1px solid #d4d4d4',
    padding: '0',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  },
  tdText: {
    padding: '6px 12px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
    boxSizing: 'border-box',
  },
  thCenter: { textAlign: 'center', padding: '4px 2px' },
  tdCenter: { textAlign: 'center' },
  input: {
    width: '100%',
    height: '100%',
    minHeight: 32,
    padding: '0',
    margin: 0,
    fontSize: '0.8125rem',
    border: 'none',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',
    textAlign: 'center',
    display: 'block',
  },
  button: {
    margin: '4px',
    padding: '6px 12px',
    fontSize: '0.8125rem',
    border: '1px solid #1976d2',
    borderRadius: 4,
    backgroundColor: '#1976d2',
    color: '#fff',
    cursor: 'pointer',
    width: 'calc(100% - 8px)',
    boxSizing: 'border-box',
  },
  buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  headingBlock: { marginBottom: 16, textAlign: 'left' },
  heading: { margin: 0, fontSize: '1.25rem', fontWeight: 600 },
  subheading: { margin: '4px 0 0 0', fontSize: '0.875rem', color: '#666' },
  toolbar: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 },
  scrollWrap: { overflow: 'auto', maxHeight: 'calc(100vh - 380px)', borderLeft: '1px solid #d4d4d4', borderRadius: 4 },
  empty: { padding: 32, textAlign: 'center', color: '#666', fontSize: '0.875rem' },
};

export default function ScoreSheetView({ initialCourseId = null, initialSessionId = null }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [courseId, setCourseId] = useState(initialCourseId || '');
  const [sessionId, setSessionId] = useState(initialSessionId || '');
  const [sheetData, setSheetData] = useState(null);
  const [rows, setRows] = useState([]);
  const [loadState, setLoadState] = useState('idle');
  const [savingStudentId, setSavingStudentId] = useState(null);

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
    onSettled: () => {
      setSavingStudentId(null);
    },
  });

  const handleCellChange = useCallback((rowIndex, assessmentId, value) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === rowIndex ? { ...r, scores: { ...r.scores, [assessmentId]: value } } : r
      )
    );
  }, []);

  const handleSaveRow = useCallback(
    (row) => {
      const sid = sheetData?.session?.id ?? sheetData?.session?._id ?? sessionId;
      if (!sid) {
        enqueueSnackbar('Session is required to save. Load with a session selected.', { variant: 'warning' });
        return;
      }
      if (!courseId || !sheetData?.assessments?.length) {
        enqueueSnackbar('Load data first and ensure session and course are set', { variant: 'warning' });
        return;
      }
      const {assessments} = sheetData;
      const payload = {
        sessionId: sid,
        courseId,
        rows: [
          {
            studentId: row.studentId,
            assessmentScores: assessments.map((a) => {
              const id = a._id?.toString?.() ?? a._id;
              const raw = row.scores?.[id];
              const score = raw === '' || raw == null ? 0 : Number(raw);
              return { assessmentId: id, score: Number.isNaN(score) ? 0 : score };
            }),
          },
        ],
      };
      setSavingStudentId(row.studentId?.toString?.() ?? null);
      saveMutation.mutate(payload);
    },
    [sheetData, courseId, sessionId, enqueueSnackbar, saveMutation]
  );

  const assessments = useMemo(() => sheetData?.assessments ?? [], [sheetData?.assessments]);

  const columns = useMemo(() => {
    const studentInfoCols = [
      {
        accessorKey: 'regNumber',
        header: 'Reg No',
        size: 120,
        cell: ({ getValue }) => <div style={tableStyles.tdText}>{getValue() || '—'}</div>,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 180,
        cell: ({ getValue }) => {
          const v = getValue() || '—';
          return (
            <div style={tableStyles.tdText}>
              {v.length > 24 ? `${v.slice(0, 24)}…` : v}
            </div>
          );
        },
      },
    ];

    const scoreCols = assessments.map((a) => {
      const id = a._id?.toString?.() ?? a._id;
      const maxScore = a.maxScore ?? 100;
      return {
        id,
        accessorFn: (row) => row.scores?.[id] ?? '',
        header: () => (
          <div style={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={a.type || '—'}>
              {a.type || '—'}
            </div>
          </div>
        ),
        size: 50,
        meta: { maxScore },
        cell: ({ row, column }) => {
          const assessmentId = column.id;
          const max = column.columnDef.meta?.maxScore ?? 100;
          return (
            <input
              title={`Max score: ${max}`}
              type="number"
              min={0}
              max={max}
              step={0.01}
              value={row.original.scores?.[assessmentId] ?? ''}
              onChange={(e) => handleCellChange(row.index, assessmentId, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{ ...tableStyles.input }}
              onFocus={(e) => {
                e.target.style.outline = '2px solid #107c41';
                e.target.style.outlineOffset = '-2px';
              }}
              onBlur={(e) => {
                e.target.style.outline = 'none';
              }}
            />
          );
        },
      };
    });

    const gradePositionCols = [
      {
        accessorKey: 'grade',
        header: 'Grade',
        size: 80,
        cell: ({ getValue }) => <div style={tableStyles.tdText}>{getValue() || '—'}</div>,
      },
      {
        accessorKey: 'position',
        header: 'Position',
        size: 80,
        cell: ({ getValue }) => <div style={tableStyles.tdText}>{getValue() || '—'}</div>,
      },
    ];

    const saveCol = {
      id: 'save',
      header: 'Save',
      size: 90,
      cell: ({ row }) => {
        const studentIdStr = row.original.studentId?.toString?.();
        const isSaving = savingStudentId != null && savingStudentId === studentIdStr;
        return (
          <Can do="edit_assessment_scores">
            <button
              type="button"
              style={{ ...tableStyles.button, ...(isSaving ? tableStyles.buttonDisabled : {}) }}
              disabled={isSaving}
              onClick={() => handleSaveRow(row.original)}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </Can>
        );
      },
    };

    return [
      {
        id: 'studentInfo',
        header: 'Student Information',
        columns: studentInfoCols,
      },
      {
        id: 'subjectScore',
        header: 'Subject Score',
        columns: scoreCols.length ? scoreCols : [{ id: 'noScores', header: '—', size: 50 }],
      },
      {
        id: 'gradePosition',
        header: 'Grade and position',
        columns: gradePositionCols,
      },
      {
        id: 'actions',
        header: 'Actions',
        columns: [saveCol],
      },
    ];
  }, [assessments, handleCellChange, handleSaveRow, savingStudentId]);

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      columnPinning: {
        left: ['studentInfo'],
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.studentId?.toString?.() ?? String(rows.indexOf(row)),
  });

  const getHeaderStyle = (header) => {
    const {id} = header.column;
    const isGroup = header.subHeaders && header.subHeaders.length > 0;
    const base = { ...tableStyles.th };

    if (isGroup) {
      return { ...base, ...tableStyles.thCenter };
    }

    if (id === 'regNumber' || id === 'name' || id === 'save' || id === 'grade' || id === 'position') return base;
    return { ...base, ...tableStyles.thCenter, padding: '2px' };
  };

  const getCellStyle = (column) => {
    const {id} = column;
    const base = { ...tableStyles.td };
    if (id === 'regNumber' || id === 'name') return base;
    return { ...base, ...tableStyles.tdCenter };
  };

  const getCommonPinningStyles = (column, isHeader = false) => {
    const isPinned = column.getIsPinned();
    if (!isPinned) return {};

    const isLeft = isPinned === 'left';
    const isLastLeftPinnedColumn = isLeft && (column.id === 'name' || column.id === 'studentInfo');

    return {
      position: 'sticky',
      left: isLeft ? `${column.getStart('left')}px` : undefined,
      zIndex: isHeader ? 3 : 1,
      backgroundColor: isHeader ? '#f3f2f1' : '#fff',
      ...(isLastLeftPinnedColumn && { boxShadow: '2px 0 4px -2px rgba(0,0,0,0.15)' })
    };
  };

  return (
    <div style={tableStyles.wrap}>
      <div style={tableStyles.headingBlock}>
        <h2 style={tableStyles.heading}>Score sheet</h2>
        {loadState === 'loaded' && sheetData?.students?.length != null && sheetData.students.length > 0 && (
          <p style={tableStyles.subheading}>
            {sheetData.students.length} student(s) · {assessments.length} assessment(s)
          </p>
        )}
      </div>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" flexWrap="wrap" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Session</InputLabel>
            <Select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              label="Session"
            >
              <MenuItem value="">Current / latest</MenuItem>
              {sessions.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.name || s.code || s._id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Course</InputLabel>
            <Select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              label="Course"
            >
              <MenuItem value="">Select course</MenuItem>
              {courses.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.name || c.code || c._id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ ml: 'auto' }}>
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
          </Box>
        </Stack>
      </Card>

      {rows.length > 0 && (
        <div style={tableStyles.scrollWrap}>
          <table style={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{
                        ...getHeaderStyle(header),
                        width: header.getSize(),
                        minWidth: header.getSize(),
                        maxWidth: header.getSize(),
                        ...getCommonPinningStyles(header.column, true),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        ...getCellStyle(cell.column),
                        minWidth: cell.column.getSize?.() ?? 80,
                        width: cell.column.getSize?.(),
                        maxWidth: cell.column.getSize?.(),
                        ...getCommonPinningStyles(cell.column, false),
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(!rows || rows.length === 0) && loadState !== 'loading' && (
        <div style={tableStyles.empty}>
          {canLoad
            ? 'Clickss Load to fetch students and assessments for the selected course.'
            : 'Selecssst course (and optionally session), then click Load.'}
        </div>
      )}
    </div>
  );
}

ScoreSheetView.propTypes = {
  initialCourseId: PropTypes.string,
  initialSessionId: PropTypes.string,
};
