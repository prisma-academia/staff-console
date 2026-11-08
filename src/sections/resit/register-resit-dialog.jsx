import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Alert,
  Stack,
  Table,
  Button,
  Dialog,
  Switch,
  Checkbox,
  Skeleton,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  DialogTitle,
  Autocomplete,
  DialogContent,
  DialogActions,
  TableContainer,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';

import { ResitApi, StudentApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Label from 'src/components/label';

import { formatCurrency } from 'src/sections/fee/fee-format';

import { resitState, formatPrice } from './resit-format';

// ----------------------------------------------------------------------

const studentName = (student) =>
  [student?.personalInfo?.firstName, student?.personalInfo?.lastName].filter(Boolean).join(' ');

const optionLabel = (student) =>
  [studentName(student), student?.regNumber].filter(Boolean).join(' · ') || 'Student';

/** Why a failed course can't be ticked, or null when it can. */
const blockedReason = (course, session) => {
  if (course.registration) return null;
  if (!session) return 'No current session';
  if (course.price === null || course.price === undefined) return 'No resit price';
  if (!course.canRegister) return 'Not available';
  return null;
};

/**
 * Registers a student for resits of failed courses on their behalf, in the current session.
 * The fee is generated for the student to pay, or waived at once with a reason.
 * `initialStudent` (from the student's page) skips the search.
 */
export default function RegisterResitDialog({ open, onClose, onRegistered, initialStudent = null }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const { check } = usePermissions();
  const canSearch = check(PERMISSIONS.VIEW_STUDENT);

  const [student, setStudent] = useState(null);
  const [input, setInput] = useState('');
  const [term, setTerm] = useState('');
  const [picked, setPicked] = useState([]);
  const [waive, setWaive] = useState(false);
  const [reason, setReason] = useState('');

  // Start every visit from a clean slate
  useEffect(() => {
    if (!open) return;
    setStudent(initialStudent || null);
    setInput(initialStudent ? optionLabel(initialStudent) : '');
    setTerm('');
    setPicked([]);
    setWaive(false);
    setReason('');
  }, [open, initialStudent]);

  useEffect(() => {
    const timer = setTimeout(() => setTerm(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const { data: searchData, isFetching: searching } = useQuery({
    queryKey: ['students', 'search', term],
    queryFn: () => StudentApi.getStudentsPage({ search: term, page: 1, limit: 20 }),
    enabled: open && canSearch && term.length >= 2,
    placeholderData: keepPreviousData,
  });
  const options = useMemo(() => {
    const found = term.length >= 2 ? (searchData?.data ?? []) : [];
    if (student && !found.some((s) => s._id === student._id)) return [student, ...found];
    return found;
  }, [searchData, term, student]);

  const {
    data: detail,
    isLoading: detailLoading,
    error: detailError,
  } = useQuery({
    queryKey: ['resit', 'student', student?._id],
    queryFn: () => ResitApi.getStudent(student._id),
    enabled: open && Boolean(student?._id),
  });
  const courses = useMemo(() => detail?.courses ?? [], [detail]);
  const registrable = courses.filter((course) => course.canRegister);
  const pickedCourses = courses.filter((course) => picked.includes(course.resultId));
  const total = pickedCourses.reduce((sum, course) => sum + Number(course.price || 0), 0);
  const allPicked = registrable.length > 0 && picked.length === registrable.length;

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      ResitApi.register({
        studentId: student._id,
        resultIds: picked,
        ...(waive ? { waiveReason: reason.trim() } : {}),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['resit'] });
      queryClient.invalidateQueries({ queryKey: ['student-fees'] });
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      const count = picked.length;
      enqueueSnackbar(
        waive
          ? `Registered for ${count} resit(s) with the fee waived`
          : `Registered for ${count} resit(s). The student pays ${formatCurrency(result?.total ?? total)} to confirm.`,
        { variant: 'success' }
      );
      if (onRegistered) onRegistered(result);
      onClose();
    },
    onError: (error) =>
      enqueueSnackbar(error.message || 'Could not register the resits', { variant: 'error' }),
  });

  const handleClose = () => {
    if (!isPending) onClose();
  };

  const toggle = (resultId) =>
    setPicked((prev) =>
      prev.includes(resultId) ? prev.filter((id) => id !== resultId) : [...prev, resultId]
    );

  const canSubmit = Boolean(student) && picked.length > 0 && (!waive || reason.trim().length > 0);

  const renderCourses = () => {
    if (detailLoading) {
      return (
        <Stack spacing={1}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={36} />
          ))}
        </Stack>
      );
    }
    if (detailError) {
      return <Alert severity="error">{detailError.message || 'Could not load the student'}</Alert>;
    }
    if (!courses.length) {
      return <Alert severity="info">This student has no failed courses waiting for a resit.</Alert>;
    }
    return (
      <TableContainer
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 340 }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allPicked}
                  indeterminate={picked.length > 0 && !allPicked}
                  disabled={!registrable.length}
                  onChange={() => setPicked(allPicked ? [] : registrable.map((c) => c.resultId))}
                  inputProps={{ 'aria-label': 'Select every course that can be registered' }}
                />
              </TableCell>
              <TableCell>Course</TableCell>
              <TableCell>Failed in</TableCell>
              <TableCell align="center">Score</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => {
              const blocked = blockedReason(course, detail?.session);
              const state = course.registration ? resitState(course.registration.state) : null;
              return (
                <TableRow
                  key={course.resultId}
                  hover={course.canRegister}
                  selected={picked.includes(course.resultId)}
                  onClick={() => course.canRegister && toggle(course.resultId)}
                  sx={{ cursor: course.canRegister ? 'pointer' : 'default' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={picked.includes(course.resultId)}
                      disabled={!course.canRegister}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">{course.course?.code || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {course.course?.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {course.session?.name || '—'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {course.semester}
                      {course.attempt > 1 ? ` · attempt ${course.attempt}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {course.score ?? '—'}
                    {course.grade ? ` (${course.grade})` : ''}
                  </TableCell>
                  <TableCell align="right">{formatPrice(course.price)}</TableCell>
                  <TableCell>
                    {state && <Label color={state.color}>{state.label}</Label>}
                    {!state && blocked && (
                      <Typography variant="caption" color="text.secondary">
                        {blocked}
                      </Typography>
                    )}
                    {!state && !blocked && (
                      <Typography variant="caption" color="success.main">
                        Can register
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Register a student for resits</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {initialStudent && (
            <Typography variant="subtitle1">{optionLabel(initialStudent)}</Typography>
          )}
          {!initialStudent && canSearch && (
            <Autocomplete
              value={student}
              options={options}
              loading={searching}
              filterOptions={(x) => x}
              getOptionLabel={optionLabel}
              isOptionEqualToValue={(a, b) => a._id === b._id}
              inputValue={input}
              onInputChange={(_, value) => setInput(value)}
              onChange={(_, value) => {
                setStudent(value);
                setPicked([]);
              }}
              noOptionsText={term.length < 2 ? 'Type at least 2 characters' : 'No students found'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Student"
                  placeholder="Search by name or reg number"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {searching ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
          {!initialStudent && !canSearch && (
            <Alert severity="warning">
              Looking up students needs the view student permission. Ask an administrator for it.
            </Alert>
          )}

          {student && (
            <>
              {detail && !detail.session && (
                <Alert severity="warning">
                  No current session is set, so resit registration is closed.
                </Alert>
              )}
              {detail?.session && (
                <Typography variant="body2" color="text.secondary">
                  Registers in <strong>{detail.session.name}</strong>, the current session. Only
                  failed courses with a resit price can be registered.
                </Typography>
              )}

              {renderCourses()}

              {picked.length > 0 && (
                <Box>
                  <Typography variant="subtitle2">
                    {picked.length} course{picked.length === 1 ? '' : 's'} · total{' '}
                    {formatCurrency(total)}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch checked={waive} onChange={(e) => setWaive(e.target.checked)} />
                    }
                    label="Waive the fee"
                  />
                  {waive && (
                    <TextField
                      required
                      fullWidth
                      multiline
                      minRows={2}
                      label="Reason for waiving"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      inputProps={{ maxLength: 500 }}
                      helperText={`${reason.length}/500`}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="inherit" onClick={handleClose} disabled={isPending}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          loading={isPending}
          disabled={!canSubmit}
          onClick={() => mutate()}
        >
          {waive ? 'Register with fee waived' : 'Register'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

RegisterResitDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRegistered: PropTypes.func,
  initialStudent: PropTypes.object,
};
