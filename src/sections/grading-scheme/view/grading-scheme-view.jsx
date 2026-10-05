import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Chip,
  Alert,
  Dialog,
  Tooltip,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';

import { GradingSchemeApi } from 'src/api';
import { PERMISSIONS } from 'src/permissions/constants';

import Iconify from 'src/components/iconify';
import Can from 'src/components/permission/can';
import { GenericTable } from 'src/components/generic-table';

import PresetDialog from '../preset-dialog';
import GradingSchemeEditor from '../grading-scheme-editor';

// ----------------------------------------------------------------------

const errorMessage = (error) => error?.data?.message || error?.message || 'An error occurred';

export default function GradingSchemeView() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [editor, setEditor] = useState({ open: false, scheme: null });
  const [presetOpen, setPresetOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const { data: schemes = [], isLoading, isFetching, error } = useQuery({
    queryKey: ['grading-schemes'],
    queryFn: () => GradingSchemeApi.getSchemes(),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['grading-schemes'] });
    queryClient.invalidateQueries({ queryKey: ['programs'] });
  };

  const { mutate: duplicate } = useMutation({
    mutationFn: (id) => GradingSchemeApi.duplicateScheme(id),
    onSuccess: (copy) => {
      refresh();
      enqueueSnackbar(`Created "${copy.name}"`, { variant: 'success' });
      setEditor({ open: true, scheme: copy });
    },
    onError: (err) => enqueueSnackbar(errorMessage(err), { variant: 'error' }),
  });

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: (id) => GradingSchemeApi.deleteScheme(id),
    onSuccess: () => {
      refresh();
      enqueueSnackbar('Grading scheme deleted', { variant: 'success' });
      setToDelete(null);
    },
    onError: (err) => enqueueSnackbar(errorMessage(err), { variant: 'error' }),
  });

  const columns = [
    {
      id: 'name',
      label: 'Scheme',
      align: 'left',
      cellSx: { width: '28%' },
      renderCell: (row) => (
        <Stack spacing={0.5}>
          <Typography variant="subtitle2">{row.name}</Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={row.code} variant="outlined" />
            {row.isDefault && <Chip size="small" color="primary" label="Default" />}
            {!row.isActive && <Chip size="small" label="Inactive" />}
            {row.locked && (
              <Tooltip title="Grades approved or published results. Its grading rules can no longer change; duplicate it to make a new version.">
                <Chip size="small" color="warning" icon={<Iconify icon="eva:lock-fill" />} label="Locked" />
              </Tooltip>
            )}
          </Stack>
        </Stack>
      ),
    },
    {
      id: 'scale',
      label: 'Scale',
      cellSx: { width: '10%' },
      renderCell: (row) => (
        <Stack>
          <Typography variant="body2">{Number(row.maxPoint).toFixed(1)}-point</Typography>
          <Typography variant="caption" color="text.secondary">Pass mark {row.passMark ?? '—'}</Typography>
        </Stack>
      ),
    },
    {
      id: 'bands',
      label: 'Grades',
      cellSx: { width: '27%' },
      renderCell: (row) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {[...(row.bands || [])]
            .sort((a, b) => b.minScore - a.minScore)
            .map((band) => (
              <Tooltip key={band.grade} title={`${band.minScore}–${band.maxScore} · ${band.point} pts · ${band.remark || ''}`}>
                <Chip
                  size="small"
                  label={`${band.grade} ${band.minScore}+`}
                  color={band.isPass ? 'default' : 'error'}
                  variant={band.isPass ? 'outlined' : 'filled'}
                />
              </Tooltip>
            ))}
        </Stack>
      ),
    },
    {
      id: 'programmes',
      label: 'Programmes',
      cellSx: { width: '20%' },
      renderCell: (row) => {
        const names = (row.programmes || []).map((p) => [p.type, p.name?.trim()].filter(Boolean).join(' '));
        return (
          <Stack>
            <Tooltip title={names.join(', ') || 'Not assigned to any programme'}>
              <Typography variant="body2">
                {row.programmeCount ? `${row.programmeCount} assigned` : 'None assigned'}
              </Typography>
            </Tooltip>
            {row.isDefault && row.defaultForCount > 0 && (
              <Typography variant="caption" color="text.secondary">
                + {row.defaultForCount} without a scheme (default)
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      id: 'action',
      label: 'Action',
      align: 'right',
      cellSx: { width: '15%' },
      renderCell: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
          <IconButton size="small" color="primary" title={row.locked ? 'View' : 'Edit'} onClick={() => setEditor({ open: true, scheme: row })}>
            <Iconify icon={row.locked ? 'eva:eye-fill' : 'eva:edit-fill'} />
          </IconButton>
          <Can do={PERMISSIONS.ADD_GRADING_SCHEME}>
            <IconButton size="small" title="Duplicate" onClick={() => duplicate(row._id)}>
              <Iconify icon="eva:copy-fill" />
            </IconButton>
          </Can>
          <Can do={PERMISSIONS.DELETE_GRADING_SCHEME}>
            <IconButton
              size="small"
              color="error"
              title={row.programmeCount || row.hasResults ? 'In use: cannot be deleted' : 'Delete'}
              disabled={Boolean(row.programmeCount || row.hasResults)}
              onClick={() => setToDelete(row)}
            >
              <Iconify icon="eva:trash-2-fill" />
            </IconButton>
          </Can>
        </Stack>
      ),
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" color="text.primary" fontWeight="700">
              Grading Schemes
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              How each programme&apos;s scores become grades, grade points and classes of award. Assign a scheme on the programme.
            </Typography>
          </Box>
          <Can do={PERMISSIONS.ADD_GRADING_SCHEME}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 2 }}>
              <Button
                variant="contained"
                startIcon={<Iconify icon="mdi:file-document-multiple" />}
                onClick={() => setPresetOpen(true)}
                sx={{ px: 3, boxShadow: theme.customShadows.primary, '&:hover': { boxShadow: 'none' } }}
              >
                New from preset
              </Button>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={() => setEditor({ open: true, scheme: null })}
                sx={{ px: 3 }}
              >
                Blank scheme
              </Button>
            </Stack>
          </Can>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>Error loading grading schemes: {errorMessage(error)}</Alert>}
        {!isLoading && !error && schemes.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No grading schemes yet. Results cannot be computed until each programme has a scheme (or a default scheme exists).
            Start from a preset such as NBTE 4-Point or HND Nursing 5-Point.
          </Alert>
        )}

        <Card
          sx={{
            boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.2)}, 0 12px 24px -4px ${alpha(theme.palette.grey[500], 0.12)}`,
            borderRadius: 2,
          }}
        >
          <GenericTable
            data={schemes}
            columns={columns}
            rowIdField="_id"
            withToolbar={false}
            withPagination={false}
            isLoading={isLoading}
            isFetching={isFetching}
            maxHeight={null}
            onRowClick={(row) => setEditor({ open: true, scheme: row })}
          />
        </Card>
      </Box>

      <PresetDialog
        open={presetOpen}
        onClose={() => setPresetOpen(false)}
        existing={schemes}
        onCreated={(scheme) => {
          refresh();
          setPresetOpen(false);
          setEditor({ open: true, scheme });
        }}
      />

      {editor.open && (
        <GradingSchemeEditor
          open={editor.open}
          scheme={editor.scheme}
          onClose={() => setEditor({ open: false, scheme: null })}
          onSaved={() => refresh()}
          onDuplicate={(id) => {
            setEditor({ open: false, scheme: null });
            duplicate(id);
          }}
        />
      )}

      <Dialog open={Boolean(toDelete)} onClose={() => setToDelete(null)}>
        <DialogTitle>Delete grading scheme</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete &quot;{toDelete?.name}&quot;? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)} disabled={isDeleting}>Cancel</Button>
          <Button color="error" variant="contained" disabled={isDeleting} onClick={() => remove(toDelete._id)}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
