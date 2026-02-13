import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Box } from '@mui/system';
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

import { SessionApi } from 'src/api';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

import AddSession from '../add-session';
import EditSession from '../edit-session';
import SessionDetails from '../session-details';

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

const formatCreatedBy = (row) => {
  const createdBy = row.createdBy;
  if (!createdBy) return '—';
  if (typeof createdBy === 'object') {
    const name = [createdBy.firstName, createdBy.lastName].filter(Boolean).join(' ');
    return name || createdBy.email || '—';
  }
  return '—';
};

export default function SessionView() {
  const theme = useTheme();
  const [openAdd, setOpenAdd] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [viewingSession, setViewingSession] = useState(null);

  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: SessionApi.getSessions,
  });

  const deleteSessionMutation = useMutation({
    mutationFn: SessionApi.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      enqueueSnackbar('Session deleted successfully', { variant: 'success' });
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to delete session';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    },
  });

  const handleDelete = (sessionId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this session?')) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  const handleEdit = (session, e) => {
    e.stopPropagation();
    setEditingSession(session);
  };

  const handleView = (session, e) => {
    e.stopPropagation();
    setViewingSession(session);
  };

  const columns = [
    {
      id: 'name',
      label: 'Name',
      align: 'left',
      cellSx: { width: '14%' },
      renderCell: (row) => (
        <Typography variant="subtitle2" noWrap>
          {row.name}
        </Typography>
      ),
    },
    {
      id: 'code',
      label: 'Code',
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Typography variant="body2">{row.code || '—'}</Typography>
      ),
    },
    {
      id: 'currentSemester',
      label: 'Semester',
      cellSx: { width: '12%' },
      renderCell: (row) => (
        <Typography variant="body2">{row.currentSemester || 'First Semester'}</Typography>
      ),
    },
    {
      id: 'startDate',
      label: 'Start Date',
      cellSx: { width: '12%' },
      renderCell: (row) => formatDate(row.startDate),
    },
    {
      id: 'endDate',
      label: 'End Date',
      cellSx: { width: '12%' },
      renderCell: (row) => formatDate(row.endDate),
    },
    {
      id: 'isCurrent',
      label: 'Current',
      cellSx: { width: '10%' },
      renderCell: (row) =>
        row.isCurrent ? (
          <Label color="success">Current</Label>
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        ),
    },
    {
      id: 'createdBy',
      label: 'Created By',
      cellSx: { width: '14%' },
      renderCell: (row) => (
        <Typography variant="body2" noWrap>
          {formatCreatedBy(row)}
        </Typography>
      ),
    },
    {
      id: 'action',
      label: '',
      cellSx: { width: '14%' },
      renderCell: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Can do="view_session">
            <Tooltip title="View">
              <IconButton onClick={(e) => handleView(row, e)} size="small">
                <Iconify icon="eva:eye-fill" />
              </IconButton>
            </Tooltip>
          </Can>
          <Can do="edit_session">
            <Tooltip title="Edit">
              <IconButton onClick={(e) => handleEdit(row, e)} size="small">
                <Iconify icon="eva:edit-fill" />
              </IconButton>
            </Tooltip>
          </Can>
          <Can do="delete_session">
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

  const handleCloseEdit = (value) => {
    if (!value) setEditingSession(null);
  };

  const sessions = Array.isArray(data) ? data : [];

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Academic Sessions
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Manage academic sessions (e.g. 2024/2025) for fees, results, and reporting
            </Typography>
          </Box>
          <Can do="add_session">
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpenAdd(true)}
              sx={{
                px: 3,
                boxShadow: theme.customShadows?.primary,
                '&:hover': { boxShadow: 'none' },
              }}
            >
              Add Session
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
            data={sessions}
            columns={columns}
            rowIdField="_id"
            withToolbar
            withPagination
            isLoading={isLoading}
            emptyRowsHeight={53}
            onRowClick={(row) => setViewingSession(row)}
            toolbarProps={{
              searchPlaceholder: 'Search sessions...',
              toolbarTitle: 'Sessions',
            }}
          />
        </Card>
      </Box>

      <AddSession open={openAdd} setOpen={setOpenAdd} />
      <EditSession
        open={Boolean(editingSession)}
        setOpen={handleCloseEdit}
        session={editingSession}
      />
      <SessionDetails
        open={Boolean(viewingSession)}
        setOpen={(value) => !value && setViewingSession(null)}
        session={viewingSession}
      />
    </Container>
  );
}
