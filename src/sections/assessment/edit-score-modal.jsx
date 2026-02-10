import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Fade,
  Modal,
  Stack,
  Table,
  Button,
  Backdrop,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  TableContainer,
} from '@mui/material';

import { ScoreApi } from 'src/api';

const getStudentDisplay = (item) => {
  if (!item) return 'N/A';
  if (typeof item !== 'object') return String(item);
  const name = [item.personalInfo?.firstName, item.personalInfo?.lastName]
    .filter(Boolean)
    .join(' ');
  if (name) return item.regNumber ? `${name} (${item.regNumber})` : name;
  return item.regNumber || item.email || item._id || 'N/A';
};

const EditScoreModal = ({ open, setOpen, scoreEntry, onSuccess }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [scoreRows, setScoreRows] = useState([]);

  const scoreId = scoreEntry?._id;

  useEffect(() => {
    if (!scoreEntry?.scores || !Array.isArray(scoreEntry.scores)) {
      setScoreRows([]);
      return;
    }
    setScoreRows(
      scoreEntry.scores.map((s) => ({
        student: typeof s.student === 'object' ? s.student?._id : s.student,
        studentDisplay: getStudentDisplay(s.student),
        score: s.score ?? '',
        maxScore: s.maxScore ?? '',
        remark: s.remark ?? '',
      }))
    );
  }, [scoreEntry]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => ScoreApi.updateScore(id, data),
    onSuccess: () => {
      formik.setSubmitting(false);
      queryClient.invalidateQueries({ queryKey: ['scores-by-assessment'] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      enqueueSnackbar('Scores updated successfully', { variant: 'success' });
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      formik.setSubmitting(false);
      enqueueSnackbar(error.message || 'Failed to update scores', { variant: 'error' });
    },
  });

  const formik = useFormik({
    initialValues: { scoreRows: [] },
    onSubmit: () => {
      formik.setSubmitting(true);
      const scores = scoreRows.map((row) => ({
        student: row.student,
        score: Number(row.score),
        maxScore: Number(row.maxScore) || 100,
        remark: row.remark || undefined,
      }));
      const valid = scores.every(
        (s) => typeof s.score === 'number' && !Number.isNaN(s.score) && s.score >= 0
      );
      if (!valid) {
        enqueueSnackbar('Please enter valid scores for all students', { variant: 'error' });
        return;
      }
      updateMutation.mutate({ id: scoreId, data: { scores } });
    },
  });

  const handleRowChange = (index, field, value) => {
    setScoreRows((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '95%',
    maxWidth: 640,
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 3,
    overflow: 'auto',
    borderRadius: 2,
  };

  const handleClose = () => setOpen(false);

  if (!scoreEntry) return null;

  const sessionDisplay =
    typeof scoreEntry.session === 'object'
      ? scoreEntry.session?.name || scoreEntry.session?.code
      : scoreEntry.session || 'N/A';

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      keepMounted={false}
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
    >
      <Fade in={open}>
        <Box sx={modalStyle}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Edit Score Entry — Session: {sessionDisplay}
          </Typography>

          <Box component="form" onSubmit={formik.handleSubmit}>
            <TableContainer sx={{ maxHeight: 360, overflow: 'auto', mb: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell align="right" sx={{ width: 100 }}>
                      Score
                    </TableCell>
                    <TableCell align="right" sx={{ width: 100 }}>
                      Max
                    </TableCell>
                    <TableCell>Remark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scoreRows.map((row, index) => (
                    <TableRow key={row.student || index}>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>
                          {row.studentDisplay}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={row.score}
                          onChange={(e) => handleRowChange(index, 'score', e.target.value)}
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 1 }}
                          value={row.maxScore}
                          onChange={(e) => handleRowChange(index, 'maxScore', e.target.value)}
                          sx={{ width: 90 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          placeholder="Remark"
                          value={row.remark}
                          onChange={(e) => handleRowChange(index, 'remark', e.target.value)}
                          fullWidth
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button onClick={handleClose} variant="outlined">
                Cancel
              </Button>
              <LoadingButton
                loading={formik.isSubmitting}
                variant="contained"
                type="submit"
                disabled={scoreRows.length === 0}
              >
                Update Scores
              </LoadingButton>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

EditScoreModal.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  scoreEntry: PropTypes.shape({
    _id: PropTypes.string,
    session: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    scores: PropTypes.arrayOf(
      PropTypes.shape({
        student: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
        score: PropTypes.number,
        maxScore: PropTypes.number,
        remark: PropTypes.string,
      })
    ),
  }),
  onSuccess: PropTypes.func,
};

export default EditScoreModal;
