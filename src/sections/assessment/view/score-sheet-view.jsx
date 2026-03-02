import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
} from '@tanstack/react-table';

import { courseApi, SessionApi, AssessmentApi } from 'src/api';

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

const tableStyles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
    fontSize: '0.8125rem',
  },
  th: {
    border: '1px solid #e0e0e0',
    padding: '6px 8px',
    fontWeight: 600,
    textAlign: 'left',
    backgroundColor: '#f5f5f5',
  },
  td: {
    border: '1px solid #e0e0e0',
    padding: '6px 8px',
    backgroundColor: '#fff',
  },
  thCenter: { textAlign: 'center' },
  tdCenter: { textAlign: 'center' },
  input: {
    width: 72,
    padding: '4px 6px',
    fontSize: '0.8125rem',
    border: '1px solid #ccc',
    borderRadius: 4,
    boxSizing: 'border-box',
  },
  button: {
    padding: '6px 12px',
    fontSize: '0.8125rem',
    border: '1px solid #1976d2',
    borderRadius: 4,
    backgroundColor: '#1976d2',
    color: '#fff',
    cursor: 'pointer',
  },
  buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  headingBlock: { marginBottom: 16, textAlign: 'left' },
  heading: { margin: 0, fontSize: '1.25rem', fontWeight: 600 },
  subheading: { margin: '4px 0 0 0', fontSize: '0.875rem', color: '#666' },
  toolbar: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 },
  wrap: { padding: 16 },
  scrollWrap: { overflow: 'auto', maxHeight: 'calc(100vh - 380px)', border: '1px solid #e0e0e0', borderRadius: 4 },
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
      const assessments = sheetData.assessments;
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
    const base = [
      {
        accessorKey: 'regNumber',
        header: 'Reg No',
        size: 120,
        cell: ({ getValue }) => getValue() || '—',
      },
      {
        accessorKey: 'name',
        header: 'Name',
        size: 180,
        cell: ({ getValue }) => {
          const v = getValue() || '—';
          return v.length > 24 ? `${v.slice(0, 24)}…` : v;
        },
      },
    ];

    const scoreCols = assessments.map((a) => {
      const id = a._id?.toString?.() ?? a._id;
      const maxScore = a.maxScore ?? 100;
      return {
        id,
        accessorFn: (row) => row.scores?.[id] ?? '',
        header: `${a.type || '—'} / ${maxScore}`,
        size: 100,
        meta: { maxScore },
        cell: ({ row, column }) => {
          const assessmentId = column.id;
          const max = column.columnDef.meta?.maxScore ?? 100;
          return (
            <input
              type="number"
              min={0}
              max={max}
              step={0.01}
              value={row.original.scores?.[assessmentId] ?? ''}
              onChange={(e) => handleCellChange(row.index, assessmentId, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={tableStyles.input}
            />
          );
        },
      };
    });

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

    return [...base, ...scoreCols, saveCol];
  }, [assessments, handleCellChange, handleSaveRow, savingStudentId]);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.studentId?.toString?.() ?? String(rows.indexOf(row)),
  });

  const getHeaderStyle = (header) => {
    const id = header.column.id;
    const base = { ...tableStyles.th };
    if (id === 'regNumber' || id === 'name') return base;
    return { ...base, ...tableStyles.thCenter };
  };

  const getCellStyle = (column) => {
    const id = column.id;
    const base = { ...tableStyles.td };
    if (id === 'regNumber' || id === 'name') return base;
    return { ...base, ...tableStyles.tdCenter };
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

      <div style={tableStyles.toolbar}>
        <label>
          Session
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            style={{ marginLeft: 8, minWidth: 200, padding: '6px 8px' }}
          >
            <option value="">Current / latest</option>
            {sessions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name || s.code || s._id}
              </option>
            ))}
          </select>
        </label>
        <label>
          Course
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            style={{ marginLeft: 8, minWidth: 220, padding: '6px 8px' }}
          >
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name || c.code || c._id}
              </option>
            ))}
          </select>
        </label>
        <Can do="view_assessment_scores">
          <button
            type="button"
            style={tableStyles.button}
            onClick={loadSheet}
            disabled={!canLoad || loadState === 'loading'}
          >
            {loadState === 'loading' ? 'Loading…' : 'Load'}
          </button>
        </Can>
      </div>

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
                        minWidth: header.column.getSize?.() ?? 80,
                        width: header.colSpan === 1 ? header.getSize() : undefined,
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
            ? 'Click Load to fetch students and assessments for the selected course.'
            : 'Select course (and optionally session), then click Load.'}
        </div>
      )}
    </div>
  );
}

ScoreSheetView.propTypes = {
  initialCourseId: PropTypes.string,
  initialSessionId: PropTypes.string,
};
