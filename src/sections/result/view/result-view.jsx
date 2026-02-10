import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { ResultApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

import AddResultModal from '../add-result';
import ResultExportDialog from '../result-export-dialog';
import ResultDetailsModal from '../result-details-modal';

// ----------------------------------------------------------------------

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

const getStudentName = (student) => {
  if (!student) return 'N/A';
  if (typeof student === 'object' && student.personalInfo) {
    const first = student.personalInfo.firstName || '';
    const last = student.personalInfo.lastName || '';
    return [first, last].filter(Boolean).join(' ') || 'N/A';
  }
  return 'N/A';
};

const gradeColorMap = {
  A: 'success',
  B: 'info',
  C: 'default',
  D: 'warning',
  E: 'warning',
  F: 'error',
};

export default function ResultView() {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [viewingResult, setViewingResult] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['results'],
    queryFn: ResultApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: ResultApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      enqueueSnackbar('Result deleted successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to delete result', { variant: 'error' });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => ResultApi.bulkDelete({ ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      setSelectedIds([]);
      enqueueSnackbar('Results deleted successfully', { variant: 'success' });
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to delete results', { variant: 'error' });
    },
  });

  const handleDelete = (id, e) => {
    e?.stopPropagation?.();
    if (window.confirm('Are you sure you want to delete this result?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Delete ${selectedIds.length} selected result(s)?`)) {
      bulkDeleteMutation.mutate(selectedIds);
    }
  };

  const handleEdit = (row, e) => {
    e?.stopPropagation?.();
    setEditingResult(row);
  };

  const handleView = (row, e) => {
    e?.stopPropagation?.();
    setViewingResult(row);
  };

  const columns = [
    {
      id: 'regNumber',
      label: 'Reg No',
      align: 'left',
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Typography variant="subtitle2" noWrap>
          {row.regNumber || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'student',
      label: 'Student',
      align: 'left',
      cellSx: { width: '12%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {getStudentName(row.student)}
        </Typography>
      ),
    },
    {
      id: 'program',
      label: 'Program',
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.program?.name ?? row.program ?? 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'classLevel',
      label: 'Class',
      cellSx: { width: '8%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.classLevel?.name ?? row.classLevel ?? 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'course',
      label: 'Course',
      cellSx: { width: '12%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.course?.code
            ? `${row.course.code} - ${row.course.name || ''}`
            : row.course?.name ?? 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'score',
      label: 'Score',
      cellSx: { width: '6%' },
      renderCell: (row) => (
        <Typography variant="body2">{row.score ?? '—'}</Typography>
      ),
    },
    {
      id: 'grade',
      label: 'Grade',
      cellSx: { width: '6%' },
      renderCell: (row) => (
        <Label color={gradeColorMap[row.grade] || 'default'} variant="soft">
          {row.grade || '—'}
        </Label>
      ),
    },
    {
      id: 'semester',
      label: 'Semester',
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.semester || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'year',
      label: 'Year',
      cellSx: { width: '6%' },
      renderCell: (row) => (
        <Typography variant="body2">{row.year ?? '—'}</Typography>
      ),
    },
    {
      id: 'session',
      label: 'Session',
      cellSx: { width: '8%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {row.session?.name ?? row.session?.code ?? row.session ?? 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'createdAt',
      label: 'Created',
      cellSx: { width: '8%' },
      renderCell: (row) => formatDate(row.createdAt),
    },
    {
      id: 'action',
      label: '',
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Can do="view_result">
            <Tooltip title="View">
              <IconButton onClick={(e) => handleView(row, e)} size="small">
                <Iconify icon="eva:eye-fill" />
              </IconButton>
            </Tooltip>
          </Can>
          <Can do="edit_result">
            <Tooltip title="Edit">
              <IconButton onClick={(e) => handleEdit(row, e)} size="small">
                <Iconify icon="eva:edit-fill" />
              </IconButton>
            </Tooltip>
          </Can>
          <Can do="delete_result">
            <Tooltip title="Delete">
              <IconButton
                onClick={(e) => handleDelete(row._id, e)}
                size="small"
                color="error"
              >
                <Iconify icon="eva:trash-2-fill" />
              </IconButton>
            </Tooltip>
          </Can>
        </Stack>
      ),
    },
  ];

  const toolbarActions = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Can do="add_result">
        <Button
          variant="contained"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={() => setOpen(true)}
          sx={{
            boxShadow: theme.customShadows?.primary,
            '&:hover': { boxShadow: 'none' },
          }}
        >
          Add result
        </Button>
      </Can>
      <Can anyOf={['build_result', 'view_result']}>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="eva:grid-fill" />}
          onClick={() => navigate('/result/builder')}
        >
          Result builder
        </Button>
      </Can>
      <Can anyOf={['export_result', 'view_result']}>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="eva:download-fill" />}
          onClick={() => setExportOpen(true)}
        >
          Export
        </Button>
      </Can>
      <Can do="add_result">
        <Button
          variant="outlined"
          startIcon={<Iconify icon="eva:file-text-fill" />}
          onClick={() => setOpen(true)}
        >
          Download template
        </Button>
      </Can>
    </Stack>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Results Management
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Prepare and manage student results; use the builder or download templates
            </Typography>
          </Box>
          {toolbarActions}
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
            onSelectionChange={setSelectedIds}
            toolbarProps={{
              searchPlaceholder: 'Search results...',
              toolbarTitle: 'Results list',
              customSelectedActions: (
                <Can do="delete_result">
                  <Tooltip title="Delete selected">
                    <IconButton onClick={handleBulkDelete} color="error">
                      <Iconify icon="eva:trash-2-fill" />
                    </IconButton>
                  </Tooltip>
                </Can>
              ),
              showDefaultDeleteAction: false,
            }}
          />
        </Card>
      </Box>

      <AddResultModal open={open} setOpen={setOpen} editingResult={editingResult} onCloseEdit={() => setEditingResult(null)} />
      <ResultExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <ResultDetailsModal
        open={Boolean(viewingResult)}
        onClose={() => setViewingResult(null)}
        result={viewingResult}
      />
    </Container>
  );
}
