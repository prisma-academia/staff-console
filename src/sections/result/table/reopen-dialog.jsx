import PropTypes from 'prop-types';
import { useMemo, useState, useEffect } from 'react';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Chip,
  Alert,
  Stack,
  Table,
  Button,
  Dialog,
  Checkbox,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  InputAdornment,
  TableContainer,
} from '@mui/material';

import { RESULT_STATUS_COLORS } from 'src/utils/grading';

import Iconify from 'src/components/iconify';

/** Every approved or published result on the broadsheet (class courses and carry-overs). */
function lockedResults(students) {
  return students.flatMap((stu) =>
    [...(stu.courses || []), ...(stu.carryOvers || [])]
      .filter((c) => c.resultId && c.locked)
      .map((c) => ({
        resultId: c.resultId,
        studentId: stu.studentId,
        regNumber: stu.regNumber,
        name: stu.name,
        courseId: c.courseId,
        courseCode: c.courseCode,
        score: c.finalScore,
        grade: c.finalGrade,
        status: c.status,
        carry: !!c.isCarryOver,
      }))
  );
}

/**
 * Picks the exact approved / published results to send back to draft.
 * Reopening never applies to a whole class: only the ticked results change.
 */
export default function ReopenDialog({ open, students, initialIds, busy, onClose, onSubmit }) {
  const rows = useMemo(() => lockedResults(students), [students]);
  const courses = useMemo(
    () => [...new Map(rows.map((r) => [r.courseId, r.courseCode])).entries()].sort((a, b) => a[1].localeCompare(b[1])),
    [rows]
  );
  const [selected, setSelected] = useState(() => new Set());
  const [course, setCourse] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelected(new Set(initialIds || []));
    setCourse('');
    setStatus('');
    setSearch('');
    setReason('');
  }, [open, initialIds]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!course || r.courseId === course) &&
        (!status || r.status === status) &&
        (!term || `${r.regNumber} ${r.name} ${r.courseCode}`.toLowerCase().includes(term))
    );
  }, [rows, course, status, search]);

  const allVisible = visible.length > 0 && visible.every((r) => selected.has(r.resultId));
  const someVisible = visible.some((r) => selected.has(r.resultId));
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      visible.forEach((r) => (allVisible ? next.delete(r.resultId) : next.add(r.resultId)));
      return next;
    });

  const picked = rows.filter((r) => selected.has(r.resultId));
  const publishedCount = picked.filter((r) => r.status === 'published').length;
  const pickedStudents = new Set(picked.map((r) => r.studentId)).size;

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="md" fullWidth>
      <DialogTitle>Reopen results for corrections</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Tick the results that need correcting. Only those go back to draft; everything else stays locked. Students stop
            seeing a reopened result until it is published again.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              size="small"
              placeholder="Search name, reg no or course"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField select size="small" label="Course" value={course} onChange={(e) => setCourse(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="">All courses</MenuItem>
              {courses.map(([id, code]) => (
                <MenuItem key={id} value={id}>
                  {code}
                </MenuItem>
              ))}
            </TextField>
            <TextField select size="small" label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value="">Any status</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="published">Published</MenuItem>
            </TextField>
          </Stack>

          <TableContainer sx={{ maxHeight: 340, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" checked={allVisible} indeterminate={someVisible && !allVisible} disabled={!visible.length} onChange={toggleVisible} />
                  </TableCell>
                  <TableCell>Reg No</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell align="center">Score</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.resultId} hover selected={selected.has(r.resultId)} onClick={() => toggle(r.resultId)} sx={{ cursor: 'pointer' }}>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" checked={selected.has(r.resultId)} />
                    </TableCell>
                    <TableCell>{r.regNumber}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>
                      {r.courseCode}
                      {r.carry && <Chip size="small" variant="outlined" label="carry-over" sx={{ ml: 0.75, height: 18 }} />}
                    </TableCell>
                    <TableCell align="center">
                      {r.score ?? '—'} {r.grade}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={r.status} color={RESULT_STATUS_COLORS[r.status]} />
                    </TableCell>
                  </TableRow>
                ))}
                {!visible.length && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {rows.length ? 'No result matches the filters.' : 'This class has no approved or published results.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {picked.length > 0 && publishedCount > 0 && (
            <Alert severity="warning">
              {publishedCount} of the selected results {publishedCount === 1 ? 'is' : 'are'} published and will disappear from the
              student portal until published again.
            </Alert>
          )}

          <TextField
            label="Reason (recorded in the activity log)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline
            minRows={2}
            required
            inputProps={{ maxLength: 500 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Box sx={{ flex: 1, pl: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {picked.length
              ? `${picked.length} result${picked.length === 1 ? '' : 's'} · ${pickedStudents} student${pickedStudents === 1 ? '' : 's'}`
              : 'Nothing selected'}
          </Typography>
        </Box>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          color="warning"
          loading={busy}
          disabled={!picked.length || !reason.trim()}
          onClick={() => onSubmit(picked.map((r) => r.resultId), reason.trim())}
        >
          Reopen {picked.length || ''} result{picked.length === 1 ? '' : 's'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

ReopenDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  students: PropTypes.array.isRequired,
  initialIds: PropTypes.array,
  busy: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
