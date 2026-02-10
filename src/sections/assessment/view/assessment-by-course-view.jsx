import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
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

import { courseApi, AssessmentApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

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

const isAssessmentForCourse = (assessment, courseId) => {
  if (courseId === 'global') {
    return assessment.isGlobal === true || !(assessment.courses && assessment.courses.length);
  }
  const ids = (assessment.courses || []).map((c) => (typeof c === 'object' ? c?._id : c));
  return ids.includes(courseId);
};

export default function AssessmentByCourseView({ courseId }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [editingAssessment, setEditingAssessment] = useState(null);

  const { data: assessments } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => AssessmentApi.getAssessments(),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: courseApi.getCourses,
    enabled: courseId !== 'global',
  });
  const course = useMemo(() => {
    if (courseId === 'global' || !courses) return null;
    const list = Array.isArray(courses) ? courses : [];
    return list.find((c) => c._id === courseId) ?? null;
  }, [courseId, courses]);

  const filteredAssessments = useMemo(() => {
    if (!assessments || !Array.isArray(assessments)) return [];
    return assessments.filter((a) => isAssessmentForCourse(a, courseId));
  }, [assessments, courseId]);

  const deleteAssessmentMutation = useMutation({
    mutationFn: AssessmentApi.deleteAssessment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      enqueueSnackbar('Assessment deleted successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to delete assessment', { variant: 'error' });
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

  const handleRowClick = (row) => {
    navigate(`/assessment/${row._id}/enter-scores`);
  };

  const columns = [
    {
      id: 'name',
      label: 'Name',
      align: 'left',
      cellSx: { width: '20%' },
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
      renderCell: (row) => <Typography variant="body2">{row.maxScore}</Typography>,
    },
    {
      id: 'weight',
      label: 'Weight',
      cellSx: { width: '8%' },
      renderCell: (row) => (
        <Typography variant="body2">{row.weight != null ? `${row.weight}%` : 'N/A'}</Typography>
      ),
    },
    {
      id: 'dueDate',
      label: 'Due Date',
      cellSx: { width: '14%' },
      renderCell: (row) => formatDate(row.dueDate),
    },
    {
      id: 'isActive',
      label: 'Status',
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Label color={row.isActive !== false ? 'success' : 'default'} variant="soft">
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </Label>
      ),
    },
    {
      id: 'createdBy',
      label: 'Created By',
      cellSx: { width: '14%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {formatCreatedBy(row.createdBy)}
        </Typography>
      ),
    },
    {
      id: 'action',
      label: '',
      cellSx: { width: '16%' },
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

  const pageTitle =
    courseId === 'global' ? 'Global assessments' : (course?.name || course?.title || course?.code) || 'Course';

  return (
    <Container maxWidth="xl">
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3, pt: 4 }}>
        <Button
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
          onClick={() => navigate('/assessment')}
          variant="outlined"
        >
          Back to courses
        </Button>
        <Typography variant="h4" sx={{ flex: 1 }}>
          {pageTitle}
        </Typography>
      </Stack>

      <Card
        sx={{
          boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 
                      0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
          borderRadius: 2,
        }}
      >
        <GenericTable
          data={filteredAssessments}
          columns={columns}
          rowIdField="_id"
          withCheckbox
          withToolbar
          withPagination
          selectable
          isLoading={!assessments}
          emptyRowsHeight={53}
          onRowClick={handleRowClick}
          toolbarProps={{
            searchPlaceholder: 'Search assessments...',
            toolbarTitle: 'Assessments — click a row to enter scores',
          }}
        />
      </Card>

      <EditAssessment
        open={Boolean(editingAssessment)}
        setOpen={() => setEditingAssessment(null)}
        assessment={editingAssessment}
      />
    </Container>
  );
}

AssessmentByCourseView.propTypes = {
  courseId: PropTypes.string.isRequired,
};
