import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { ScoreApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';

import EditScoreModal from './edit-score-modal';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

const AssessmentDetails = ({ open, setOpen, assessment }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [editingScoreEntry, setEditingScoreEntry] = useState(null);

  const assessmentId = assessment?._id;

  const { data: scoreEntries, isLoading: scoresLoading } = useQuery({
    queryKey: ['scores-by-assessment', assessmentId],
    queryFn: () => ScoreApi.getScoresByAssessment(assessmentId),
    enabled: !!assessmentId && open,
  });

  const deleteScoreMutation = useMutation({
    mutationFn: ScoreApi.deleteScore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scores-by-assessment', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      enqueueSnackbar('Score entry deleted successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to delete score entry', { variant: 'error' });
    },
  });

  const handleDeleteScore = (scoreId) => {
    if (window.confirm('Are you sure you want to delete this score entry?')) {
      deleteScoreMutation.mutate(scoreId);
    }
  };

  const handleCloseEditScore = () => {
    setEditingScoreEntry(null);
  };

  if (!assessment) return null;

  const coursesDisplay = assessment.isGlobal
    ? 'Global'
    : (assessment.courses || [])
        .map((c) => (typeof c === 'object' ? c?.code || c?.name : c))
        .filter(Boolean)
        .join(', ') || 'None';

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 560 } },
        }}
      >
        <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Typography variant="h6">Assessment Details</Typography>
            <IconButton onClick={() => setOpen(false)}>
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>

          <Stack spacing={2} sx={{ mb: 4 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body1">{assessment.name}</Typography>

            {assessment.description && (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1">{assessment.description}</Typography>
              </>
            )}

            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Type
                </Typography>
                <Label variant="soft">{assessment.type}</Label>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Max Score
                </Typography>
                <Typography variant="body1">{assessment.maxScore}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Weight
                </Typography>
                <Typography variant="body1">
                  {assessment.weight != null ? `${assessment.weight}%` : 'N/A'}
                </Typography>
              </Box>
            </Stack>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Courses
              </Typography>
              <Typography variant="body1">{coursesDisplay}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Due Date
              </Typography>
              <Typography variant="body1">{formatDate(assessment.dueDate)}</Typography>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Label color={assessment.isActive !== false ? 'success' : 'default'} variant="soft">
                {assessment.isActive !== false ? 'Active' : 'Inactive'}
              </Label>
            </Box>
          </Stack>

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Score Entries
          </Typography>
          <Can do="add_score">
            <Button
              component={Link}
              to={`/assessment/${assessment._id}/enter-scores`}
              variant="outlined"
              startIcon={<Iconify icon="eva:plus-fill" />}
              sx={{ mb: 2 }}
            >
              Enter Scores
            </Button>
          </Can>

          {scoresLoading && (
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          )}
          {!scoresLoading && !scoreEntries?.length && (
            <Typography variant="body2" color="text.secondary">
              No score entries yet. Click &quot;Enter Scores&quot; to add.
            </Typography>
          )}
          {!scoresLoading && scoreEntries?.length > 0 && (
            <TableContainer component={Card} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Session</TableCell>
                    <TableCell>Students</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(scoreEntries || []).map((entry) => (
                    <TableRow key={entry._id}>
                      <TableCell>
                        <Typography variant="body2">
                          {typeof entry.session === 'object'
                            ? entry.session?.name || entry.session?.code || entry._id
                            : entry.session || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {(entry.students || entry.scores || [])
                            .slice(0, 2)
                            .map((s) => {
                              const obj = typeof s === 'object' ? s : null;
                              if (obj?.personalInfo) {
                                return [obj.personalInfo.firstName, obj.personalInfo.lastName]
                                  .filter(Boolean)
                                  .join(' ');
                              }
                              if (obj?.regNumber) return obj.regNumber;
                              return null;
                            })
                            .filter(Boolean)
                            .join(', ')}
                          {(entry.students || entry.scores || []).length > 2 &&
                            ` +${(entry.students || entry.scores).length - 2} more`}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Can do="edit_score">
                          <IconButton
                            size="small"
                            onClick={() => setEditingScoreEntry(entry)}
                            aria-label="Edit score"
                          >
                            <Iconify icon="eva:edit-fill" />
                          </IconButton>
                        </Can>
                        <Can do="delete_score">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteScore(entry._id)}
                            aria-label="Delete score"
                          >
                            <Iconify icon="eva:trash-2-fill" />
                          </IconButton>
                        </Can>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Drawer>

      <EditScoreModal
        open={Boolean(editingScoreEntry)}
        setOpen={handleCloseEditScore}
        scoreEntry={editingScoreEntry}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['scores-by-assessment', assessmentId] });
        }}
      />
    </>
  );
};

AssessmentDetails.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  assessment: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string,
    maxScore: PropTypes.number,
    weight: PropTypes.number,
    courses: PropTypes.array,
    isGlobal: PropTypes.bool,
    dueDate: PropTypes.string,
    isActive: PropTypes.bool,
  }),
};

export default AssessmentDetails;
