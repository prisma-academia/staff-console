import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';

import { userGroupApi } from 'src/api';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const GROUP_TYPES = [
  { value: 'department', label: 'Department' },
  { value: 'union', label: 'Union' },
  { value: 'custom', label: 'Custom' },
];

export default function EditGroup({ open, onClose, group }) {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => userGroupApi.updateGroup(group._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      enqueueSnackbar('Group updated successfully', { variant: 'success' });
      onClose();
    },
    onError: (error) => {
      enqueueSnackbar(error.message || 'Failed to update group', { variant: 'error' });
    },
  });

  const validationSchema = Yup.object({
    name: Yup.string().required('Group name is required'),
    description: Yup.string(),
    type: Yup.string().required('Group type is required'),
    isActive: Yup.boolean(),
  });

  const formik = useFormik({
    initialValues: {
      name: group?.name || '',
      description: group?.description || '',
      type: group?.type || 'custom',
      isActive: group?.isActive ?? true,
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: (values) => {
      mutate(values);
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Edit Group</Typography>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Group Name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Group Type"
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
                error={formik.touched.type && Boolean(formik.errors.type)}
                helperText={formik.touched.type && formik.errors.type}
              >
                {GROUP_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formik.values.description}
                onChange={formik.handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isActive"
                    checked={formik.values.isActive}
                    onChange={formik.handleChange}
                  />
                }
                label="Group is active"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button color="inherit" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isPending}
          >
            Update Group
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

EditGroup.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  group: PropTypes.object,
};

