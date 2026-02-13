import * as Yup from 'yup';
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { useSnackbar } from 'notistack';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import LoadingButton from '@mui/lab/LoadingButton';
import {
  Box,
  Grid,
  Fade,
  Modal,
  Stack,
  Button,
  Backdrop,
  useTheme,
  TextField,
  Typography,
  useMediaQuery,
  FormControlLabel,
  Checkbox,
} from '@mui/material';

import { SessionApi } from 'src/api';
import CustomSelect from 'src/components/select';

const SEMESTER_OPTIONS = [
  { name: 'First Semester', _id: 'First Semester' },
  { name: 'Second Semester', _id: 'Second Semester' },
];

const parseDate = (d) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
};

const EditSession = ({ open, setOpen, session }) => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const initialValues = useMemo(
    () => ({
      name: session?.name || '',
      code: session?.code || '',
      currentSemester: session?.currentSemester || 'First Semester',
      startDate: parseDate(session?.startDate),
      endDate: parseDate(session?.endDate),
      isCurrent: Boolean(session?.isCurrent),
    }),
    [session]
  );

  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, data }) => SessionApi.updateSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      enqueueSnackbar('Session updated successfully', { variant: 'success' });
      setOpen(false);
    },
    onError: (error) => {
      const message = error.message || 'Failed to update session';
      enqueueSnackbar(message, { variant: 'error' });
    },
  });

  const validationSchema = Yup.object({
    name: Yup.string().required('Session name is required'),
    code: Yup.string(),
    currentSemester: Yup.string().oneOf(['First Semester', 'Second Semester'], 'Invalid semester'),
    startDate: Yup.date().required('Start date is required'),
    endDate: Yup.date()
      .required('End date is required')
      .min(Yup.ref('startDate'), 'End date must be after start date'),
    isCurrent: Yup.boolean(),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      if (!session?._id) return;
      const payload = {
        name: values.name.trim(),
        code: values.code?.trim() || undefined,
        currentSemester: values.currentSemester || 'First Semester',
        startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
        isCurrent: Boolean(values.isCurrent),
      };
      mutate({ id: session._id, data: payload });
    },
  });

  const handleModalClose = () => setOpen(false);

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: isMobile ? '90%' : 480,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

  if (!session) return null;

  return (
    <Modal
      open={open}
      onClose={handleModalClose}
      closeAfterTransition
      keepMounted={false}
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 500 } }}
    >
      <Fade in={open}>
        <Box sx={modalStyle}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Edit Session
          </Typography>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Session name"
                    name="name"
                    placeholder="e.g. 2024/2025"
                    fullWidth
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Code (optional)"
                    name="code"
                    placeholder="e.g. 2024-25"
                    fullWidth
                    value={formik.values.code}
                    onChange={formik.handleChange}
                    error={formik.touched.code && Boolean(formik.errors.code)}
                    helperText={formik.touched.code && formik.errors.code}
                  />
                </Grid>
                <Grid item xs={12}>
                  <CustomSelect
                    data={SEMESTER_OPTIONS}
                    label="Current semester"
                    name="currentSemester"
                    formik={formik}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start date"
                    name="startDate"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formik.values.startDate}
                    onChange={formik.handleChange}
                    error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                    helperText={formik.touched.startDate && formik.errors.startDate}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End date"
                    name="endDate"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formik.values.endDate}
                    onChange={formik.handleChange}
                    error={formik.touched.endDate && Boolean(formik.errors.endDate)}
                    helperText={formik.touched.endDate && formik.errors.endDate}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="isCurrent"
                        checked={formik.values.isCurrent}
                        onChange={formik.handleChange}
                      />
                    }
                    label="Set as current session"
                  />
                </Grid>
              </Grid>
              <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ pt: 1 }}>
                <Button onClick={handleModalClose}>Cancel</Button>
                <LoadingButton loading={isPending} variant="contained" type="submit">
                  Update Session
                </LoadingButton>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

EditSession.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  session: PropTypes.object,
};

export default EditSession;
