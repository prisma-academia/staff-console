import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Box,
  Card,
  Stack,
  alpha,
  Button,
  Tooltip,
  useTheme,
  Container,
  Typography,
  IconButton,
} from '@mui/material';

import { AssessmentApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

import AddAssessment from '../add-assessment';
import EditAssessment from '../edit-assessment';

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

const formatCreatedBy = (createdBy) => {
  if (!createdBy) return 'N/A';
  if (typeof createdBy === 'object') {
    const first = createdBy.firstName || '';
    const last = createdBy.lastName || '';
    return [first, last].filter(Boolean).join(' ') || createdBy.email || 'N/A';
  }
  return 'N/A';
};

export default function AssessmentView() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => AssessmentApi.getAssessments(),
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: AssessmentApi.deleteAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      enqueueSnackbar('Assessment deleted successfully', { variant: 'success' });
    },
    onError: (error) => {
      const errorMessage = error.message || 'An error occurred while deleting the assessment';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    },
  });

  const handleDelete = (assessmentId, e) => {
    e?.stopPropagation?.();
    if (window.confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      deleteAssessmentMutation.mutate(assessmentId);
    }
  };

  const handleEdit = (assessment, e) => {
    e?.stopPropagation?.();
    setEditingAssessment(assessment);
  };

  const columns = [
    {
      id: 'name',
      label: 'Name',
      align: 'left',
      cellSx: { width: '18%' },
      renderCell: (row) => (
        <Typography variant="subtitle2" noWrap>
          {row.name}
        </Typography>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Label color="default" variant="soft">
          {row.type}
        </Label>
      ),
    },
    {
      id: 'maxScore',
      label: 'Max Score',
      cellSx: { width: '8%' },
      renderCell: (row) => (
        <Typography variant="body2">
          {row.maxScore}
        </Typography>
      ),
    },
    {
      id: 'weight',
      label: 'Weight',
      cellSx: { width: '8%' },
      renderCell: (row) => (
        <Typography variant="body2">
          {row.weight != null ? `${row.weight}%` : 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'courses',
      label: 'Courses',
      cellSx: { width: '15%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.isGlobal
            ? 'Global'
            : (row.courses || [])
                .map((c) => (typeof c === 'object' ? c?.code || c?.name : c))
                .filter(Boolean)
                .join(', ') || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      cellSx: { width: '12%' },
      renderCell: (row) => formatDate(row.dueDate),
    },
    {
      id: 'isActive',
      label: 'Status',
      cellSx: { width: '8%' },
      renderCell: (row) => (
        <Label color={row.isActive !== false ? 'success' : 'default'} variant="soft">
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </Label>
      ),
    },
    {
      id: 'createdBy',
      label: 'Created By',
      cellSx: { width: '12%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {formatCreatedBy(row.createdBy)}
        </Typography>
      ),
    },
    {
      id: 'action',
      label: '',
      cellSx: { width: '9%' },
      renderCell: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Can do="edit_assessment">
            <Tooltip title="Edit Assessment">
              <IconButton onClick={(e) => handleEdit(row, e)} size="small">
                <Iconify icon="eva:edit-fill" />
              </IconButton>
            </Tooltip>
          </Can>
          <Can do="delete_assessment">
            <Tooltip title="Delete Assessment">
              <IconButton onClick={(e) => handleDelete(row._id, e)} size="small" color="error">
                <Iconify icon="eva:trash-2-fill" />
              </IconButton>
            </Tooltip>
          </Can>
        </Stack>
      ),
    },
  ];

  const handleCloseEdit = () => {
    setEditingAssessment(null);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Assessments
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Create assessments and enter scores for students
            </Typography>
          </Box>
          <Can do="add_assessment">
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpen(true)}
              sx={{
                px: 3,
                boxShadow: theme.customShadows?.primary,
                '&:hover': {
                  boxShadow: 'none',
                },
              }}
            >
              Add Assessment
            </Button>
          </Can>
        </Box>

        <Card
          sx={{
            boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
            borderRadius: 2,
          }}
        >
          <GenericTable
            data={Array.isArray(data) ? data : []}
            columns={columns}
            rowIdField="_id"
            withCheckbox
            withToolbar
            withPagination
            selectable
            isLoading={isLoading}
            emptyRowsHeight={53}
            onRowClick={(row) => navigate(`/assessment/${row._id}/enter-scores`)}
            toolbarProps={{
              searchPlaceholder: 'Search assessments...',
              toolbarTitle: 'Assessments List',
            }}
          />
        </Card>
      </Box>

      <AddAssessment open={open} setOpen={setOpen} />
      <EditAssessment
        open={Boolean(editingAssessment)}
        setOpen={handleCloseEdit}
        assessment={editingAssessment}
      />
    </Container>
  );
}
