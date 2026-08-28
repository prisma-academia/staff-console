import { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Menu,
  Alert,
  Stack,
  Button,
  Select,
  Dialog,
  Divider,
  MenuItem,
  InputLabel,
  Typography,
  FormControl,
  DialogTitle,
  ListItemText,
  ListItemIcon,
  DialogActions,
  DialogContent,
} from '@mui/material';

import { usePermissions } from 'src/utils/permissions';
import { formatProgrammeLabel } from 'src/utils/format-programme';

import { PERMISSIONS } from 'src/permissions/constants';
import { StudentApi, programApi, classLevelApi } from 'src/api';

import Iconify from 'src/components/iconify';

// Each bulk action describes how it is labelled, what it needs from the user and
// which StudentApi call performs it.
const ACTIONS = {
  moveClass: {
    label: 'Move to another class',
    icon: 'eva:swap-fill',
    permission: PERMISSIONS.EDIT_STUDENT,
    field: 'class',
    confirmLabel: 'Move students',
  },
  moveProgramme: {
    label: 'Move to another programme',
    icon: 'eva:shuffle-2-fill',
    permission: PERMISSIONS.EDIT_STUDENT,
    field: 'programme',
    confirmLabel: 'Move students',
  },
  activate: {
    label: 'Activate students',
    icon: 'eva:checkmark-circle-2-fill',
    permission: PERMISSIONS.EDIT_STUDENT,
    field: null,
    confirmLabel: 'Activate',
  },
  disable: {
    label: 'Disable students',
    icon: 'eva:slash-fill',
    permission: PERMISSIONS.EDIT_STUDENT,
    field: null,
    confirmLabel: 'Disable',
  },
  delete: {
    label: 'Delete students',
    icon: 'eva:trash-2-fill',
    permission: PERMISSIONS.DELETE_STUDENT,
    field: null,
    confirmLabel: 'Delete',
    destructive: true,
  },
};

export default function StudentBulkActions({ selected = [], onCompleted = () => {} }) {
  const { check } = usePermissions();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [anchorEl, setAnchorEl] = useState(null);
  const [action, setAction] = useState(null);
  const [targetId, setTargetId] = useState('');

  const activeAction = action ? ACTIONS[action] : null;

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: programApi.getPrograms,
    enabled: action === 'moveProgramme',
  });

  const { data: classLevels = [] } = useQuery({
    queryKey: ['classLevels'],
    queryFn: classLevelApi.getClassLevels,
    enabled: action === 'moveClass',
  });

  const { mutate: runAction, isPending } = useMutation({
    mutationFn: () => {
      const studentIds = selected;
      switch (action) {
        case 'moveClass':
          return StudentApi.bulkMoveStudents({ studentIds, classId: targetId });
        case 'moveProgramme':
          return StudentApi.bulkMoveStudents({ studentIds, programmeId: targetId });
        case 'activate':
          return StudentApi.bulkUpdateStudentStatus({ studentIds, status: 'active' });
        case 'disable':
          return StudentApi.bulkUpdateStudentStatus({ studentIds, status: 'disable' });
        case 'delete':
          return StudentApi.bulkDeleteStudents({ studentIds });
        default:
          return Promise.reject(new Error('Unknown bulk action'));
      }
    },
    onSuccess: (data) => {
      const affected = data?.moved ?? data?.updated ?? data?.deleted ?? selected.length;
      enqueueSnackbar(`${affected} student(s) updated`, { variant: 'success' });
      if (data?.unchanged) {
        enqueueSnackbar(`${data.unchanged} student(s) already had that value`, { variant: 'info' });
      }
      if (data?.notFound?.length) {
        enqueueSnackbar(`${data.notFound.length} student(s) could not be found`, {
          variant: 'warning',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['students'] });
      handleCloseDialog();
      onCompleted();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Bulk action failed', { variant: 'error' });
    },
  });

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleSelectAction = (key) => {
    setAction(key);
    setTargetId('');
    setAnchorEl(null);
  };

  const handleCloseDialog = () => {
    if (isPending) return;
    setAction(null);
    setTargetId('');
  };

  const availableActions = Object.entries(ACTIONS).filter(([, value]) => check(value.permission));

  if (availableActions.length === 0) return null;

  const requiresTarget = Boolean(activeAction?.field);
  const canConfirm = selected.length > 0 && (!requiresTarget || Boolean(targetId));

  return (
    <>
      <Button
        color="inherit"
        onClick={handleOpenMenu}
        startIcon={<Iconify icon="eva:options-2-fill" />}
        endIcon={<Iconify icon="eva:chevron-down-fill" />}
        sx={{ mr: 1, flexShrink: 0 }}
      >
        Bulk Actions
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        {availableActions.map(([key, value]) => [
          key === 'delete' && <Divider key="bulk-action-divider" sx={{ my: 0.5 }} />,
          <MenuItem
            key={key}
            onClick={() => handleSelectAction(key)}
            sx={value.destructive ? { color: 'error.main' } : undefined}
          >
            <ListItemIcon sx={value.destructive ? { color: 'error.main' } : undefined}>
              <Iconify icon={value.icon} />
            </ListItemIcon>
            <ListItemText>{value.label}</ListItemText>
          </MenuItem>,
        ])}
      </Menu>

      <Dialog open={Boolean(action)} onClose={handleCloseDialog} fullWidth maxWidth="xs">
        <DialogTitle>{activeAction?.label}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              This affects {selected.length} selected student(s).
            </Typography>

            {activeAction?.field === 'class' && (
              <FormControl fullWidth size="small">
                <InputLabel>Class Level</InputLabel>
                <Select
                  label="Class Level"
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                >
                  {classLevels.map((level) => (
                    <MenuItem key={level._id} value={level._id}>
                      {level.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {activeAction?.field === 'programme' && (
              <FormControl fullWidth size="small">
                <InputLabel>Programme</InputLabel>
                <Select
                  label="Programme"
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                >
                  {programs.map((program) => (
                    <MenuItem key={program._id} value={program._id}>
                      {formatProgrammeLabel(program)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {activeAction?.destructive && (
              <Alert severity="error">
                Deleted students cannot be recovered. Consider disabling them instead.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={handleCloseDialog} disabled={isPending}>
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            color={activeAction?.destructive ? 'error' : 'primary'}
            loading={isPending}
            disabled={!canConfirm}
            onClick={() => runAction()}
          >
            {activeAction?.confirmLabel}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}

StudentBulkActions.propTypes = {
  selected: PropTypes.array,
  onCompleted: PropTypes.func,
};
